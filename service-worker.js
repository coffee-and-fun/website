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
    "revision": "d41d8cd98f00b204e9800998ecf8427e"
  },
  {
    "url": "assets/images/apps/bear.png",
    "revision": "2a7059739e521a8816bb195039e5ca07"
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
    "url": "assets/images/apps/trivia-app.png",
    "revision": "2b41c291479a09c1224f70f48d83013b"
  },
  {
    "url": "assets/images/apps/yeti.png",
    "revision": "05db40e5180db1f3eb3d5fcbe8f60234"
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
    "url": "assets/images/blog/facebook.png",
    "revision": "c689363606cd5523238ee72d83b7ac60"
  },
  {
    "url": "assets/images/blog/maths-update.png",
    "revision": "2a57290f8fdb7837d4645e324161b388"
  },
  {
    "url": "assets/images/blog/switch-battery.png",
    "revision": "82a1ca8978651a0a7016a6f3d6528351"
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
    "revision": "3f732b659336f297b548613c4799bed1"
  },
  {
    "url": "assets/js/main.css",
    "revision": "292327da68eae6be9714d40a64e3e15b"
  },
  {
    "url": "blog/how-to-change-battery-in-an-apple-airtag/index.html",
    "revision": "bf57eeb93579eca793e2bde5c609fe32"
  },
  {
    "url": "blog/how-to-delete-or-deactivate-your-facebook-account/index.html",
    "revision": "0e243b6732da767fcf1d1f50232a1a5d"
  },
  {
    "url": "blog/how-to-replace-the-battery-in-your-nintendo-switch/index.html",
    "revision": "c17bbeb22d5d609a136dd21be75b4fe8"
  },
  {
    "url": "blog/index.html",
    "revision": "227f5684ea71e3ddd542c1cd8ceee050"
  },
  {
    "url": "blog/procrastinot-maths-challenge-update/index.html",
    "revision": "439be29b8d1f195872884f20e72e8687"
  },
  {
    "url": "flash-cards/index.html",
    "revision": "68ffd969e6e939eb15beff8ea8aef0e9"
  },
  {
    "url": "forever-advert/index.html",
    "revision": "ee4b121148e00410bd5796c6f43a8678"
  },
  {
    "url": "index.html",
    "revision": "aa91b9a9e047fd404fd638496b8d1884"
  },
  {
    "url": "instant-incognito/index.html",
    "revision": "ca723a0561e2933ca550bbe7d2752c9b"
  },
  {
    "url": "privacy/index.html",
    "revision": "3e65c89f54d1b43317dc664972d261db"
  },
  {
    "url": "procrastinot/index.html",
    "revision": "8bdee3a72bf0a6c4075513f32a3d63fe"
  },
  {
    "url": "reviews/index.html",
    "revision": "4fe89c24659a08a081faa598fab2b73a"
  },
  {
    "url": "stop-wasting/index.html",
    "revision": "d2719f0819a997048a6e2326b36360f6"
  },
  {
    "url": "trivia/index.html",
    "revision": "bc43f769e7f93b65c8b31cbe48d1cd79"
  }
].concat(self.__precacheManifest || []);
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});

workbox.routing.registerRoute(/^.*\.(html|jpg|png|gif|webp|ico|svg|woff2|woff|eot|ttf|otf|ttc|json)$/, new workbox.strategies.StaleWhileRevalidate(), 'GET');
workbox.routing.registerRoute(/^https?:\/\/fonts\.googleapis\.com\/css/, new workbox.strategies.StaleWhileRevalidate(), 'GET');
