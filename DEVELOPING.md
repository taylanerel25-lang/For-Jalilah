# Building Superstar World

Plain HTML, CSS and JavaScript. No build step, no libraries, no internet needed.
Open `index.html` through any web server (or GitHub Pages) and it runs.

- Test a single screen straight away: `index.html?girl=lilah&scene=balloons&players=lilah,alayna&mute=1`
- `mute=1` turns every sound off without changing saved settings. `test=1` or `nosw=1` skips the offline service worker.

## Files

| Part | File(s) |
| --- | --- |
| Engine (shared by everything) | `js/core/util.js`, `store.js`, `audio.js`, `fx.js`, `assets.js`, `scene.js`, `ui.js`, `css/app.css` |
| Everything in the game world (girls, clothes, pets, decorations, worlds, missions, places) | `js/data/catalog.js` |
| Drawing the girls (photo face on a cartoon body, all clothes) | `js/avatar.js` |
| Drawing the pets | `js/pets.js` |
| Each screen | `js/scenes/*.js`, `js/games/*.js`, with its own `css/<name>.css` |
| Start-up | `js/main.js` |
| Offline play | `sw.js` (saves everything `index.html` links to - no list to maintain), `manifest.webmanifest` |

Every script is a classic `<script defer>` (no modules, so it also runs when opened from a folder).
A new screen needs three things: its `js/...` file, its `css/<name>.css`, and a line for each in `index.html`.
Everything hangs off the global `RF` object.

## A screen ("scene")

```js
(function (RF) {
    'use strict';
    const U = RF.util, el = U.el;
    RF.register('balloons', {
        place: true,            // counts for the "visit 8 places" sticker
        music: 'ambient',       // 'ambient' (gentle tune, default) | 'none' | 'keep'
        enter(root, params) {   // params.players = ['lilah', 'alayna'] when chosen
            RF.ui.topBar(root, { hint: 'Pop the balloons!', pause: () => {} });
            const view = RF.scope.canvas(root);          // sharp, auto-resizing canvas: view.ctx, view.W, view.H
            RF.scope.pointer(view.canvas, { down(p) {}, move(p) {}, up(p) {} });   // multi-touch
            RF.scope.loop({ update(dt) {}, render() {} }); // steady 60 steps a second, pauses when hidden
        },
        exit() {}               // optional
    });
})(window.RF);
```

Anything set up through `RF.scope` (`listen`, `on`, `timeout`, `interval`, `loop`, `canvas`, `pointer`)
is cleaned up automatically when the scene closes. `RF.scope.token().alive` tells async code whether its scene is still open.
Change scene with `RF.go('town')`. The Android back button / iPhone swipe-back calls the scene's `back()` if it has one, otherwise goes to town.

## Engine cheat sheet

- **Saving** (`RF.store`) – each girl has her own everything. `RF.store.current` is who is playing.
  `profile(id)`, `get('coins', id)`, `add('coins', n, id)`, `spend(...)`, `owns(itemId, id)`, `give(itemId, id)`, `buy(itemId, id)`,
  `track('balloon-pop', n, id)` (missions), `trackDistinct('secret', key, id)`, `best(game, score, id)`, `level(game)` / `setLevel(game, n)`
  (adaptive difficulty), `teamAdd(n)` (Team Rainbow jar), `giftsWaiting()` / `openGift()`, `settings`, `setSetting(k, v)`. Saving is automatic.
- **Events** (`RF.events.on(name, fn)`) – `wallet`, `owned`, `mission`, `team`, `settings`, `girl`.
- **Sound** – `RF.sfx.play('pop')` (names: `RF.sfx.names`), `RF.sfx.note(60, 'piano')`, `RF.music.song(src)` / `ambient()` / `stop()`,
  `RF.voice.say('Well done!')`.
- **UI** (`RF.ui`) – `btn`, `topBar`, `toast`, `banner`, `speak` (voice + speech bubble), `praise(girlId)` (kind words, max one per 4 s),
  `ghostHand(x, y, { to })` (shows what to do), `idle(fn, { ms })`, `modal`, `celebrate`, `confirmBuy(itemId)`, `pickPlayers`,
  `results` (end of a round), `pauseMenu`, `parentGate`, `confetti`, `confettiRain`, `flyTo(x, y, 'coins', n)`, `head(girlId, px)`,
  `itemIcon(item, px)`, `currencyIcon`, `tip(key, text)`.
- **Drawing** (`RF.fx`) – `emoji(ctx, '🦄', x, y, size)` (cached, fast), `heart`, `star`, `twinkle`, `cloud`, `text`, `shadow`,
  `new RF.fx.Particles()` with `burst`, `floatText`, `ring`, `update(dt)`, `draw(ctx)`; `RF.fx.calm()` for calm mode.
- **Girls & pets** – `RF.avatar.draw(ctx, girlId, x, y, height, { pose, t, facing })`, `RF.avatar.drawHead(...)`, `RF.avatar.headURL(id, px)`;
  `RF.pets.draw(ctx, petId, x, y, size, { pose, t, facing })`, `RF.pets.iconURL(petId, px)`, `RF.pets.sound(petId)`.

## Rules every screen follows (from research on how 6-year-olds play)

1. **Nobody can lose.** No game over, no lives, no taking coins away, no red crosses. Misses get a funny bounce and a soft sound.
2. **Big taps.** Main things to tap are at least 88–110 px; small extras at least 64 px, with 20+ px gaps. Hit areas can be bigger than the drawing.
   Single taps only (dragging may be offered but never required). Keep the bottom edge free of important buttons.
3. **Talk, don't write.** Every screen says what to do in one short line (`RF.ui.speak`) and has the 🔊 "say it again" button (`topBar({ hint })`).
   If nothing happens for ~7 s, show the pointing hand and say the line again (`RF.ui.idle` + `RF.ui.ghostHand`). Text is 1–3 words next to a picture.
4. **Instant feedback.** Every tap makes a sound and a little animation within 100 ms.
5. **Short rounds.** Games last 45–90 s, shown as a filling rainbow (never a ticking clock), then `RF.ui.results` with Again / Town.
   Never start another round by itself. Pause button on moving games.
6. **Praise the doing, with her name** (`RF.ui.praise`). Never "you're so smart".
7. **Fair for sisters.** Same things and prices for every girl. Multi-player is cooperative. Coins go to whoever earned them.
8. **Calm, not frantic.** Gentle speeds, no flashing more than 3 times a second, fewer sparkles in calm mode.
9. **Private.** No internet calls, no ads, no links out, no inline scripts (there is a Content Security Policy).
10. **Smooth on phones.** Cache drawings, avoid `shadowBlur` and `ctx.filter` in loops, keep particles under a few hundred.
