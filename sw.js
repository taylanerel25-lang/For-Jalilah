/* Superstar World - lets the game work without internet once it has been opened.
   Pictures, code and sounds are kept on the device. Songs are saved the first time they play.
   Bump VERSION whenever files change so everyone gets the new version. */
const VERSION = 'superstar-world-v1';
const CORE = [
    './',
    'index.html',
    'manifest.webmanifest',
    'css/app.css',
    'css/scenes.css',
    'js/core/util.js',
    'js/data/catalog.js',
    'js/core/store.js',
    'js/core/audio.js',
    'js/core/fx.js',
    'js/core/assets.js',
    'js/core/scene.js',
    'js/core/ui.js',
    'js/avatar.js',
    'js/scenes/select.js',
    'js/scenes/town.js',
    'js/scenes/flight.js',
    'js/scenes/dressup.js',
    'js/scenes/house.js',
    'js/scenes/shop.js',
    'js/scenes/stickers.js',
    'js/scenes/settings.js',
    'js/games/balloons.js',
    'js/games/memory.js',
    'js/games/catch.js',
    'js/games/piano.js',
    'js/games/colouring.js',
    'js/main.js',
    'assets/fonts/fredoka-500.woff2',
    'assets/fonts/fredoka-700.woff2',
    'assets/img/coin.png',
    'assets/img/jewel.png',
    'assets/img/kitten.png',
    'assets/img/puppy.png',
    'assets/img/crown.png',
    'assets/img/house.jpg',
    'assets/img/girls/alayna.webp',
    'assets/img/girls/jazmine.webp',
    'assets/img/girls/lilah.webp',
    'assets/img/girls/louisa.webp',
    'assets/img/girls/julia.webp',
    'assets/audio/coin.mp3',
    'assets/icons/icon-192.png',
    'assets/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(VERSION)
            // one missing file shouldn't stop the rest from being saved
            .then((cache) => Promise.all(CORE.map((url) => cache.add(url).catch(() => null))))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

// Songs are played in pieces ("range requests"); answer those from the saved copy.
async function rangeResponse(request) {
    const cache = await caches.open(VERSION);
    const url = request.url;
    let full = await cache.match(url);
    if (!full) {
        try {
            const res = await fetch(url);
            if (res.ok) {
                await cache.put(url, res.clone());
                full = res;
            }
        } catch (e) {
            return fetch(request);
        }
    }
    if (!full) return fetch(request);
    const buf = await full.arrayBuffer();
    const m = /bytes=(\d*)-(\d*)/.exec(request.headers.get('range') || '');
    let start = m && m[1] ? parseInt(m[1], 10) : 0;
    let end = m && m[2] ? parseInt(m[2], 10) : buf.byteLength - 1;
    if (m && !m[1] && m[2]) { // "bytes=-500" means the last 500 bytes
        start = Math.max(0, buf.byteLength - parseInt(m[2], 10));
        end = buf.byteLength - 1;
    }
    end = Math.min(end, buf.byteLength - 1);
    return new Response(buf.slice(start, end + 1), {
        status: 206,
        headers: {
            'Content-Type': full.headers.get('Content-Type') || 'audio/mpeg',
            'Content-Range': `bytes ${start}-${end}/${buf.byteLength}`,
            'Content-Length': String(end - start + 1),
            'Accept-Ranges': 'bytes'
        }
    });
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
    // Use the saved copy straight away (fast!), and refresh it in the background for next time
    event.respondWith(
        caches.open(VERSION).then((cache) =>
            cache.match(req, { ignoreSearch: req.mode === 'navigate' }).then((cached) => {
                const network = fetch(req)
                    .then((res) => {
                        if (res && res.ok && res.type === 'basic') cache.put(req, res.clone());
                        return res;
                    })
                    .catch(() => cached || (req.mode === 'navigate' ? cache.match('index.html') : undefined));
                if (cached) {
                    event.waitUntil(network.catch(() => null));
                    return cached;
                }
                return network;
            })
        )
    );
});
