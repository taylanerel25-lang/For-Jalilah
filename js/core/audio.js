/* Superstar World - sounds (made by the game itself), music and a friendly talking voice.
   RF.sfx.play('pop')    RF.music.song('file.mp3') / RF.music.ambient() / RF.music.stop()    RF.voice.say('Well done!') */
(function (RF) {
    'use strict';
    const U = RF.util;
    const MUTED = { music: false, sfx: false, voice: false, musicVolume: 0, sfxVolume: 0 };
    // ?mute=1 in the address turns every sound off (handy for testing) without changing saved settings
    const settings = () => (RF.util.params.mute ? MUTED
        : RF.store && RF.store.data ? RF.store.settings : { music: true, sfx: true, voice: true, musicVolume: 0.55, sfxVolume: 0.9 });

    // ---------------- Web Audio set-up ----------------
    let ac = null;
    let sfxGain = null;
    let ambientGain = null;
    let noiseBuffer = null;
    let coinBuffer = null;
    let unlocked = false;

    // Not created until the first tap (browsers block sound before that anyway)
    function audioCtx() {
        if (ac) return ac;
        if (!unlocked) return null;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        try {
            ac = new AC();
        } catch (e) {
            return null;
        }
        const comp = ac.createDynamicsCompressor();
        comp.threshold.value = -14;
        comp.ratio.value = 6;
        comp.connect(ac.destination);
        sfxGain = ac.createGain();
        sfxGain.gain.value = settings().sfxVolume;
        sfxGain.connect(comp);
        ambientGain = ac.createGain();
        ambientGain.gain.value = 0;
        ambientGain.connect(comp);
        const len = Math.floor(ac.sampleRate * 1);
        noiseBuffer = ac.createBuffer(1, len, ac.sampleRate);
        const d = noiseBuffer.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        loadCoinSound();
        return ac;
    }

    function loadCoinSound() {
        // The uncle's original coin sound. If it can't be loaded (e.g. opened from a folder) we make one instead.
        if (!window.fetch || location.protocol === 'file:') return;
        fetch('assets/audio/coin.mp3')
            .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject()))
            .then((buf) => new Promise((res, rej) => ac.decodeAudioData(buf, res, rej)))
            .then((decoded) => { coinBuffer = decoded; })
            .catch(() => {});
    }

    // Browsers only allow sound after the first tap - get everything ready then.
    function unlock() {
        const first = !unlocked;
        unlocked = true;
        const a = audioCtx();
        if (a && a.state !== 'running') a.resume().catch(() => {});
        if (!first) return;
        applySessionType();
        try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) { /* keeps saves safer on iPad */ }
        if (a) {
            const src = a.createBufferSource();
            src.buffer = a.createBuffer(1, 1, 22050);
            src.connect(a.destination);
            src.start(0);
        }
        RF.voice._unlock();
        RF.music._retry();
    }
    ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'].forEach((ev) =>
        window.addEventListener(ev, unlock, { capture: true, passive: true }));

    function now() { return ac ? ac.currentTime : 0; }

    // Grown-ups can choose whether the game plays when the iPhone's silent switch is on
    function applySessionType() {
        try {
            if (navigator.audioSession) navigator.audioSession.type = settings().silentSwitch ? 'ambient' : 'playback';
        } catch (e) { /* not supported */ }
    }

    // One synth note: frequency slides from f to f2
    function tone({ f = 440, f2 = null, type = 'sine', dur = 0.15, vol = 0.2, attack = 0.008, delay = 0, vibrato = 0, dest = null }) {
        const a = audioCtx();
        if (!a) return;
        const t = now() + delay;
        const osc = a.createOscillator();
        const g = a.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(f, t);
        if (f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
        if (vibrato) {
            const lfo = a.createOscillator();
            const lg = a.createGain();
            lfo.frequency.value = 7;
            lg.gain.value = vibrato;
            lfo.connect(lg).connect(osc.frequency);
            lfo.start(t);
            lfo.stop(t + dur + 0.05);
        }
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + attack);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(g).connect(dest || sfxGain);
        osc.start(t);
        osc.stop(t + dur + 0.05);
    }

    // A puff of filtered noise (pops, splashes, whooshes)
    function noise({ dur = 0.2, vol = 0.2, type = 'bandpass', freq = 1000, freq2 = null, q = 1, delay = 0 }) {
        const a = audioCtx();
        if (!a) return;
        const t = now() + delay;
        const src = a.createBufferSource();
        src.buffer = noiseBuffer;
        const filter = a.createBiquadFilter();
        filter.type = type;
        filter.Q.value = q;
        filter.frequency.setValueAtTime(freq, t);
        if (freq2) filter.frequency.exponentialRampToValueAtTime(freq2, t + dur);
        const g = a.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        src.connect(filter).connect(g).connect(sfxGain);
        src.start(t, Math.random() * 0.5);
        src.stop(t + dur + 0.05);
    }

    const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);

    // Musical notes for the piano and friends. note: midi number (60 = middle C)
    function note(midi, instrument = 'piano', vol = 0.22, delay = 0, dest = null) {
        const a = audioCtx();
        if (!a) return;
        const f = midiToFreq(midi);
        const t = now() + delay;
        const out = dest || sfxGain;
        const g = a.createGain();
        g.connect(out);
        const partials = {
            piano: [[1, 'triangle', 1], [2, 'sine', 0.35], [3, 'sine', 0.12]],
            bell: [[1, 'sine', 1], [2.76, 'sine', 0.3], [5.4, 'sine', 0.12]],
            xylo: [[1, 'sine', 1], [3.93, 'sine', 0.25]],
            flute: [[1, 'sine', 1], [2, 'sine', 0.08]],
            pluck: [[1, 'triangle', 1], [2, 'triangle', 0.2]]
        }[instrument] || [[1, 'sine', 1]];
        const decay = { piano: 1.3, bell: 1.8, xylo: 0.5, flute: 0.9, pluck: 0.45 }[instrument] || 1;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + (instrument === 'flute' ? 0.05 : 0.006));
        g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
        partials.forEach(([ratio, type, amp]) => {
            const osc = a.createOscillator();
            const pg = a.createGain();
            osc.type = type;
            osc.frequency.value = f * ratio;
            pg.gain.value = amp;
            osc.connect(pg).connect(g);
            osc.start(t);
            osc.stop(t + decay + 0.05);
        });
    }

    const SOUNDS = {
        tap() { tone({ f: 620, f2: 860, dur: 0.07, vol: 0.12 }); },
        click() { tone({ f: 1200, dur: 0.03, vol: 0.06, type: 'triangle' }); },
        pop() {
            const k = U.rand(0.85, 1.2);
            noise({ dur: 0.08, vol: 0.35, freq: 1800 * k, freq2: 500, q: 0.8 });
            tone({ f: 520 * k, f2: 130, type: 'triangle', dur: 0.09, vol: 0.14 });
        },
        coin() {
            const a = audioCtx();
            if (a && coinBuffer) {
                const src = a.createBufferSource();
                const g = a.createGain();
                g.gain.value = 0.55;
                src.buffer = coinBuffer;
                src.connect(g).connect(sfxGain);
                src.start();
            } else {
                tone({ f: 988, type: 'square', dur: 0.08, vol: 0.06 });
                tone({ f: 1319, type: 'square', dur: 0.3, vol: 0.06, delay: 0.07 });
            }
        },
        jewel() { [1319, 1568, 2093, 2637].forEach((f, i) => tone({ f, dur: 0.3, vol: 0.09, delay: i * 0.055 })); },
        heart() {
            tone({ f: 880, f2: 1320, dur: 0.14, vol: 0.1 });
            tone({ f: 1320, f2: 1760, dur: 0.18, vol: 0.08, delay: 0.07 });
        },
        flap() {
            tone({ f: 320, f2: 640, type: 'triangle', dur: 0.09, vol: 0.06 });
            noise({ dur: 0.08, vol: 0.05, type: 'highpass', freq: 2500 });
        },
        whoosh() { noise({ dur: 0.35, vol: 0.14, freq: 400, freq2: 2600, q: 1.2 }); },
        boing() { tone({ f: 520, f2: 160, type: 'triangle', dur: 0.28, vol: 0.12, vibrato: 18 }); },
        tada() {
            [523, 659, 784, 1047].forEach((f, i) => tone({ f, type: 'triangle', dur: 0.45, vol: 0.1, delay: i * 0.09 }));
            tone({ f: 1568, dur: 0.6, vol: 0.05, delay: 0.36 });
        },
        fanfare() {
            [[523, 0], [659, 0.12], [784, 0.24], [1047, 0.36], [784, 0.52], [1047, 0.64]].forEach(([f, d]) =>
                tone({ f, type: 'triangle', dur: d > 0.6 ? 0.8 : 0.25, vol: 0.11, delay: d }));
            [1319, 1568, 2093].forEach((f, i) => tone({ f, dur: 0.9, vol: 0.04, delay: 0.64 + i * 0.03 }));
        },
        star() { [1568, 2093, 2637, 3136, 4186].forEach((f, i) => tone({ f, dur: 0.5, vol: 0.05, delay: i * 0.06 })); },
        sparkle() { for (let i = 0; i < 5; i++) tone({ f: U.rand(2000, 4200), dur: 0.12, vol: 0.035, delay: i * 0.05 }); },
        splash() {
            noise({ dur: 0.35, vol: 0.2, type: 'lowpass', freq: 1400, freq2: 250 });
            tone({ f: 240, f2: 90, dur: 0.2, vol: 0.06 });
        },
        magic() {
            tone({ f: 600, f2: 1800, dur: 0.55, vol: 0.07, vibrato: 25 });
            SOUNDS.sparkle();
        },
        camera() {
            noise({ dur: 0.05, vol: 0.25, type: 'highpass', freq: 3000 });
            noise({ dur: 0.08, vol: 0.18, type: 'highpass', freq: 2000, delay: 0.09 });
        },
        chomp() {
            noise({ dur: 0.07, vol: 0.2, type: 'lowpass', freq: 900 });
            noise({ dur: 0.07, vol: 0.2, type: 'lowpass', freq: 800, delay: 0.14 });
        },
        bubble() { const b = U.rand(260, 420); tone({ f: b, f2: b * 3, dur: 0.09, vol: 0.1 }); },
        squeak() {
            tone({ f: 1100, f2: 1600, dur: 0.1, vol: 0.07, type: 'triangle' });
            tone({ f: 1600, f2: 1050, dur: 0.14, vol: 0.06, type: 'triangle', delay: 0.1 });
        },
        bark() {
            [0, 0.18].forEach((d) => {
                tone({ f: 380, f2: 240, type: 'square', dur: 0.09, vol: 0.05, delay: d });
                noise({ dur: 0.08, vol: 0.1, freq: 700, q: 2, delay: d });
            });
        },
        meow() { tone({ f: 620, f2: 900, type: 'sawtooth', dur: 0.14, vol: 0.03 }); tone({ f: 900, f2: 520, type: 'sawtooth', dur: 0.3, vol: 0.03, delay: 0.13 }); },
        nope() {
            tone({ f: 440, f2: 360, dur: 0.14, vol: 0.09 });
            tone({ f: 360, f2: 300, dur: 0.18, vol: 0.08, delay: 0.13 });
        },
        swish() { noise({ dur: 0.18, vol: 0.1, freq: 2600, freq2: 500, q: 0.9 }); },
        kick() { tone({ f: 150, f2: 45, dur: 0.18, vol: 0.4 }); },
        snare() { noise({ dur: 0.14, vol: 0.18, type: 'highpass', freq: 1500 }); tone({ f: 190, dur: 0.06, vol: 0.06, type: 'triangle' }); },
        hat() { noise({ dur: 0.04, vol: 0.07, type: 'highpass', freq: 7000 }); },
        slurp() { tone({ f: 300, f2: 700, dur: 0.25, vol: 0.06, type: 'sawtooth', vibrato: 40 }); },
        snore() { noise({ dur: 0.6, vol: 0.06, type: 'lowpass', freq: 400, freq2: 200 }); },
        door() { tone({ f: 330, f2: 500, dur: 0.12, vol: 0.08, type: 'triangle' }); tone({ f: 660, dur: 0.2, vol: 0.06, delay: 0.1 }); },
        whistle() { tone({ f: 1200, f2: 1900, dur: 0.18, vol: 0.05 }); tone({ f: 1900, f2: 1300, dur: 0.22, vol: 0.05, delay: 0.19 }); }
    };

    const lastPlayed = {};
    RF.sfx = {
        // name from SOUNDS above. Same sound twice within 30ms is skipped so bursts don't get loud.
        play(name) {
            if (!settings().sfx) return;
            const fn = SOUNDS[name];
            if (!fn || !audioCtx()) return;
            const t = performance.now();
            if (lastPlayed[name] && t - lastPlayed[name] < 30) return;
            lastPlayed[name] = t;
            try { fn(); } catch (e) { /* audio not ready */ }
        },
        note(midi, instrument = 'piano', vol = 0.22) {
            if (!settings().sfx || !audioCtx()) return;
            try { note(midi, instrument, vol); } catch (e) { /* ignore */ }
        },
        names: Object.keys(SOUNDS),
        midiToFreq,
        get context() { return audioCtx(); }
    };

    // ---------------- Music ----------------
    const songEl = new Audio();
    songEl.loop = true;
    songEl.preload = 'auto';
    let songSrc = null;
    let wantSong = false;
    let ducked = false;
    let fadeTimer = null;
    let ambientTimer = null;
    let ambientStep = 0;
    let ambientNextTime = 0;
    let wantAmbient = false;
    let songGain = null; // on iPhone/iPad the <audio> volume can't be changed, so the song goes through Web Audio

    function routeSong() {
        if (songGain || location.protocol === 'file:') return;
        const a = audioCtx();
        if (!a || !a.createMediaElementSource) return;
        try {
            const srcNode = a.createMediaElementSource(songEl);
            songGain = a.createGain();
            songGain.gain.value = 0;
            srcNode.connect(songGain).connect(a.destination);
        } catch (e) { songGain = null; }
    }
    function getSongVol() { return songGain ? songGain.gain.value : songEl.volume; }
    function setSongVol(v) {
        v = U.clamp(v, 0, 1);
        if (songGain) {
            songGain.gain.cancelScheduledValues(now());
            songGain.gain.value = v;
            songEl.volume = 1;
        } else {
            songEl.volume = v;
        }
    }

    function songVolume() { return settings().musicVolume * (ducked ? 0.35 : 1); }

    function fadeSong(to, ms, done) {
        clearInterval(fadeTimer);
        const from = getSongVol();
        const start = performance.now();
        fadeTimer = setInterval(() => {
            const k = Math.min(1, (performance.now() - start) / ms);
            setSongVol(from + (to - from) * k);
            if (k >= 1) {
                clearInterval(fadeTimer);
                if (done) done();
            }
        }, 30);
    }

    // Gentle music-box tune for menus and the town (made by the game, so no files needed)
    const AMBIENT_TUNE = [
        [72, 76], [79], [76], [74, 77], [72], [74], [76, 79], null,
        [77, 81], [76], [74], [72, 76], [74], [67], [72, 76], null,
        [72, 76], [79], [81], [79, 84], [77], [76], [74, 77], null,
        [76, 79], [74], [72], [71, 74], [72], [67], [72, 76, 79], null
    ];
    const AMBIENT_BASS = [48, null, 55, null, 53, null, 55, null];
    function scheduleAmbient() {
        const a = audioCtx();
        if (!a || !wantAmbient || !settings().music || document.hidden) return;
        const stepLen = 0.34;
        if (ambientNextTime < a.currentTime) ambientNextTime = a.currentTime + 0.05;
        while (ambientNextTime < a.currentTime + 0.4) {
            const i = ambientStep % AMBIENT_TUNE.length;
            const notes = AMBIENT_TUNE[i];
            const delay = ambientNextTime - a.currentTime;
            if (notes) notes.forEach((m) => note(m, 'bell', 0.07, delay, ambientGain));
            const bass = AMBIENT_BASS[i % AMBIENT_BASS.length];
            if (bass && i % 4 === 0) note(bass, 'flute', 0.06, delay, ambientGain);
            ambientStep++;
            ambientNextTime += stepLen;
        }
    }
    function setAmbientGain() {
        if (!ambientGain) return;
        const target = wantAmbient && settings().music && !document.hidden ? settings().musicVolume * (ducked ? 0.35 : 1) * 0.9 : 0;
        ambientGain.gain.setTargetAtTime(target, now(), 0.15);
    }

    RF.music = {
        // Plays an mp3 on repeat (keeps playing if it's already the one playing)
        song(src) {
            RF.music.stopAmbient();
            wantSong = true;
            if (songSrc !== src) {
                songSrc = src;
                songEl.src = src;
                songEl.currentTime = 0;
            }
            if (!settings().music) return;
            routeSong();
            setSongVol(0);
            const p = songEl.play();
            if (p && p.then) p.then(() => fadeSong(songVolume(), 400)).catch(() => {});
            else fadeSong(songVolume(), 400);
        },
        ambient() {
            RF.music.stopSong();
            wantAmbient = true;
            audioCtx();
            if (!ambientTimer) ambientTimer = setInterval(scheduleAmbient, 120);
            setAmbientGain();
        },
        stopSong() {
            wantSong = false;
            if (!songEl.paused) fadeSong(0, 300, () => songEl.pause());
        },
        stopAmbient() {
            wantAmbient = false;
            setAmbientGain();
            clearInterval(ambientTimer);
            ambientTimer = null;
        },
        stop() {
            RF.music.stopSong();
            RF.music.stopAmbient();
        },
        duck(on) {
            ducked = on;
            if (wantSong && !songEl.paused) fadeSong(songVolume(), 200);
            setAmbientGain();
        },
        get playingSong() { return wantSong ? songSrc : null; },
        _retry() {
            if (wantSong && settings().music && songEl.paused && songSrc) RF.music.song(songSrc);
            if (wantAmbient) setAmbientGain();
        }
    };
    songEl.addEventListener('error', () => console.warn('Could not play music:', songSrc));

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            songEl.pause();
            if (ac) ac.suspend().catch(() => {});
            if (window.speechSynthesis) speechSynthesis.cancel();
        } else {
            if (ac) ac.resume().catch(() => {});
            RF.music._retry();
        }
        setAmbientGain();
    });

    // ---------------- Talking voice ----------------
    const synth = window.speechSynthesis || null;
    let chosenVoice = null;
    const PREFERRED = ['Samantha', 'Karen', 'Moira', 'Tessa', 'Serena', 'Google UK English Female', 'Microsoft Libby', 'Microsoft Sonia',
        'Microsoft Aria', 'Microsoft Jenny', 'Google US English', 'Victoria', 'Fiona'];
    function pickVoice() {
        if (!synth) return;
        const voices = synth.getVoices().filter((v) => /^en[-_]/i.test(v.lang) || v.lang === 'en');
        if (!voices.length) return;
        for (const name of PREFERRED) {
            const v = voices.find((vv) => vv.name.indexOf(name) === 0 || vv.name.indexOf(name) >= 0);
            if (v) { chosenVoice = v; return; }
        }
        chosenVoice = voices.find((v) => /GB|AU/i.test(v.lang)) || voices[0];
    }
    if (synth) {
        pickVoice();
        if (synth.addEventListener) synth.addEventListener('voiceschanged', pickVoice);
        else synth.onvoiceschanged = pickVoice;
    }
    let voiceUnlocked = false;
    let speakingCount = 0;

    RF.voice = {
        // Says something out loud (helps children who are still learning to read)
        say(text, { interrupt = true, rate = 0.95, pitch = 1.15 } = {}) {
            if (!synth || !settings().voice || !text) return;
            try {
                if (interrupt) synth.cancel();
                const u = new SpeechSynthesisUtterance(String(text).replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, ''));
                if (chosenVoice) u.voice = chosenVoice;
                u.lang = chosenVoice ? chosenVoice.lang : 'en-GB';
                u.rate = rate;
                u.pitch = pitch;
                u.volume = 1;
                u.onstart = () => { speakingCount++; RF.music.duck(true); };
                const end = () => { speakingCount = Math.max(0, speakingCount - 1); if (!speakingCount) RF.music.duck(false); };
                u.onend = end;
                u.onerror = end;
                synth.speak(u);
            } catch (e) { /* no voice on this device */ }
        },
        cancel() {
            if (synth) synth.cancel();
            speakingCount = 0;
            RF.music.duck(false);
        },
        get available() { return !!synth; },
        _unlock() {
            if (voiceUnlocked || !synth) return;
            voiceUnlocked = true;
            try {
                const u = new SpeechSynthesisUtterance(' ');
                u.volume = 0;
                synth.speak(u);
            } catch (e) { /* ignore */ }
        }
    };

    // Apply settings changes straight away
    function applySettings() {
        if (unlocked) applySessionType();
        if (sfxGain) sfxGain.gain.value = settings().sfxVolume;
        if (!settings().music) {
            songEl.pause();
        } else {
            RF.music._retry();
            if (wantSong) setSongVol(songVolume());
        }
        setAmbientGain();
        if (!settings().voice) RF.voice.cancel();
    }
    RF.events.on('settings', applySettings);
})(window.RF);
