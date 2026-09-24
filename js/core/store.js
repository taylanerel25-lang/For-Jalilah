/* Superstar World - saved progress. Every girl has her own coins, clothes, house, pets and stickers.
   Everything is kept in localStorage under one key and saved automatically. */
(function (RF) {
    'use strict';
    const U = RF.util;
    const KEY = 'superstar-world-v1';

    // ---------- Tiny event bus: RF.events.on('wallet', fn) ----------
    const handlers = {};
    RF.events = {
        on(ev, fn) {
            (handlers[ev] = handlers[ev] || []).push(fn);
            return () => RF.events.off(ev, fn);
        },
        off(ev, fn) {
            const list = handlers[ev];
            if (!list) return;
            const i = list.indexOf(fn);
            if (i >= 0) list.splice(i, 1);
        },
        emit(ev, data) {
            const list = handlers[ev];
            if (!list) return;
            list.slice().forEach((fn) => {
                try { fn(data); } catch (e) { console.error(e); }
            });
        }
    };

    function readRaw(k) {
        try { return localStorage.getItem(k); } catch (e) { return null; }
    }
    function writeRaw(k, v) {
        try { localStorage.setItem(k, v); return true; } catch (e) { return false; }
    }

    const reducedMotion = (() => {
        try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
    })();
    const DEFAULT_SETTINGS = {
        music: true, sfx: true, voice: true,
        musicVolume: 0.45, sfxVolume: 0.8,
        calm: reducedMotion,     // fewer sparkles and no shaking
        silentSwitch: false,     // true = stay quiet when the iPhone's silent switch is on
        breakMinutes: 0          // 0 = no break reminder
    };

    function newProfile(girl) {
        return {
            coins: 30,          // a little welcome gift so they can buy something straight away
            jewels: 0,
            stars: 0,
            owned: {},          // itemId -> true
            outfit: U.clone(girl.outfit || RF.data.DEFAULT_OUTFIT),
            pet: null,          // itemId of the pet that follows her around
            trail: null,        // itemId of the flying trail
            house: { wallpaper: null, floor: null, items: [] }, // items: [{ uid, id, x, y, scale, flip }]
            pets: {},           // itemId -> { food, clean, fun, sleepy } each 0..100
            counters: {},       // event name -> number
            sets: {},           // event name -> { key: true } for "visit every place" style missions
            missions: {},       // missionId -> day completed
            newStickers: {},    // missionId -> true until seen in the sticker book
            bests: {},          // game -> best score
            daily: { lastCheck: null, pending: 0 },
            seen: {},           // one-off tips already shown
            levels: {},         // game -> difficulty level that adapts to her (never shown as a rank)
            gallery: [],        // Style Studio photos: [{ outfit, pet, day }] newest first, max 12
            art: [],            // saved colouring pictures (small data, not images), newest first
            petNames: {}        // petId -> name she picked
        };
    }

    // Make sure a profile loaded from an older save has every field
    function normalize(p, girl) {
        const fresh = newProfile(girl);
        for (const k in fresh) {
            if (p[k] === undefined || p[k] === null || typeof p[k] !== typeof fresh[k]) {
                if (!(k === 'pet' || k === 'trail')) p[k] = fresh[k];
                else if (p[k] === undefined) p[k] = null;
            }
        }
        if (!Array.isArray(p.house.items)) p.house.items = [];
        for (const slot in RF.data.DEFAULT_OUTFIT) {
            if (!(slot in p.outfit)) p.outfit[slot] = U.clone(RF.data.DEFAULT_OUTFIT[slot]);
        }
        ['coins', 'jewels', 'stars'].forEach((c) => {
            p[c] = Math.max(0, Math.floor(Number(p[c]) || 0));
        });
        return p;
    }

    // Progress saved by the very first version of the game (one shared wallet)
    function readLegacy() {
        const coins = parseInt(readRaw('coins'), 10);
        const jewels = parseInt(readRaw('jewellery'), 10);
        let inventory = [];
        let equipped = {};
        try { inventory = JSON.parse(readRaw('inventory')) || []; } catch (e) { inventory = []; }
        try { equipped = JSON.parse(readRaw('equipped')) || {}; } catch (e) { equipped = {}; }
        if (!equipped || typeof equipped !== 'object') equipped = {};
        if (!equipped.pet && readRaw('equippedPet')) equipped.pet = readRaw('equippedPet');
        if (!equipped.hat && readRaw('equippedAccessory')) equipped.hat = readRaw('equippedAccessory');
        if (isNaN(coins) && isNaN(jewels) && !inventory.length) return null;
        return {
            coins: isNaN(coins) ? 0 : coins,
            jewels: isNaN(jewels) ? 0 : jewels,
            inventory: Array.isArray(inventory) ? inventory : [],
            equipped
        };
    }
    const LEGACY_IDS = {
        kitten: 'pet-kitten', puppy: 'pet-puppy', unicorn: 'pet-unicorn', crown: 'hat-crown',
        rainbowWings: 'back-rainbow-wings', sparkleTrail: 'trail-sparkle'
    };

    function applyLegacy(p, legacy) {
        p.coins = Math.max(p.coins, legacy.coins);
        p.jewels = Math.max(p.jewels, legacy.jewels);
        legacy.inventory.forEach((old) => {
            const id = LEGACY_IDS[old];
            if (id && RF.data.item(id)) p.owned[id] = true;
        });
        const eq = legacy.equipped;
        if (eq.pet && LEGACY_IDS[eq.pet] && p.owned[LEGACY_IDS[eq.pet]]) p.pet = LEGACY_IDS[eq.pet];
        if (eq.hat === 'crown' && p.owned['hat-crown']) p.outfit.hat = { id: 'hat-crown' };
        if (eq.wings === 'rainbowWings' && p.owned['back-rainbow-wings']) p.outfit.back = { id: 'back-rainbow-wings' };
        if (eq.trail === 'sparkleTrail' && p.owned['trail-sparkle']) p.trail = 'trail-sparkle';
    }

    const TEAM_GOAL = 150;
    const S = { data: null };
    let saveTimer = null;

    S.load = function () {
        let data = null;
        try { data = JSON.parse(readRaw(KEY)); } catch (e) { data = null; }
        if (!data || typeof data !== 'object' || !data.profiles) {
            data = { version: 1, settings: U.clone(DEFAULT_SETTINGS), current: null, profiles: {}, team: null, legacyChecked: false };
            RF.data.GIRLS.forEach((g) => {
                data.profiles[g.id] = newProfile(g);
            });
        }
        // Bring over coins and things from the very first version of the game (only once)
        if (!data.legacyChecked) {
            data.legacyChecked = true;
            const legacy = readLegacy();
            if (legacy) {
                RF.data.GIRLS.forEach((g) => {
                    if (data.profiles[g.id]) applyLegacy(normalize(data.profiles[g.id], g), legacy);
                });
            }
        }
        data.settings = Object.assign(U.clone(DEFAULT_SETTINGS), data.settings || {});
        if (!data.team || typeof data.team !== 'object') data.team = { hearts: 0, goal: TEAM_GOAL, filled: 0 };
        RF.data.GIRLS.forEach((g) => {
            data.profiles[g.id] = normalize(data.profiles[g.id] || newProfile(g), g);
        });
        if (!data.profiles[data.current]) data.current = null;
        S.data = data;
        S.flush();
        return data;
    };

    // Saves soon (batched), and for sure when the page is hidden or closed
    S.save = function () {
        if (saveTimer) return;
        saveTimer = setTimeout(S.flush, 250);
    };
    S.flush = function () {
        clearTimeout(saveTimer);
        saveTimer = null;
        if (S.data) writeRaw(KEY, JSON.stringify(S.data));
    };
    document.addEventListener('visibilitychange', () => { if (document.hidden) S.flush(); });
    window.addEventListener('pagehide', () => S.flush());

    Object.defineProperty(S, 'settings', { get: () => S.data.settings });
    Object.defineProperty(S, 'current', { get: () => S.data.current });

    S.setSetting = function (key, value) {
        S.data.settings[key] = value;
        S.save();
        RF.events.emit('settings', { key, value });
    };

    S.setCurrent = function (girlId) {
        if (!S.data.profiles[girlId]) return;
        S.data.current = girlId;
        S.save();
        RF.events.emit('girl', girlId);
    };

    S.girl = (id = S.current) => RF.data.girl(id);
    S.profile = (id = S.current) => S.data.profiles[id] || null;

    // ---------- Money: 'coins', 'jewels', 'stars' ----------
    S.get = (currency, id = S.current) => {
        const p = S.profile(id);
        return p ? p[currency] || 0 : 0;
    };
    S.add = function (currency, n, id = S.current) {
        const p = S.profile(id);
        n = Math.floor(n);
        if (!p || !n || n < 0) return;
        p[currency] = (p[currency] || 0) + n;
        if (currency === 'coins') S.track('coins-earned', n, id);
        S.save();
        RF.events.emit('wallet', { girl: id, currency, amount: n });
    };
    S.spend = function (currency, n, id = S.current) {
        const p = S.profile(id);
        if (!p || (p[currency] || 0) < n) return false;
        p[currency] -= n;
        S.save();
        RF.events.emit('wallet', { girl: id, currency, amount: -n });
        return true;
    };

    // ---------- Things you can own ----------
    S.item = (itemId) => RF.data.item(itemId);
    S.owns = function (itemId, id = S.current) {
        const item = RF.data.item(itemId);
        if (!item) return false;
        if (!item.price) return true; // free things belong to everyone
        const p = S.profile(id);
        return !!(p && p.owned[itemId]);
    };
    S.give = function (itemId, id = S.current) {
        const p = S.profile(id);
        const item = RF.data.item(itemId);
        if (!p || !item) return;
        p.owned[itemId] = true;
        S.save();
        RF.events.emit('owned', { girl: id, itemId });
    };
    // Returns { ok: true } or { ok: false, reason: 'owned' | 'poor' | 'locked', need }
    S.buy = function (itemId, id = S.current) {
        const item = RF.data.item(itemId);
        const p = S.profile(id);
        if (!item || !p) return { ok: false, reason: 'missing' };
        if (S.owns(itemId, id)) return { ok: false, reason: 'owned' };
        const cur = item.cur || 'coins';
        const have = p[cur] || 0;
        if (have < item.price) return { ok: false, reason: 'poor', need: item.price - have, currency: cur };
        S.spend(cur, item.price, id);
        S.give(itemId, id);
        S.track('buy', 1, id);
        S.track('buy-' + RF.data.group(item), 1, id);
        return { ok: true, item };
    };

    // ---------- Missions & stickers ----------
    // Games call RF.store.track('balloon-pop') etc. Returns the missions that were just completed.
    S.track = function (event, amount = 1, id = S.current) {
        const p = S.profile(id);
        if (!p || !amount) return [];
        p.counters[event] = (p.counters[event] || 0) + amount;
        S.save();
        return checkMissions(event, id);
    };
    // For "visit every place" style missions: counts different keys only once
    S.trackDistinct = function (event, key, id = S.current) {
        const p = S.profile(id);
        if (!p) return [];
        const set = p.sets[event] || (p.sets[event] = {});
        if (set[key]) return [];
        set[key] = true;
        p.counters[event] = Object.keys(set).length;
        S.save();
        return checkMissions(event, id);
    };
    S.count = (event, id = S.current) => {
        const p = S.profile(id);
        return p ? p.counters[event] || 0 : 0;
    };
    S.missionProgress = function (mission, id = S.current) {
        const p = S.profile(id);
        const done = !!(p && p.missions[mission.id]);
        const value = Math.min(mission.target, S.count(mission.event, id));
        return { value: done ? mission.target : value, target: mission.target, done };
    };
    function checkMissions(event, id) {
        const p = S.profile(id);
        const completed = [];
        RF.data.MISSIONS.forEach((m) => {
            if (m.event !== event || p.missions[m.id]) return;
            if ((p.counters[event] || 0) >= m.target) {
                p.missions[m.id] = U.todayKey();
                p.newStickers[m.id] = true;
                p.stars += m.stars || 1;
                completed.push(m);
            }
        });
        if (completed.length) {
            S.save();
            completed.forEach((m) => {
                RF.events.emit('wallet', { girl: id, currency: 'stars', amount: m.stars || 1 });
                RF.events.emit('mission', { girl: id, mission: m });
            });
        }
        return completed;
    }

    // Records a best score; returns true if it's a new best
    S.best = function (game, value, id = S.current, lowerIsBetter = false) {
        const p = S.profile(id);
        if (!p) return false;
        const old = p.bests[game];
        const better = old === undefined || (lowerIsBetter ? value < old : value > old);
        if (better) {
            p.bests[game] = value;
            S.save();
        }
        return better && old !== undefined;
    };

    S.worldUnlocked = (world, id = S.current) => S.get('stars', id) >= (world.stars || 0);

    // ---------- Adaptive difficulty (each girl gets her own level per game) ----------
    S.level = (game, fallback = 1, id = S.current) => {
        const p = S.profile(id);
        return p && p.levels[game] !== undefined ? p.levels[game] : fallback;
    };
    S.setLevel = function (game, value, id = S.current) {
        const p = S.profile(id);
        if (!p) return;
        p.levels[game] = value;
        S.save();
    };

    // ---------- Team Rainbow jar: hearts from every girl fill ONE family jar ----------
    // When it fills up, every girl gets the same present. Returns true when it just filled.
    S.teamAdd = function (n = 1) {
        const t = S.data.team;
        t.hearts += n;
        if (t.hearts < t.goal) {
            S.save();
            RF.events.emit('team', { filled: false, team: t });
            return false;
        }
        t.hearts -= t.goal;
        t.filled += 1;
        RF.data.GIRLS.forEach((g) => S.add('coins', 20, g.id));
        S.save();
        RF.events.emit('team', { filled: true, team: t, coins: 20 });
        return true;
    };
    Object.defineProperty(S, 'team', { get: () => S.data.team });

    // ---------- Daily surprise presents (one per day, up to 3 wait for her; never bought; no duplicates) ----------
    function dayNumber(key) {
        const [y, m, d] = key.split('-').map(Number);
        return Math.round(new Date(y, m - 1, d).getTime() / 86400000);
    }
    S.giftsWaiting = function (id = S.current) {
        const p = S.profile(id);
        if (!p) return 0;
        const today = U.todayKey();
        if (p.daily.lastCheck !== today) {
            const days = p.daily.lastCheck ? Math.max(1, dayNumber(today) - dayNumber(p.daily.lastCheck)) : 1;
            p.daily.pending = Math.min(3, (p.daily.pending || 0) + days);
            p.daily.lastCheck = today;
            S.save();
        }
        return p.daily.pending;
    };
    S.giftReady = (id = S.current) => S.giftsWaiting(id) > 0;
    // Opens a present. Returns { item } (something she doesn't have yet) or { coins } when she has everything.
    S.openGift = function (id = S.current) {
        const p = S.profile(id);
        if (!p || !S.giftReady(id)) return null;
        p.daily.pending -= 1;
        const pool = RF.data.ITEMS.filter((it) => it.gift && !p.owned[it.id]);
        let result;
        if (pool.length) {
            const item = U.choice(pool);
            p.owned[item.id] = true;
            RF.events.emit('owned', { girl: id, itemId: item.id });
            result = { item };
        } else {
            result = { coins: 25 };
        }
        S.save();
        if (result.coins) S.add('coins', result.coins, id);
        S.track('daily-gift', 1, id);
        return result;
    };

    S.resetProfile = function (id) {
        const g = RF.data.girl(id);
        if (!g) return;
        S.data.profiles[id] = newProfile(g);
        S.flush();
        RF.events.emit('wallet', { girl: id, currency: 'coins', amount: 0 });
    };

    RF.store = S;
})(window.RF);
