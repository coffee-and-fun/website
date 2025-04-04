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
    "url": "assets/images/1024.png",
    "revision": "073f8287fd520b7db4ae5e444ebadcb9"
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
    "revision": "530ebe4701f772e1d343fc4bc1949a9f"
  },
  {
    "url": "assets/images/apps/procrastinot.png",
    "revision": "073f8287fd520b7db4ae5e444ebadcb9"
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
    "url": "assets/images/blog/apple-passwords-app-coffee-and-fun.png",
    "revision": "17002879a79dbcb5104997c037ced680"
  },
  {
    "url": "assets/images/blog/autopause.png",
    "revision": "1f9e2edee24b732519bc64c94275efbd"
  },
  {
    "url": "assets/images/blog/coffee-and-fun-quarterly-update-spring-2025.png",
    "revision": "d202df7b5728fe18e4a1ce4824aa9ecf"
  },
  {
    "url": "assets/images/blog/delete-tweets-retweets-likes-without-apps.png",
    "revision": "8617d8fb9e16852b71bf9acb8ccedfcc"
  },
  {
    "url": "assets/images/blog/ethically-scrape-poshmark-listings-node-puppeteer.png",
    "revision": "f030e6cc2bfc035d8a5a6dec3016a9ac"
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
    "url": "assets/images/blog/skip-movie-trailers-trick.png",
    "revision": "75e8a356352008309a580ec24dacc193"
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
    "url": "assets/images/procrastinot/clear.png",
    "revision": "dd2d7a8099b392aab1fd32c6707bc2b3"
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
    "revision": "37bd9b7f6e3328c4df92539c3c46817c"
  },
  {
    "url": "blog/apple-passwords-app-review-coffee-and-fun/index.html",
    "revision": "f9b03b03b7ad7e76a5bb3d20851cc75b"
  },
  {
    "url": "blog/coffee-and-fun-quarterly-update-spring-2025/index.html",
    "revision": "02164e719b131490f0546a1a8d6a5704"
  },
  {
    "url": "blog/delete-tweets-retweets-likes-without-apps/index.html",
    "revision": "80b3f2b647ab9935a854ba800349cbad"
  },
  {
    "url": "blog/ethically-hack-woobox-voting-node-puppeteer/index.html",
    "revision": "d111417e1067cafdd728803712de11de"
  },
  {
    "url": "blog/ethically-scrape-poshmark-listings-node-puppeteer-update/index.html",
    "revision": "a1ade009c27f8245aa03d7f12e0d0239"
  },
  {
    "url": "blog/ethically-scrape-poshmark-listings-node-puppeteer/index.html",
    "revision": "c7a18be4d1051eb38a4a012f7c4979c6"
  },
  {
    "url": "blog/how-i-would-improve-chrome-web-store/index.html",
    "revision": "d2b4fb270c93b9d0edfe4fb9cbfb8b79"
  },
  {
    "url": "blog/how-psa-grades-pokemon-cards-research-guide/index.html",
    "revision": "4b2eb1135e0ce70ba8b5a1ba00c0c7b8"
  },
  {
    "url": "blog/how-to-change-battery-in-an-apple-airtag/index.html",
    "revision": "ec2b6191c42bf6fd70f7c66049db2081"
  },
  {
    "url": "blog/how-to-delete-or-deactivate-your-facebook-account/index.html",
    "revision": "f8c2e604e2b365731d9373abbc437f6e"
  },
  {
    "url": "blog/how-to-replace-the-battery-in-your-nintendo-switch/index.html",
    "revision": "dc80277af850f1cb6ad3cd5a52da0e4f"
  },
  {
    "url": "blog/index.html",
    "revision": "92cf7d413fab75e7497424fa488d7f91"
  },
  {
    "url": "blog/introducing-autopause-control-your-media/index.html",
    "revision": "769fd7a6626d452a08e17816d4d113b0"
  },
  {
    "url": "blog/introducing-hide-spoilers/index.html",
    "revision": "97585190f0d8e846133aba2412fe4b7b"
  },
  {
    "url": "blog/our-first-thoughts-on-the-vision-pro/index.html",
    "revision": "f608a679def1e650bf2fc09e1f97ee0b"
  },
  {
    "url": "blog/procrastinot-maths-challenge-update/index.html",
    "revision": "27bdccbfac397c98fd4492d77c613d2d"
  },
  {
    "url": "blog/should-you-test-your-code-in-production/index.html",
    "revision": "f5ecc26c05a82b5bbb5bfa98d133d514"
  },
  {
    "url": "blog/skip-movie-trailers-trick/index.html",
    "revision": "e06bd5bbc3b992d1a769e19ca3278fd2"
  },
  {
    "url": "blog/testing-redbox-kiosk-offline-hack-for-free-dvds/index.html",
    "revision": "5b70c2bca2c08243752cec8a2eb0f7c2"
  },
  {
    "url": "blog/whats-coming-for-coffee-and-fun-llc-in-2025/index.html",
    "revision": "7c7688d0393090f415bf47673a01e154"
  },
  {
    "url": "flash-cards/index.html",
    "revision": "8ed88db243fee1ee531c60ed88339bd8"
  },
  {
    "url": "forever-advert/index.html",
    "revision": "182d8722a492b8ddfc67b02297cae111"
  },
  {
    "url": "forgotten-cards/index.html",
    "revision": "1c5d30c2adff2dcb07d45be7db1472ca"
  },
  {
    "url": "hide-spoilers-extension/index.html",
    "revision": "2e12a2189bdc2850c46ba7d2a86631ce"
  },
  {
    "url": "index.html",
    "revision": "b762c9bbf0cac475d7d4dbee8c1c9cfa"
  },
  {
    "url": "instant-incognito/index.html",
    "revision": "c06e4fbf1b649ead5b14805f4b949efb"
  },
  {
    "url": "privacy/index.html",
    "revision": "01f17701f357007ff895c1857a478957"
  },
  {
    "url": "procrastinot/index.html",
    "revision": "006cbe107134db6a1cac867bdeec1e24"
  },
  {
    "url": "reviews/index.html",
    "revision": "0622f76b32e9c151da6771f0dbbea5db"
  },
  {
    "url": "stop-wasting/index.html",
    "revision": "1b990588584cb4fa44adba4677c50f99"
  },
  {
    "url": "trivia/index.html",
    "revision": "430cd3b10fb4b2591840242d00863fba"
  }
].concat(self.__precacheManifest || []);
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});

workbox.routing.registerRoute(/^.*\.(html|jpg|png|gif|webp|ico|svg|woff2|woff|eot|ttf|otf|ttc|json)$/, new workbox.strategies.StaleWhileRevalidate(), 'GET');
workbox.routing.registerRoute(/^https?:\/\/fonts\.googleapis\.com\/css/, new workbox.strategies.StaleWhileRevalidate(), 'GET');
