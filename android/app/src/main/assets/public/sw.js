/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-7e5eb42b'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "manifest.json",
    "revision": "7e3667341a6be133d0b0343cf0dca21c"
  }, {
    "url": "index.html",
    "revision": "98eaf026fdb34a70b53a545c7ee8c421"
  }, {
    "url": "icon.svg",
    "revision": "41209c2b1815817300b8fa8da74b9338"
  }, {
    "url": "icon-maskable-512x512.png",
    "revision": "93f0a9077d1519503985ce7f5fe7b7e2"
  }, {
    "url": "icon-512x512.png",
    "revision": "641d135960425ecbdd199ea6447f6d72"
  }, {
    "url": "icon-192x192.png",
    "revision": "8fe5da3cdfb6d4e8f3785c76c6055248"
  }, {
    "url": "battery.html",
    "revision": "f90616346cc6f43e7d955ae74f8c6c56"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "d4816b00743ea4c97c3932668b9dde0d"
  }, {
    "url": "assets/workbox-window.prod.es5-BBnX5xw4.js",
    "revision": null
  }, {
    "url": "assets/index-DQxriF3E.css",
    "revision": null
  }, {
    "url": "assets/index-B2N5CPgf.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "d4816b00743ea4c97c3932668b9dde0d"
  }, {
    "url": "icon-192x192.png",
    "revision": "8fe5da3cdfb6d4e8f3785c76c6055248"
  }, {
    "url": "icon-512x512.png",
    "revision": "641d135960425ecbdd199ea6447f6d72"
  }, {
    "url": "icon-maskable-512x512.png",
    "revision": "93f0a9077d1519503985ce7f5fe7b7e2"
  }, {
    "url": "icon.svg",
    "revision": "41209c2b1815817300b8fa8da74b9338"
  }, {
    "url": "manifest.json",
    "revision": "7e3667341a6be133d0b0343cf0dca21c"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html"), {
    denylist: [/^\/api/, /:1881/]
  }));

}));
