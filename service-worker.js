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
    "url": "assets/images/chrome.png",
    "revision": "16b9ac116a44042bbecdb9db475fbf3a"
  },
  {
    "url": "assets/images/coffee-and-fun-logo.png",
    "revision": "835aae9ca06f8e91251903e222b94d3c"
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
    "url": "assets/images/flash-cards.png",
    "revision": "a78baf71ebddcd8ff4bce450cc8b1fbf"
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
    "revision": "433f13427579132420c717fd7bb2e65e"
  },
  {
    "url": "flash-cards/index.html",
    "revision": "917f5e7db0d155cbd5d68b74960d53ab"
  },
  {
    "url": "index.html",
    "revision": "29d4caaed119d156805a55cc290b7119"
  },
  {
    "url": "privacy/index.html",
    "revision": "aacdaf478c09f7bacb258615bdc53360"
  },
  {
    "url": "reviews/index.html",
    "revision": "ba0a61fc0949f3920d16765498f5e005"
  }
].concat(self.__precacheManifest || []);
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});

workbox.routing.registerRoute(/^.*\.(html|jpg|png|gif|webp|ico|svg|woff2|woff|eot|ttf|otf|ttc|json)$/, new workbox.strategies.StaleWhileRevalidate(), 'GET');
workbox.routing.registerRoute(/^https?:\/\/fonts\.googleapis\.com\/css/, new workbox.strategies.StaleWhileRevalidate(), 'GET');
