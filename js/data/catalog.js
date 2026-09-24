/* Superstar World - everything in the game world: the girls, clothes, pets, house things, flying worlds,
   missions and stickers. To add something new, add a line here.

   Item fields:
     id        unique, starts with its kind: hat- face- neck- top- bottom- dress- shoes- back- held- pet- decor- wall- floor- trail-
     name      what the voice says
     emoji     picture used in lists (clothes are drawn by avatar.js instead)
     price     0 = free for everyone
     cur       'coins' (default) or 'jewels'
     colors    clothes: the colours you can choose (first one is the default)
     image     key in RF.assets for items with a picture file
     gift      true = can come out of the daily surprise present */
window.RF = window.RF || {};
(function (RF) {
    'use strict';

    const SONG_HUNTRIX = 'assets/audio/huntrix.mp3';
    const SONG_TWO = 'assets/audio/song2.mp3';

    const PASTEL = ['#ff6fb5', '#b98cff', '#5ec8ff', '#6fd6b0', '#ffd23f', '#ff9f5a', '#ffffff', '#ff4d6d'];
    const BRIGHT = ['#ff4d6d', '#ff9f1c', '#ffd23f', '#3ddc84', '#4cc9f0', '#9b5de5', '#ff5fa2', '#2b2d42'];
    const SPARKLE = ['#ffd23f', '#e8e8ff', '#ff9ed2', '#8be9ff', '#c7a4ff'];

    const DEFAULT_OUTFIT = {
        hat: null,
        face: null,
        neck: null,
        top: { id: 'top-tee', color: '#ff6fb5' },
        bottom: { id: 'bottom-skirt', color: '#b98cff' },
        dress: null,
        shoes: { id: 'shoes-sneakers', color: '#ffffff' },
        back: null,
        held: null
    };

    // face: where her face is in the photo (x, y = centre as a fraction of width/height, r = radius as a fraction of width)
    const GIRLS = [
        {
            id: 'alayna', name: 'Alayna', say: 'Alayna', emoji: '🚀', heart: '💜', color: '#a77bff', skin: '#e9bd9f',
            photo: 'assets/img/girls/alayna.webp', song: SONG_HUNTRIX, face: { x: 0.58, y: 0.45, r: 0.48 },
            outfit: Object.assign({}, DEFAULT_OUTFIT, { top: { id: 'top-tee', color: '#b98cff' }, bottom: { id: 'bottom-skirt', color: '#ff6fb5' } })
        },
        {
            id: 'jazmine', name: 'Jazmine', say: 'Jazmine', emoji: '🌟', heart: '💕', color: '#ff6fb5', skin: '#dfae8c',
            photo: 'assets/img/girls/jazmine.webp', song: SONG_TWO, face: { x: 0.52, y: 0.44, r: 0.48 },
            outfit: Object.assign({}, DEFAULT_OUTFIT, { top: { id: 'top-tee', color: '#ff6fb5' }, bottom: { id: 'bottom-skirt', color: '#ffd23f' } })
        },
        {
            id: 'lilah', name: 'Lilah', say: 'Lilah', emoji: '⭐', heart: '💙', color: '#4fc3f7', skin: '#e6b594',
            photo: 'assets/img/girls/lilah.webp', song: SONG_HUNTRIX, face: { x: 0.53, y: 0.45, r: 0.48 },
            outfit: Object.assign({}, DEFAULT_OUTFIT, { top: { id: 'top-tee', color: '#5ec8ff' }, bottom: { id: 'bottom-skirt', color: '#ff6fb5' } })
        },
        {
            id: 'louisa', name: 'Louisa', say: 'Louisa', emoji: '🚀', heart: '💕', color: '#ff8a80', skin: '#f3cdb5',
            photo: 'assets/img/girls/louisa.webp', song: SONG_HUNTRIX, face: { x: 0.5, y: 0.45, r: 0.6 },
            outfit: Object.assign({}, DEFAULT_OUTFIT, { top: { id: 'top-tee', color: '#ff9ed2' }, bottom: { id: 'bottom-skirt', color: '#6fd6b0' } })
        },
        {
            id: 'julia', name: 'Julia', say: 'Julia', emoji: '🌟', heart: '💜', color: '#e07bff', skin: '#f5d2bf',
            photo: 'assets/img/girls/julia.webp', song: SONG_TWO, face: { x: 0.49, y: 0.44, r: 0.45 },
            outfit: Object.assign({}, DEFAULT_OUTFIT, { top: { id: 'top-tee', color: '#ff6fb5' }, bottom: { id: 'bottom-skirt', color: '#b98cff' } })
        }
    ];

    // Dress-up slots, in the order of the picture tabs in the Style Studio
    const SLOTS = [
        { id: 'dress', name: 'Dresses', emoji: '👗' },
        { id: 'top', name: 'Tops', emoji: '👚' },
        { id: 'bottom', name: 'Skirts', emoji: '🩳' },
        { id: 'shoes', name: 'Shoes', emoji: '👟' },
        { id: 'hat', name: 'Hats', emoji: '👑' },
        { id: 'face', name: 'Sparkles', emoji: '✨' },
        { id: 'neck', name: 'Necklaces', emoji: '📿' },
        { id: 'back', name: 'Wings', emoji: '🧚' },
        { id: 'held', name: 'Hold', emoji: '🪄' }
    ];

    const ITEMS = [
        // ---------- Dresses & costumes (replace top + bottom) ----------
        { id: 'dress-party', name: 'Party Dress', emoji: '👗', price: 0, colors: PASTEL },
        { id: 'dress-ballerina', name: 'Ballerina Dress', emoji: '🩰', price: 0, colors: ['#ffb3d9', '#ffffff', '#b98cff', '#8be9ff'] },
        { id: 'dress-princess', name: 'Princess Gown', emoji: '👸', price: 30, colors: ['#ff9ed2', '#b98cff', '#8be9ff', '#ffd23f', '#ffffff'], gift: true },
        { id: 'dress-bubble', name: 'Pink Bubble Gown', emoji: '🎀', price: 40, colors: ['#ffb3d9', '#e0c3ff', '#b5f0ff'], gift: true },
        { id: 'dress-ice', name: 'Ice Gown', emoji: '❄️', price: 40, colors: ['#b5e8ff', '#e0f7ff', '#d6c8ff'], gift: true },
        { id: 'dress-fairy', name: 'Fairy Dress', emoji: '🧚', price: 25, colors: ['#8be0a4', '#ff9ed2', '#c7a4ff', '#8be9ff'], gift: true },
        { id: 'dress-mermaid', name: 'Mermaid Tail', emoji: '🧜‍♀️', price: 35, colors: ['#3fd0c9', '#b98cff', '#ff6fb5', '#4c9dff'], gift: true },
        { id: 'dress-idol', name: 'Pop Star Stage Set', emoji: '🎤', price: 50, colors: ['#ffffff', '#ffd23f', '#ff5fa2', '#9b5de5'], gift: true },
        { id: 'dress-idol-teal', name: 'Pop Star Dance Set', emoji: '💃', price: 45, colors: ['#22c7c7', '#ffd23f', '#ff9f1c'], gift: true },
        { id: 'dress-unicorn', name: 'Unicorn Onesie', emoji: '🦄', price: 35, colors: ['#ffffff', '#ffd6f0', '#e8dcff'], gift: true },
        { id: 'dress-tiger', name: 'Tiger Onesie', emoji: '🐯', price: 35, colors: ['#8fb8ff', '#ffb347', '#c7a4ff'], gift: true },
        { id: 'dress-astronaut', name: 'Astronaut Suit', emoji: '👩‍🚀', price: 40, colors: ['#ffffff', '#ffd6f0', '#d6f0ff'], gift: true },
        { id: 'dress-super', name: 'Super Hero Suit', emoji: '🦸‍♀️', price: 30, colors: ['#ff4d6d', '#9b5de5', '#4cc9f0', '#3ddc84'], gift: true },
        { id: 'dress-police', name: 'Police Officer (like Uncle Tay Tay!)', emoji: '👮‍♀️', price: 25, colors: ['#2f4bb3', '#ff6fb5', '#1d2b53'], gift: true },
        { id: 'dress-witch', name: 'Emerald Witch Dress', emoji: '🧙‍♀️', price: 4, cur: 'jewels', colors: ['#2ecc71', '#9b5de5', '#ff5fa2'] },
        { id: 'dress-rainbow', name: 'Rainbow Dress', emoji: '🌈', price: 5, cur: 'jewels', colors: ['#ffffff'] },

        // ---------- Tops ----------
        { id: 'top-tee', name: 'T-Shirt', emoji: '👕', price: 0, colors: PASTEL },
        { id: 'top-heart', name: 'Heart Top', emoji: '💖', price: 0, colors: PASTEL },
        { id: 'top-star', name: 'Star Top', emoji: '⭐', price: 10, colors: PASTEL, gift: true },
        { id: 'top-rainbow', name: 'Rainbow Top', emoji: '🌈', price: 15, colors: ['#ffffff', '#ffe3f3', '#e8f7ff'], gift: true },
        { id: 'top-hoodie', name: 'Cosy Hoodie', emoji: '🧥', price: 15, colors: PASTEL, gift: true },
        { id: 'top-sparkle-jacket', name: 'Sparkle Jacket', emoji: '🌟', price: 25, colors: SPARKLE, gift: true },

        // ---------- Skirts & trousers ----------
        { id: 'bottom-skirt', name: 'Twirly Skirt', emoji: '👗', price: 0, colors: PASTEL },
        { id: 'bottom-shorts', name: 'Shorts', emoji: '🩳', price: 0, colors: BRIGHT },
        { id: 'bottom-jeans', name: 'Jeans', emoji: '👖', price: 0, colors: ['#5b8def', '#9ec5ff', '#ff9ed2', '#2b2d42'] },
        { id: 'bottom-tutu', name: 'Tutu', emoji: '🩰', price: 15, colors: PASTEL, gift: true },
        { id: 'bottom-leggings', name: 'Rainbow Leggings', emoji: '🌈', price: 10, colors: ['#ffffff'], gift: true },
        { id: 'bottom-dance-pants', name: 'Dance Pants', emoji: '🕺', price: 20, colors: ['#22c7c7', '#b98cff', '#ff5fa2', '#ffd23f'], gift: true },

        // ---------- Shoes ----------
        { id: 'shoes-sneakers', name: 'Trainers', emoji: '👟', price: 0, colors: ['#ffffff', ...BRIGHT] },
        { id: 'shoes-ballet', name: 'Ballet Slippers', emoji: '🩰', price: 0, colors: ['#ffb3d9', '#ffffff', '#b98cff'] },
        { id: 'shoes-sparkle', name: 'Sparkle Shoes', emoji: '✨', price: 10, colors: SPARKLE, gift: true },
        { id: 'shoes-boots', name: 'Stage Boots', emoji: '👢', price: 15, colors: ['#ffffff', '#ff5fa2', '#2b2d42', '#ffd23f'], gift: true },
        { id: 'shoes-glass', name: 'Glass Slippers', emoji: '👠', price: 20, colors: ['#bfefff', '#ffd6f0'], gift: true },
        { id: 'shoes-skates', name: 'Roller Skates', emoji: '🛼', price: 25, colors: ['#ff6fb5', '#5ec8ff', '#b98cff', '#ffd23f'], gift: true },

        // ---------- Hats, crowns & hair things ----------
        { id: 'hat-bow', name: 'Big Bow', emoji: '🎀', price: 0, colors: PASTEL },
        { id: 'hat-party', name: 'Party Hat', emoji: '🥳', price: 0, colors: BRIGHT },
        { id: 'hat-crown', name: 'Princess Crown', emoji: '👑', price: 50, image: 'crown', gift: true },
        { id: 'hat-tiara', name: 'Sparkly Tiara', emoji: '💎', price: 20, colors: ['#e8e8ff', '#ffd23f', '#ff9ed2'], gift: true },
        { id: 'hat-flowers', name: 'Flower Crown', emoji: '🌸', price: 15, colors: ['#ff9ed2', '#ffd23f', '#b98cff'], gift: true },
        { id: 'hat-cat-ears', name: 'Kitty Ears', emoji: '🐱', price: 15, colors: ['#ff9ed2', '#2b2d42', '#ffffff', '#ffb347'], gift: true },
        { id: 'hat-bunny-ears', name: 'Bunny Ears', emoji: '🐰', price: 15, colors: ['#ffffff', '#ff9ed2', '#c7a4ff'], gift: true },
        { id: 'hat-unicorn', name: 'Unicorn Horn', emoji: '🦄', price: 20, colors: ['#ffd23f', '#ff9ed2', '#c7a4ff'], gift: true },
        { id: 'hat-witch', name: 'Witch Hat', emoji: '🧙‍♀️', price: 20, colors: ['#2ecc71', '#9b5de5', '#2b2d42'], gift: true },
        { id: 'hat-headphones', name: 'Pop Star Headset', emoji: '🎧', price: 20, colors: ['#ff5fa2', '#ffffff', '#ffd23f', '#22c7c7'], gift: true },
        { id: 'hat-police', name: 'Police Cap', emoji: '🚓', price: 20, colors: ['#1d2b53', '#ff6fb5'], gift: true },
        { id: 'hat-ribbon', name: 'Ribbon Braid', emoji: '🎗️', price: 15, colors: ['#ffd23f', '#ff5fa2', '#b98cff'], gift: true },
        { id: 'hat-space', name: 'Space Helmet', emoji: '🚀', price: 30, colors: ['#ffffff', '#ffd6f0'], gift: true },
        { id: 'hat-bird-hat', name: 'Magpie Top Hat', emoji: '🎩', price: 3, cur: 'jewels', colors: ['#2b2d42'] },

        // ---------- Face sparkles ----------
        { id: 'face-hearts', name: 'Heart Cheeks', emoji: '💗', price: 0, colors: ['#ff5fa2', '#ff4d6d', '#b98cff'] },
        { id: 'face-stars', name: 'Star Stickers', emoji: '⭐', price: 0, colors: ['#ffd23f', '#5ec8ff', '#ff9ed2'] },
        { id: 'face-rainbow', name: 'Rainbow Face Paint', emoji: '🌈', price: 10, colors: ['#ffffff'], gift: true },
        { id: 'face-glitter', name: 'Glitter Freckles', emoji: '✨', price: 10, colors: SPARKLE, gift: true },
        { id: 'face-sunglasses', name: 'Cool Sunglasses', emoji: '😎', price: 15, colors: ['#2b2d42', '#ff5fa2', '#ffd23f'], gift: true },
        { id: 'face-heart-glasses', name: 'Heart Glasses', emoji: '😍', price: 20, colors: ['#ff4d6d', '#ff9ed2', '#b98cff'], gift: true },
        { id: 'face-idol-marks', name: 'Pop Star Shimmer', emoji: '💫', price: 3, cur: 'jewels', colors: ['#c7a4ff', '#8be9ff', '#ffd23f'] },

        // ---------- Necklaces ----------
        { id: 'neck-pearls', name: 'Pearl Necklace', emoji: '📿', price: 0, colors: ['#ffffff', '#ffd6f0'] },
        { id: 'neck-heart', name: 'Heart Locket', emoji: '💝', price: 15, colors: ['#ffd23f', '#ff5fa2', '#c0c0c0'], gift: true },
        { id: 'neck-tassel', name: 'Lucky Tassel', emoji: '🧧', price: 20, colors: ['#ff4d6d', '#ffd23f', '#b98cff', '#22c7c7'], gift: true },
        { id: 'neck-scarf', name: 'Cosy Scarf', emoji: '🧣', price: 10, colors: BRIGHT, gift: true },

        // ---------- Wings & capes ----------
        { id: 'back-gold-wings', name: 'Golden Wings', emoji: '💛', price: 0, colors: ['#ffd23f'] },
        { id: 'back-fairy-wings', name: 'Fairy Wings', emoji: '🧚', price: 20, colors: ['#b5f0ff', '#ffd6f0', '#d6c8ff', '#c8ffd6'], gift: true },
        { id: 'back-butterfly', name: 'Butterfly Wings', emoji: '🦋', price: 25, colors: ['#5ec8ff', '#ff6fb5', '#ffb347', '#b98cff'], gift: true },
        { id: 'back-angel', name: 'Angel Wings', emoji: '👼', price: 30, colors: ['#ffffff'], gift: true },
        { id: 'back-cape', name: 'Super Cape', emoji: '🦸‍♀️', price: 20, colors: BRIGHT, gift: true },
        { id: 'back-rainbow-wings', name: 'Rainbow Wings', emoji: '🌈', price: 3, cur: 'jewels', colors: ['#ffffff'] },

        // ---------- Things to hold ----------
        { id: 'held-wand', name: 'Star Wand', emoji: '🪄', price: 0, colors: ['#ffd23f', '#ff9ed2', '#8be9ff'] },
        { id: 'held-balloon', name: 'Balloon', emoji: '🎈', price: 0, colors: BRIGHT },
        { id: 'held-flower', name: 'Flower', emoji: '🌷', price: 5, colors: ['#ff5fa2', '#ffd23f', '#b98cff'], gift: true },
        { id: 'held-icecream', name: 'Ice Cream', emoji: '🍦', price: 10, colors: ['#ffb3d9', '#fff3c4', '#b5f0ff'], gift: true },
        { id: 'held-teddy', name: 'Teddy Bear', emoji: '🧸', price: 15, colors: ['#c68b59', '#ff9ed2', '#ffffff'], gift: true },
        { id: 'held-mic', name: 'Sparkly Microphone', emoji: '🎤', price: 20, colors: ['#ffd23f', '#ff5fa2', '#c7a4ff'], gift: true },
        { id: 'held-lightstick', name: 'Light Stick', emoji: '🔦', price: 25, colors: ['#ff5fa2', '#22c7c7', '#b98cff', '#ffd23f'], gift: true },
        { id: 'held-ribbon', name: 'Moon Ribbon', emoji: '🎗️', price: 20, colors: ['#ff5fa2', '#b98cff', '#22c7c7'], gift: true },

        // ---------- Pets (follow you everywhere; each has a flying power) ----------
        { id: 'pet-kitten', name: 'Fluffy Kitten', emoji: '🐱', price: 40, image: 'kitten', sound: 'meow', power: 'coins', powerText: 'catches coins near you' },
        { id: 'pet-puppy', name: 'Cute Puppy', emoji: '🐶', price: 40, image: 'puppy', sound: 'bark', power: 'hearts', powerText: 'fetches hearts for you' },
        { id: 'pet-bunny', name: 'Bouncy Bunny', emoji: '🐰', price: 30, sound: 'squeak', power: 'bounce', powerText: 'gives you super jumps' },
        { id: 'pet-tiger', name: 'Wobble Tiger', emoji: '🐯', price: 60, sound: 'squeak', power: 'cheer', powerText: 'cheers up the grumpy clouds' },
        { id: 'pet-bird', name: 'Hat Bird', emoji: '🐦', price: 60, sound: 'whistle', power: 'jewels', powerText: 'finds shiny jewels' },
        { id: 'pet-capybara', name: 'Chill Capybara', emoji: '🦫', price: 50, sound: 'squeak', power: 'slow', powerText: 'makes everything calm and slow' },
        { id: 'pet-axolotl', name: 'Axolotl', emoji: '🦎', price: 50, sound: 'bubble', power: 'bubbles', powerText: 'blows bubbles that catch things' },
        { id: 'pet-calf', name: 'Fluffy Highland Calf', emoji: '🐮', price: 50, sound: 'squeak', power: 'double', powerText: 'sometimes doubles your coins' },
        { id: 'pet-panda', name: 'Panda', emoji: '🐼', price: 45, sound: 'squeak', power: 'hearts', powerText: 'fetches hearts for you' },
        { id: 'pet-unicorn', name: 'Unicorn Friend', emoji: '🦄', price: 10, cur: 'jewels', sound: 'magic', power: 'rainbow', powerText: 'leaves a rainbow that catches everything' },
        { id: 'pet-dragon', name: 'Baby Dragon', emoji: '🐲', price: 8, cur: 'jewels', sound: 'whoosh', power: 'magnet', powerText: 'pulls everything towards you' },

        // ---------- House things (emoji so they work on every device) ----------
        { id: 'decor-bed', name: 'Comfy Bed', emoji: '🛏️', price: 15, place: 'floor', size: 1.5, gift: true },
        { id: 'decor-couch', name: 'Sofa', emoji: '🛋️', price: 15, place: 'floor', size: 1.4, gift: true },
        { id: 'decor-chair', name: 'Chair', emoji: '🪑', price: 5, place: 'floor', size: 0.9 },
        { id: 'decor-plant', name: 'Pot Plant', emoji: '🪴', price: 5, place: 'floor', size: 0.9 },
        { id: 'decor-sunflower', name: 'Sunflower', emoji: '🌻', price: 5, place: 'floor', size: 0.9 },
        { id: 'decor-tulips', name: 'Tulips', emoji: '🌷', price: 0, place: 'floor', size: 0.8 },
        { id: 'decor-teddy', name: 'Giant Teddy', emoji: '🧸', price: 10, place: 'floor', size: 1.1, gift: true },
        { id: 'decor-unicorn', name: 'Toy Unicorn', emoji: '🦄', price: 15, place: 'floor', size: 1.1, gift: true },
        { id: 'decor-balloons', name: 'Balloons', emoji: '🎈', price: 0, place: 'any', size: 1 },
        { id: 'decor-cake', name: 'Birthday Cake', emoji: '🎂', price: 10, place: 'floor', size: 0.9, gift: true },
        { id: 'decor-cupcake', name: 'Cupcake', emoji: '🧁', price: 5, place: 'floor', size: 0.7 },
        { id: 'decor-gift', name: 'Present', emoji: '🎁', price: 5, place: 'floor', size: 0.8 },
        { id: 'decor-tv', name: 'Telly', emoji: '📺', price: 20, place: 'floor', size: 1.1, gift: true },
        { id: 'decor-piano', name: 'Piano', emoji: '🎹', price: 20, place: 'floor', size: 1.2, gift: true },
        { id: 'decor-guitar', name: 'Guitar', emoji: '🎸', price: 15, place: 'floor', size: 1, gift: true },
        { id: 'decor-castle', name: 'Toy Castle', emoji: '🏰', price: 25, place: 'floor', size: 1.3, gift: true },
        { id: 'decor-carousel', name: 'Carousel', emoji: '🎠', price: 30, place: 'floor', size: 1.4, gift: true },
        { id: 'decor-tent', name: 'Play Tent', emoji: '⛺', price: 20, place: 'floor', size: 1.4, gift: true },
        { id: 'decor-tree', name: 'Sparkly Tree', emoji: '🎄', price: 15, place: 'floor', size: 1.4, gift: true },
        { id: 'decor-snowman', name: 'Snowman', emoji: '⛄', price: 10, place: 'floor', size: 1.1, gift: true },
        { id: 'decor-bath', name: 'Bubble Bath', emoji: '🛁', price: 20, place: 'floor', size: 1.3, gift: true },
        { id: 'decor-books', name: 'Books', emoji: '📚', price: 5, place: 'floor', size: 0.8 },
        { id: 'decor-paints', name: 'Paint Set', emoji: '🎨', price: 5, place: 'floor', size: 0.8 },
        { id: 'decor-bubbletea', name: 'Bubble Tea', emoji: '🧋', price: 5, place: 'floor', size: 0.7 },
        { id: 'decor-icecream', name: 'Ice Cream', emoji: '🍨', price: 5, place: 'floor', size: 0.7 },
        { id: 'decor-trophy', name: 'Trophy', emoji: '🏆', price: 15, place: 'any', size: 0.9, gift: true },
        { id: 'decor-rainbow', name: 'Rainbow', emoji: '🌈', price: 10, place: 'wall', size: 1.3, gift: true },
        { id: 'decor-star', name: 'Big Star', emoji: '⭐', price: 5, place: 'wall', size: 0.9 },
        { id: 'decor-moon', name: 'Moon', emoji: '🌙', price: 5, place: 'wall', size: 0.9 },
        { id: 'decor-picture', name: 'Picture', emoji: '🖼️', price: 10, place: 'wall', size: 1.1, gift: true },
        { id: 'decor-mirror', name: 'Mirror', emoji: '🪞', price: 10, place: 'wall', size: 1.1, gift: true },
        { id: 'decor-ribbon', name: 'Ribbon', emoji: '🎀', price: 5, place: 'wall', size: 0.8 },
        { id: 'decor-lantern', name: 'Lantern', emoji: '🏮', price: 10, place: 'wall', size: 0.9, gift: true },
        { id: 'decor-kite', name: 'Kite', emoji: '🪁', price: 10, place: 'wall', size: 1, gift: true },
        { id: 'decor-butterfly', name: 'Butterfly', emoji: '🦋', price: 5, place: 'wall', size: 0.8 },
        { id: 'decor-fish', name: 'Goldfish', emoji: '🐠', price: 10, place: 'any', size: 0.8, gift: true },

        // ---------- Wallpaper & floor colours for the house ----------
        { id: 'wall-pink', name: 'Pink Walls', emoji: '🌸', price: 0, color: null },
        { id: 'wall-lilac', name: 'Lilac Walls', emoji: '💜', price: 10, color: '#c7a4ff' },
        { id: 'wall-sky', name: 'Sky Blue Walls', emoji: '💙', price: 10, color: '#8fd3ff' },
        { id: 'wall-mint', name: 'Mint Walls', emoji: '💚', price: 10, color: '#8be0b4' },
        { id: 'wall-sunny', name: 'Sunny Walls', emoji: '💛', price: 10, color: '#ffe08a' },
        { id: 'wall-stars', name: 'Starry Walls', emoji: '✨', price: 20, color: '#8a7dff', pattern: 'stars' },
        { id: 'wall-hearts', name: 'Heart Walls', emoji: '💕', price: 20, color: '#ff9ed2', pattern: 'hearts' },
        { id: 'wall-rainbow', name: 'Rainbow Stripes', emoji: '🌈', price: 3, cur: 'jewels', color: null, pattern: 'rainbow' },
        { id: 'floor-pink', name: 'Pink Floor', emoji: '🟪', price: 0, color: null },
        { id: 'floor-wood', name: 'Wood Floor', emoji: '🟫', price: 10, color: '#c68b59' },
        { id: 'floor-mint', name: 'Mint Floor', emoji: '🟩', price: 10, color: '#8be0b4' },
        { id: 'floor-sky', name: 'Blue Floor', emoji: '🟦', price: 10, color: '#8fd3ff' },
        { id: 'floor-gold', name: 'Golden Floor', emoji: '🟨', price: 15, color: '#ffd23f' },

        // ---------- Flying trails (Rainbow Flight) ----------
        { id: 'trail-sparkle', name: 'Sparkle Trail', emoji: '✨', price: 5, cur: 'jewels' },
        { id: 'trail-hearts', name: 'Heart Trail', emoji: '💕', price: 20, gift: true },
        { id: 'trail-rainbow', name: 'Rainbow Trail', emoji: '🌈', price: 30, gift: true },
        { id: 'trail-bubbles', name: 'Bubble Trail', emoji: '💦', price: 20, gift: true },
        { id: 'trail-stars', name: 'Star Trail', emoji: '🌟', price: 25, gift: true },
        { id: 'trail-snow', name: 'Snowflake Trail', emoji: '❄️', price: 20, gift: true }
    ];

    // Rainbow Flight worlds, unlocked by stars from stickers
    const WORLDS = [
        { id: 'sky', name: 'Rainbow Sky', emoji: '🌈', stars: 0 },
        { id: 'idol', name: 'Pop Star Stage', emoji: '🎤', stars: 2 },
        { id: 'candy', name: 'Candy Clouds', emoji: '🍭', stars: 4 },
        { id: 'sea', name: 'Under the Sea', emoji: '🐠', stars: 7 },
        { id: 'space', name: 'Sweet Galaxy', emoji: '🪐', stars: 10 },
        { id: 'snow', name: 'Snowy Sparkle', emoji: '❄️', stars: 14 },
        { id: 'night', name: 'Firefly Night', emoji: '🌙', stars: 18 }
    ];

    /* Missions give stars and a sticker. event = what games report with RF.store.track(event).
       page = which sticker-book page it lives on. */
    const MISSIONS = [
        { id: 'fly-1', page: 'fly', event: 'flight-play', target: 1, stars: 1, text: 'Go flying', sticker: { emoji: '🌈', name: 'Rainbow Flyer' } },
        { id: 'hearts-25', page: 'fly', event: 'flight-heart', target: 25, stars: 1, text: 'Catch 25 hearts', sticker: { emoji: '💖', name: 'Heart Catcher' } },
        { id: 'hearts-150', page: 'fly', event: 'flight-heart', target: 150, stars: 2, text: 'Catch 150 hearts', sticker: { emoji: '💝', name: 'Heart Hero' } },
        { id: 'jewels-5', page: 'fly', event: 'flight-jewel', target: 5, stars: 1, text: 'Find 5 jewels', sticker: { emoji: '💎', name: 'Jewel Finder' } },
        { id: 'glooms-10', page: 'fly', event: 'flight-cheer', target: 10, stars: 1, text: 'Cheer up 10 grumpy clouds', sticker: { emoji: '☁️', name: 'Cloud Cheerer' } },
        { id: 'worlds-3', page: 'fly', event: 'flight-world', target: 3, stars: 2, text: 'Fly in 3 different worlds', sticker: { emoji: '🚀', name: 'World Traveller' } },
        { id: 'powerups-5', page: 'fly', event: 'flight-powerup', target: 5, stars: 1, text: 'Grab 5 power-ups', sticker: { emoji: '⚡', name: 'Power Flyer' } },

        { id: 'balloons-30', page: 'games', event: 'balloon-pop', target: 30, stars: 1, text: 'Pop 30 balloons', sticker: { emoji: '🎈', name: 'Balloon Popper' } },
        { id: 'balloons-300', page: 'games', event: 'balloon-pop', target: 300, stars: 2, text: 'Pop 300 balloons', sticker: { emoji: '🎊', name: 'Balloon Buster' } },
        { id: 'keepy-30', page: 'games', event: 'keepy-bop', target: 30, stars: 1, text: 'Bop the balloon 30 times', sticker: { emoji: '🏐', name: 'Keepy Uppy Star' } },
        { id: 'memory-1', page: 'games', event: 'memory-win', target: 1, stars: 1, text: 'Finish a memory game', sticker: { emoji: '🃏', name: 'Great Memory' } },
        { id: 'memory-10', page: 'games', event: 'memory-win', target: 10, stars: 2, text: 'Finish 10 memory games', sticker: { emoji: '🧠', name: 'Memory Master' } },
        { id: 'dance-1', page: 'games', event: 'dance-round', target: 1, stars: 1, text: 'Copy a dance', sticker: { emoji: '💃', name: 'Dancing Star' } },
        { id: 'piano-1', page: 'games', event: 'piano-song', target: 1, stars: 1, text: 'Play a song on the piano', sticker: { emoji: '🎹', name: 'Little Musician' } },
        { id: 'piano-5', page: 'games', event: 'piano-song', target: 5, stars: 2, text: 'Play 5 piano songs', sticker: { emoji: '🎼', name: 'Piano Star' } },
        { id: 'squish-50', page: 'games', event: 'squish', target: 50, stars: 1, text: 'Squish 50 times', sticker: { emoji: '🍡', name: 'Squish Squeezer' } },

        { id: 'colour-1', page: 'make', event: 'colour-page', target: 1, stars: 1, text: 'Colour a picture', sticker: { emoji: '🎨', name: 'Little Artist' } },
        { id: 'colour-5', page: 'make', event: 'colour-page', target: 5, stars: 2, text: 'Colour 5 pictures', sticker: { emoji: '🖍️', name: 'Master Painter' } },
        { id: 'cupcake-1', page: 'make', event: 'cupcake-made', target: 1, stars: 1, text: 'Bake a cupcake', sticker: { emoji: '🧁', name: 'Little Baker' } },
        { id: 'cupcake-10', page: 'make', event: 'cupcake-made', target: 10, stars: 2, text: 'Bake 10 cupcakes', sticker: { emoji: '🎂', name: 'Master Baker' } },
        { id: 'dress-10', page: 'make', event: 'dress-change', target: 10, stars: 1, text: 'Try on 10 things', sticker: { emoji: '👗', name: 'Fashion Star' } },
        { id: 'photo-1', page: 'make', event: 'dress-photo', target: 1, stars: 1, text: 'Take a photo in the Style Studio', sticker: { emoji: '📸', name: 'Photo Shoot' } },
        { id: 'show-1', page: 'make', event: 'dress-show', target: 1, stars: 1, text: 'Do a fashion show', sticker: { emoji: '🌟', name: 'Runway Star' } },

        { id: 'buy-1', page: 'home', event: 'buy', target: 1, stars: 1, text: 'Buy something', sticker: { emoji: '🛍️', name: 'First Shopping' } },
        { id: 'pet-1', page: 'home', event: 'buy-pet', target: 1, stars: 1, text: 'Adopt a pet', sticker: { emoji: '🐾', name: 'Pet Friend' } },
        { id: 'petcare-10', page: 'home', event: 'pet-care', target: 10, stars: 1, text: 'Look after your pet 10 times', sticker: { emoji: '🛁', name: 'Pet Carer' } },
        { id: 'house-5', page: 'home', event: 'house-place', target: 5, stars: 1, text: 'Put 5 things in your house', sticker: { emoji: '🏠', name: 'Home Decorator' } },
        { id: 'visit-8', page: 'home', event: 'visit', target: 8, stars: 2, text: 'Visit 8 different places', sticker: { emoji: '🗺️', name: 'Explorer' } },
        { id: 'gift-3', page: 'home', event: 'daily-gift', target: 3, stars: 1, text: 'Open 3 surprise presents', sticker: { emoji: '🎁', name: 'Present Pal' } },
        { id: 'together-1', page: 'home', event: 'play-together', target: 1, stars: 1, text: 'Play a game with a sister or cousin', sticker: { emoji: '👭', name: 'Best Team' } },
        { id: 'secrets-5', page: 'home', event: 'secret', target: 5, stars: 1, text: 'Find 5 hidden kittens', sticker: { emoji: '🐈', name: 'Secret Finder' } },
        { id: 'secrets-12', page: 'home', event: 'secret', target: 12, stars: 2, text: 'Find all 12 hidden kittens', sticker: { emoji: '🔍', name: 'Super Detective' } }
    ];

    const STICKER_PAGES = [
        { id: 'fly', name: 'Flying', emoji: '🌈' },
        { id: 'games', name: 'Games', emoji: '🎈' },
        { id: 'make', name: 'Style & Make', emoji: '🎨' },
        { id: 'home', name: 'Home & Friends', emoji: '🏠' }
    ];

    /* Every place in town. scene = RF.go name. Used by the town, the map and missions. */
    const PLACES = [
        { scene: 'house', name: 'My House', emoji: '🏠', color: '#ff9ed2' },
        { scene: 'dressup', name: 'Style Studio', emoji: '👗', color: '#c7a4ff' },
        { scene: 'shop', name: 'Shop', emoji: '🛍️', color: '#ffd23f' },
        { scene: 'flight', name: 'Rainbow Flight', emoji: '🌈', color: '#8fd3ff' },
        { scene: 'balloons', name: 'Balloon Pop', emoji: '🎈', color: '#ff6f91' },
        { scene: 'keepy', name: 'Keepy Uppy', emoji: '🏐', color: '#ffb347' },
        { scene: 'memory', name: 'Memory Match', emoji: '🃏', color: '#6fd6b0' },
        { scene: 'dance', name: 'Copy My Dance', emoji: '💃', color: '#ff5fa2' },
        { scene: 'piano', name: 'Magic Piano', emoji: '🎹', color: '#8a7dff' },
        { scene: 'colouring', name: 'Colouring', emoji: '🎨', color: '#ffcf5c' },
        { scene: 'bakery', name: 'Cupcake Bakery', emoji: '🧁', color: '#ffb3d9' },
        { scene: 'squish', name: 'Squish Corner', emoji: '🍡', color: '#b5f0ff' },
        { scene: 'stickers', name: 'Sticker Book', emoji: '📒', color: '#ffe08a' }
    ];

    // Kind words, said with the girl's name. {name} is replaced.
    const PRAISE = [
        'Amazing, {name}!', 'You did it, {name}!', 'Wow, {name}! Brilliant!', 'Great job, {name}!', 'Super star, {name}!',
        'You kept trying, {name}! Well done!', 'Fantastic, {name}!', 'Look at you go, {name}!', 'Hooray for {name}!',
        'That was so much fun, {name}!', 'Beautiful, {name}!', 'Yay, {name}!', 'You are getting so good at this, {name}!',
        'High five, {name}!', 'Magic, {name}!'
    ];

    const itemIndex = {};
    ITEMS.forEach((it) => { itemIndex[it.id] = it; });

    const CLOTHES_PREFIX = ['hat', 'face', 'neck', 'top', 'bottom', 'dress', 'shoes', 'back', 'held'];

    RF.data = {
        GIRLS, SLOTS, ITEMS, WORLDS, MISSIONS, STICKER_PAGES, PLACES, PRAISE, DEFAULT_OUTFIT,
        SONGS: { huntrix: SONG_HUNTRIX, two: SONG_TWO },
        COLORS: { PASTEL, BRIGHT, SPARKLE },
        girl: (id) => GIRLS.find((g) => g.id === id) || null,
        item: (id) => itemIndex[id] || null,
        // 'clothes' | 'pet' | 'decor' | 'wall' | 'floor' | 'trail'
        group(item) {
            const kind = (typeof item === 'string' ? item : item.id).split('-')[0];
            return CLOTHES_PREFIX.indexOf(kind) >= 0 ? 'clothes' : kind;
        },
        // for clothes: which outfit slot it goes in
        slot(item) { return (typeof item === 'string' ? item : item.id).split('-')[0]; },
        isClothes(item) { return RF.data.group(item) === 'clothes'; },
        items(kind) { return ITEMS.filter((it) => it.id.split('-')[0] === kind); },
        world: (id) => WORLDS.find((w) => w.id === id) || WORLDS[0],
        praise(girlId) {
            const g = GIRLS.find((x) => x.id === girlId);
            const line = PRAISE[Math.floor(Math.random() * PRAISE.length)];
            return line.replace('{name}', g ? g.say || g.name : '');
        }
    };
})(window.RF);
