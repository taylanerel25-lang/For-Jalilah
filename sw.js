/* Superstar World - lets the game work without internet once it has been opened.
   - When online, it always fetches the newest files (so updates arrive straight away) and keeps a copy.
   - When offline (or the internet is very slow), it uses the saved copies.
   - Songs are saved the first time they play.
   Nothing here needs changing when files are added: everything index.html uses is saved automatically. */
const CACHE = 'superstar-world';
const SLOW_MS = 3500;

// On install, save index.html and everything it links to, plus the pictures and sounds.
self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE);
        const base = new URL('./', self.location).href;
        const urls = new Set(['./', 'index.html', 'manifest.webmanifest']);
        try {
            const html = await (await fetch('index.html', { cache: 'no-cache' })).text();
            const re = /(?:src|href)="([^"#?]+)"/g;
            let m;
            while ((m = re.exec(html))) {
                if (!/^(https?:|data:|mailto:)/.test(m[1])) urls.add(m[1]);
            }
        } catch (e) { /* offline during install - the runtime cache below still works */ }
        [
            'assets/img/coin.png', 'assets/img/jewel.png', 'assets/img/kitten.png', 'assets/img/puppy.png',
            'assets/img/crown.png', 'assets/img/house.jpg',
            'assets/img/girls/alayna.webp', 'assets/img/girls/jazmine.webp', 'assets/img/girls/lilah.webp',
            'assets/img/girls/louisa.webp', 'assets/img/girls/julia.webp',
            'assets/fonts/fredoka-500.woff2', 'assets/fonts/fredoka-700.woff2', 'assets/audio/coin.mp3',
            'assets/icons/icon-192.png', 'assets/icons/icon-512.png', 'assets/icons/apple-touch-icon.png'
        ].forEach((u) => urls.add(u));
        // one missing file shouldn't stop the rest from being saved
        await Promise.all([...urls].map((u) => cache.add(new URL(u, base).href).catch(() => null)));
        await self.skipWaiting();
    })());
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
        await self.clients.claim();
    })());
});

// Songs are played in pieces ("range requests"); answer those from a saved full copy.
async function rangeResponse(request) {
    const cache = await caches.open(CACHE);
    const url = request.url;
    let full = await cache.match(url);
    if (!full) {
        try {
            const res = await fetch(url);
            if (res.ok && res.status === 200) {
                await cache.put(url, res.clone());
                full = res;
            }
        } catch (e) { /* offline */ }
        if (!full) return fetch(request);
    }
    const buf = await full.arrayBuffer();
    const size = buf.byteLength;
    const m = /bytes=(\d*)-(\d*)/.exec(request.headers.get('range') || '');
    let start = m && m[1] ? parseInt(m[1], 10) : 0;
    let end = m && m[2] ? parseInt(m[2], 10) : size - 1;
    if (m && !m[1] && m[2]) { // "bytes=-500" means the last 500 bytes
        start = Math.max(0, size - parseInt(m[2], 10));
        end = size - 1;
    }
    end = Math.min(end, size - 1);
    if (start > end) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
    return new Response(buf.slice(start, end + 1), {
        status: 206,
        headers: {
            'Content-Type': full.headers.get('Content-Type') || 'audio/mpeg',
            'Content-Range': `bytes ${start}-${end}/${size}`,
            'Content-Length': String(end - start + 1),
            'Accept-Ranges': 'bytes'
        }
    });
}

// Newest version when online, saved copy when offline or very slow
async function networkFirst(request, event) {
    const cache = await caches.open(CACHE);
    const lookup = () => cache.match(request, { ignoreSearch: request.mode === 'navigate' })
        .then((hit) => hit || (request.mode === 'navigate' ? cache.match('index.html') : undefined));
    const network = fetch(request).then((res) => {
        if (res && res.ok && res.type === 'basic') {
            const copy = res.clone();
            event.waitUntil(cache.put(request, copy).catch(() => null));
        }
        return res;
    });
    const slow = new Promise((resolve) => setTimeout(resolve, SLOW_MS));
    try {
        const winner = await Promise.race([network, slow.then(() => null)]);
        if (winner) return winner;
        const cached = await lookup();
        return cached || network;
    } catch (e) {
        const cached = await lookup();
        if (cached) return cached;
        throw e;
    }
}

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return;
    if (req.headers.get('range')) {
        event.respondWith(rangeResponse(req));
        return;
    }
    event.respondWith(networkFirst(req, event));
});
