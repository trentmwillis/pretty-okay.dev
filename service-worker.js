self.addEventListener('fetch', (event) => {


    const method = howToHandle(event.request);
    if (method) {

        event.respondWith(method(event));

    }

});

const howToHandle = (request) => {

    if (request.mode === 'navigate') {

        return networkThenCache;

    } else if (request.method === 'GET' && request.url.startsWith(location.origin)) {

        if (request.url.endsWith('.jpg')) {

            return staleWhileRevalidate;

        }

        return networkThenCache;

    }

};

/**
 * Returns a fresh version of a resource. If the fetch fails, it'll return a
 * cached value if possible. It will also update the cache once the fetch is
 * completed.
 */
const networkThenCache = async (event) => {

    const request = event.request;
    const normalizedUrl = new URL(request.url);
    normalizedUrl.search = '';
    normalizedUrl.hash = '';

    const resourcePromise = fetch(normalizedUrl, {
        redirect: request.redirect
    });

    event.waitUntil(updateCacheAfter(resourcePromise, normalizedUrl));

    return resourcePromise
        .then(response => response.clone())
        .catch(() => caches.match(normalizedUrl));

};

/**
 * Returns a stale version of a resource while simultaneously fetching a newer
 * version. Provides a fast response while updating for future visits.
 */
const staleWhileRevalidate = async (event) => {

    const normalizedUrl = new URL(event.request.url);
    normalizedUrl.search = '';
    normalizedUrl.hash = '';

    const resourcePromise = fetch(normalizedUrl);

    event.waitUntil(updateCacheAfter(resourcePromise, normalizedUrl));

    const cachedResource = await caches.match(normalizedUrl);
    return cachedResource || resourcePromise;

};

const updateCacheAfter = async (promise, key) => {

    const cache = await caches.open('static-content');
    const value = await promise.then(response => response.clone());
    return cache.put(key, value);

};
