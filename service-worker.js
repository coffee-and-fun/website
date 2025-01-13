/**
 * Welcome to your Workbox-powered service worker!
 *
 * You'll need to register this file in your web app and you should
 * disable HTTP caching for this file too.
 * See https://goo.gl/nhQhGp
 *
 * The rest of the code is auto-generated. Please don't update this file
 * directly; instead, make changes to your Workbox build configuration
 * and re-run your build process.
 * See https://goo.gl/2aRDsh
 */

importScripts("workbox-v4.3.1/workbox-sw.js");
workbox.setConfig({modulePathPrefix: "workbox-v4.3.1"});

workbox.core.setCacheNameDetails({prefix: "eleventy-plugin-pwa"});

workbox.core.skipWaiting();

workbox.core.clientsClaim();

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
self.__precacheManifest = [
  {
    "url": "assets/css/styles.css",
    "revision": "f7c291c2c58f84ba52f01a400c8a4a93"
  },
  {
    "url": "assets/images/apps/autopause.png",
    "revision": "981af908e738dfb86664f14bdf7ff72e"
  },
  {
    "url": "assets/images/apps/bear.png",
    "revision": "2a7059739e521a8816bb195039e5ca07"
  },
  {
    "url": "assets/images/apps/bill.png",
    "revision": "2acfb5c86b07f2e3db316809c8a6d329"
  },
  {
    "url": "assets/images/apps/cards.png",
    "revision": "cf01642045076a74e77195de4fcefd3c"
  },
  {
    "url": "assets/images/apps/clean.png",
    "revision": "8f3c202b3bbe9e62d12e8d65588d1ae0"
  },
  {
    "url": "assets/images/apps/coco.png",
    "revision": "4cc2701428984e2bcadc807459e8e645"
  },
  {
    "url": "assets/images/apps/coffee.png",
    "revision": "0caaa556480515325aa25b8b470398a9"
  },
  {
    "url": "assets/images/apps/confetti.png",
    "revision": "c2e1c747208d90afb36c0761721ff323"
  },
  {
    "url": "assets/images/apps/flash.png",
    "revision": "a58401282ece9199e3d3eb7748f2f0e8"
  },
  {
    "url": "assets/images/apps/google.png",
    "revision": "4370cb93e7433e090cf1ca055e95c708"
  },
  {
    "url": "assets/images/apps/helperbird.png",
    "revision": "39d059f4b2a92509c8973e30227910d6"
  },
  {
    "url": "assets/images/apps/humans.png",
    "revision": "e45164bf3c26fe89c71adf823b10ba4c"
  },
  {
    "url": "assets/images/apps/instant-incognito.png",
    "revision": "797b5f271c51677f741f2914a5c1bda0"
  },
  {
    "url": "assets/images/apps/markdown.png",
    "revision": "1d281aa11d540d3addda1e51488988a6"
  },
  {
    "url": "assets/images/apps/maths.png",
    "revision": "6fc0a8b93aa18182585c98290b6e48dd"
  },
  {
    "url": "assets/images/apps/netflix.png",
    "revision": "ae62168382182afd8fe1b46a86780886"
  },
  {
    "url": "assets/images/apps/pii.png",
    "revision": "b460f66f8d61c64330694e6a8707e5d6"
  },
  {
    "url": "assets/images/apps/procrastinot-2.png",
    "revision": "f35e9d40ec71d1dbe4d3adffa6054525"
  },
  {
    "url": "assets/images/apps/procrastinot.png",
    "revision": "5f8448c856333869618531cabcb840a8"
  },
  {
    "url": "assets/images/apps/rank.png",
    "revision": "7eb1260fa26729f415a2ac29e2c1c780"
  },
  {
    "url": "assets/images/apps/reddit.png",
    "revision": "b30b3c542e17e3bf71968c6a829d37e9"
  },
  {
    "url": "assets/images/apps/screenshot.png",
    "revision": "a688c58d813cfcea7842f63ca06f2a34"
  },
  {
    "url": "assets/images/apps/spoilers.png",
    "revision": "4191cb1920482854379f08df194b3fb5"
  },
  {
    "url": "assets/images/apps/trivia-app.png",
    "revision": "2b41c291479a09c1224f70f48d83013b"
  },
  {
    "url": "assets/images/apps/yeti.png",
    "revision": "05db40e5180db1f3eb3d5fcbe8f60234"
  },
  {
    "url": "assets/images/blog/2025.png",
    "revision": "06c0caebcae109f5ec9fb661ed8091ad"
  },
  {
    "url": "assets/images/blog/airtag.png",
    "revision": "f0edb91afcfae7033c139c65c54aaf3e"
  },
  {
    "url": "assets/images/blog/airtag/1.webp",
    "revision": "8a22eaf796a7b2b5bebe235250ee8d3a"
  },
  {
    "url": "assets/images/blog/airtag/2.webp",
    "revision": "f5e324303f6bc73d35796edc6839cf3b"
  },
  {
    "url": "assets/images/blog/airtag/3.webp",
    "revision": "de0d803ce9dbe5c50a69ec9eb8e3c762"
  },
  {
    "url": "assets/images/blog/airtag/4.webp",
    "revision": "6cbfab9464797b034cd756870deac5ff"
  },
  {
    "url": "assets/images/blog/autopause.png",
    "revision": "1f9e2edee24b732519bc64c94275efbd"
  },
  {
    "url": "assets/images/blog/facebook.png",
    "revision": "c689363606cd5523238ee72d83b7ac60"
  },
  {
    "url": "assets/images/blog/hide-spoilers.png",
    "revision": "63486ba296d86fe7cda0698969eaddc9"
  },
  {
    "url": "assets/images/blog/how-i-would-improve.png",
    "revision": "12a8f8d794b494efe96bbcd0a3b9e3bf"
  },
  {
    "url": "assets/images/blog/improve/after.png",
    "revision": "30767b14e91bfa198e402ff919c60185"
  },
  {
    "url": "assets/images/blog/improve/before.png",
    "revision": "1423ce1d196d5f8db95a981fda01678c"
  },
  {
    "url": "assets/images/blog/maths-update.png",
    "revision": "2a57290f8fdb7837d4645e324161b388"
  },
  {
    "url": "assets/images/blog/psa-grading-research.png",
    "revision": "cdddf462238eaee0f71477792f8b436a"
  },
  {
    "url": "assets/images/blog/redbox.png",
    "revision": "a02f58a011425fe91ecdcebc8e25f054"
  },
  {
    "url": "assets/images/blog/switch-battery.png",
    "revision": "82a1ca8978651a0a7016a6f3d6528351"
  },
  {
    "url": "assets/images/blog/test-in-production.png",
    "revision": "eeab8da5b3836ca6083bd8d8cdce563c"
  },
  {
    "url": "assets/images/blog/vision-pro-thoughts.png",
    "revision": "414720c6a1f031538ac8bbdbf8de198f"
  },
  {
    "url": "assets/images/blog/woobox.png",
    "revision": "7b05f996f0cb6428789992842631e8aa"
  },
  {
    "url": "assets/images/chrome.png",
    "revision": "16b9ac116a44042bbecdb9db475fbf3a"
  },
  {
    "url": "assets/images/coco.png",
    "revision": "b5adb2e066959860b42ce6250e133835"
  },
  {
    "url": "assets/images/coffee-and-fun-logo-dark.png",
    "revision": "9eb41a43b9b81f9dbba281116c97b8eb"
  },
  {
    "url": "assets/images/coffee-and-fun-logo-old.png",
    "revision": "835aae9ca06f8e91251903e222b94d3c"
  },
  {
    "url": "assets/images/coffee-and-fun-logo.png",
    "revision": "9d2722c66c5190c5cf5d5a82671d367c"
  },
  {
    "url": "assets/images/credits.png",
    "revision": "d55805848a036129dba18d787e875786"
  },
  {
    "url": "assets/images/edge.png",
    "revision": "08216bf8bb6261c731578bed2a5e7f3f"
  },
  {
    "url": "assets/images/favicon.ico",
    "revision": "780996719e6ca94956a8551f1b87028e"
  },
  {
    "url": "assets/images/favicon.png",
    "revision": "d2a7450b33fe64be194b342d0e98d294"
  },
  {
    "url": "assets/images/flash-cards-old.png",
    "revision": "a78baf71ebddcd8ff4bce450cc8b1fbf"
  },
  {
    "url": "assets/images/flash-cards.png",
    "revision": "02a166499900cbd5d42828c3e1ca38c8"
  },
  {
    "url": "assets/images/forgot.png",
    "revision": "ff8b1391b5eb662f6f7681f2995f2b38"
  },
  {
    "url": "assets/images/forgotten/cards/bestbuy.png",
    "revision": "5887b7d712a70a7ff4251c5653b055c8"
  },
  {
    "url": "assets/images/forgotten/cards/kroger.png",
    "revision": "d1707000c7c60656ea9ab3e36f56f4a0"
  },
  {
    "url": "assets/images/forgotten/cards/target.png",
    "revision": "887022f0c6f4a055bc7a8e17f9f73924"
  },
  {
    "url": "assets/images/forgotten/cards/tesco.png",
    "revision": "60429b01fe17fdb3b2254f6c2a42e446"
  },
  {
    "url": "assets/images/forgotten/logos/bestbuy.png",
    "revision": "0b11e07775d08e51ccf6df6740b7e34a"
  },
  {
    "url": "assets/images/forgotten/logos/kroger.png",
    "revision": "1ed80368d71ff9f069821ac9db6cb404"
  },
  {
    "url": "assets/images/forgotten/logos/target.png",
    "revision": "194bad664b1a18c5202380d2da2703e6"
  },
  {
    "url": "assets/images/forgotten/logos/tesco.png",
    "revision": "7c00973e22af5162d8f01bb27f1f3805"
  },
  {
    "url": "assets/images/instant-incognito.png",
    "revision": "239ce3bb7540d07f306461a15e4fbd9d"
  },
  {
    "url": "assets/images/logo.png",
    "revision": "f0dd0e6d19c000c9fa7631e8cf9c278a"
  },
  {
    "url": "assets/images/qr-code.png",
    "revision": "17543ea10d2f043e657bc1f0eee6b09c"
  },
  {
    "url": "assets/images/social-icon.png",
    "revision": "3803e68e1bde2336123a7b25018aed43"
  },
  {
    "url": "assets/images/social-rank.png",
    "revision": "7eb1260fa26729f415a2ac29e2c1c780"
  },
  {
    "url": "assets/images/social-trivia.png",
    "revision": "fffab0f9232ffff65f80ef0afa9aca03"
  },
  {
    "url": "assets/images/social/1200.png",
    "revision": "5a91dabc071cc69de3afd6a15e541283"
  },
  {
    "url": "assets/images/social/192.png",
    "revision": "9b7d7b94f9397278bbccdb4ac6742dda"
  },
  {
    "url": "assets/images/social/384.png",
    "revision": "6ab59948caf82fa7a85ea3e19bc17c5a"
  },
  {
    "url": "assets/images/spoilers.png",
    "revision": "6c23a3e33b84b9926ae86bf5e289b3c1"
  },
  {
    "url": "assets/images/star.png",
    "revision": "e3dc14d94da63eca534fba4127a631d6"
  },
  {
    "url": "assets/images/trivia.png",
    "revision": "cd395969ad974a67479db84ff2d65f74"
  },
  {
    "url": "assets/js/core/app.js",
    "revision": "262d4704c89cd94bfb1f7f98a4608334"
  },
  {
    "url": "assets/js/core/third-party.js",
    "revision": "c6ed6ddf9126d34a35f7b578ab5c29b3"
  },
  {
    "url": "assets/js/index.js",
    "revision": "0a30be565b1d1a6e649e77514f81a8d7"
  },
  {
    "url": "assets/js/main.bundle.js",
    "revision": "511c82bf6181df3591ffbc384e040271"
  },
  {
    "url": "assets/js/main.css",
    "revision": "e14bac845e6eadd503b104013f766cc9"
  },
  {
    "url": "blog/ethically-hack-woobox-voting-node-puppeteer/index.html",
    "revision": "53e40d07a050410315d7c3280f015089"
  },
  {
    "url": "blog/how-i-would-improve-chrome-web-store/index.html",
    "revision": "bf9a2c0bf370fa16b4e74229ad0fcf47"
  },
  {
    "url": "blog/how-psa-grades-pokemon-cards-research-guide/index.html",
    "revision": "568542d28a70b8fd1112511619436ec4"
  },
  {
    "url": "blog/how-to-change-battery-in-an-apple-airtag/index.html",
    "revision": "869110bc3798cc13cf4c2d3b988c9a6d"
  },
  {
    "url": "blog/how-to-delete-or-deactivate-your-facebook-account/index.html",
    "revision": "929b71f6095bde605c819052f59c7cfd"
  },
  {
    "url": "blog/how-to-replace-the-battery-in-your-nintendo-switch/index.html",
    "revision": "016625c1960235b4fd0262ed9762ae96"
  },
  {
    "url": "blog/index.html",
    "revision": "3b2a6e5c5da73a4ef3034d0528fc8ef2"
  },
  {
    "url": "blog/introducing-autopause-control-your-media/index.html",
    "revision": "c6ba70dd1d40d66595f1f8846000d28f"
  },
  {
    "url": "blog/introducing-hide-spoilers/index.html",
    "revision": "93b6961a81725ef4996a371061f6df73"
  },
  {
    "url": "blog/our-first-thoughts-on-the-vision-pro/index.html",
    "revision": "67e608f4d019385f82392df83823385d"
  },
  {
    "url": "blog/procrastinot-maths-challenge-update/index.html",
    "revision": "2a9e513687398615ec1dfc4437314713"
  },
  {
    "url": "blog/should-you-test-your-code-in-production/index.html",
    "revision": "88de3b71eb6cd0b62835454fa7987b8e"
  },
  {
    "url": "blog/testing-redbox-kiosk-offline-hack-for-free-dvds/index.html",
    "revision": "6569b2b2422726ae08decf865549317d"
  },
  {
    "url": "blog/whats-coming-for-coffee-and-fun-llc-in-2025/index.html",
    "revision": "583a91e59bf654f8fff663e56ab47937"
  },
  {
    "url": "flash-cards/index.html",
    "revision": "28c47a0a8eb547190c967aafd22cef18"
  },
  {
    "url": "forever-advert/index.html",
    "revision": "68d1255611930d836a30ded7650b5d8d"
  },
  {
    "url": "forgotten-cards/index.html",
    "revision": "94cfd0ab51dc2ce32366f8b2b77c8116"
  },
  {
    "url": "hide-spoilers-extension/index.html",
    "revision": "7e5ca84b278f49f35f11765359832e73"
  },
  {
    "url": "index.html",
    "revision": "ef2d6fe127a99cc86438413cae7892c4"
  },
  {
    "url": "instant-incognito/index.html",
    "revision": "ec45e433d1473416d5540000dfc162ad"
  },
  {
    "url": "privacy/index.html",
    "revision": "2e27a6a7d19fbe17d9edafb28aed329e"
  },
  {
    "url": "procrastinot/index.html",
    "revision": "655030054930eba53ee2d48537dbd511"
  },
  {
    "url": "reviews/index.html",
    "revision": "58dea3b051667e23a9de116aa976c763"
  },
  {
    "url": "stop-wasting/index.html",
    "revision": "eb1c25255eb3e87ae1ef40f76ff5c003"
  },
  {
    "url": "trivia/index.html",
    "revision": "5399640cb503635f504bb3dcea3f96ad"
  }
].concat(self.__precacheManifest || []);
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});

workbox.routing.registerRoute(/^.*\.(html|jpg|png|gif|webp|ico|svg|woff2|woff|eot|ttf|otf|ttc|json)$/, new workbox.strategies.StaleWhileRevalidate(), 'GET');
workbox.routing.registerRoute(/^https?:\/\/fonts\.googleapis\.com\/css/, new workbox.strategies.StaleWhileRevalidate(), 'GET');
