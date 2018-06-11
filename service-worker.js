self.addEventListener('fetch', (event) => {

    if (shouldCache(event.request)) {

        event.respondWith(staleWhileRevalidate(event));

    }

});

const shouldCache = async (request) => {

    // Cache page HTML or any requests from our page
    return request.mode === 'navigate' || (request.method === 'GET' && request.url.startsWith(location.origin));

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
