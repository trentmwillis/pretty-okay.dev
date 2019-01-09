---
layout: post
title:  "Creating Your Own Image Format In The Browser"
author: "Trent Willis"
date:   2019-01-01
image:  "2019-01-01-creating-your-own-image-format.jpg"
excerpt: "A technical deep-dive in how to polyfill a custom image format in the browser using Service Workers, Streams, and Web Crypto."
---

_This post is a technical deep-dive into the demo I gave for a talk of the same title at JSConf Colombia 2018._

Towards the beginning of this year, I was looking into the new [Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API) that started showing up in browsers. In [the introduction to the Streams API specification](https://streams.spec.whatwg.org/#intro), it is noted that Streams "if installed inside the fetch hook of a service worker, [_sic_] would allow developers to transparently polyfill new image formats."

This sounded really intriguing to me, so I decided to test that use case out and built a new, custom image format. That image format is the `.epng` format, which stands for "Encrypted PNG". It will represent PNG images that have been encrypted using the `AES-CTR` algorithm in the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API).

This post will be broken down into 5 sections. Feel free to jump around (or straight to the end), if any particular portion interests you more than the others:

1. [The Approach](#the-approach) - The thought process and design behind my implementation.
2. [The Service Worker](#the-service-worker) - The Service Worker specific code needed.
3. [The Stream](#the-stream) - The what and how of Streams in the polyfill.
4. [The Polyfill](#the-polyfill) - The actual image polyfill in the form of a TransformStream. This section is the bulk of the post.
5. [The Results (A.K.A., TL;DR)](#the-results) - How well does it work? Also, a TL;DR of the code.

Let's go!



## The Approach

The Streams specification more-or-less spells out what is needed in order to accomplish what they mention, but I still spent a bit of time thinking about two particular phrases before writing my code.

### "Transparently Polyfill"

To start, I wanted to define what "transparently polyfill" would mean to a developer. If I think of a normal image, it would usually look like this:

{% highlight html linenos %}
<img src="./my-image.png" alt="My cool image">
{% endhighlight %}

So when I hear that a polyfill would be "transparent", I would expect that this means I could do the following:

{% highlight html linenos %}
<img src="./my-image.custom-format" alt="My cool image in a custom format">
{% endhighlight %}

And it would just work. The browser should load and render it without any further effort on my part. It should also look like any other image when it gets inspected.

There are some existing, JavaScript-based image polyfills for the browser, but they all rely on loading the image from JavaScript or modifying the image after it has loaded, thus they aren't "transparent" in the way I outline above. That is what _should_ set this implementation apart.

### "Installed Inside The Fetch Hook"

So with that behavior in mind, what exactly does it mean for a Stream to be _installed_ inside a Service Worker fetch hook? Or, more simply, how do we get a Stream of data within a Service Worker?

Well, interestingly, one of the cool changes the Streams API brought with it is that when you use the `fetch()` method, the `Response` object you get back has a `body` property which is a `ReadableStream`. In other words, to get a Stream of data you essentially just need to do this:

{% highlight javascript linenos %}
const response = await fetch(request);
console.log(response.body); // ReadableStream
{% endhighlight %}

Knowing that, I take "installed" to mean that the Service Worker uses a transformation stream on the `ReadableStream` before the result is returned to the browser. We'll figure out how to exactly do that a bit later.



## The Service Worker

Our approach will be to enable developers to use a new image format in a normal image tag, just like they would a `.png` or `.gif` file. To do so, we'll need to intercept the `body` of any fetch events for our new extension. Let's start writing the Service Worker code we need to accomplish that.

### Registration

The first thing we need to do is register a Service Worker. We do so from our page with:

{% highlight html linenos %}
<script>
  navigator.serviceWorker.register('./service-worker');
</script>
{% endhighlight %}

This will return a Promise that resolves when the Service Worker at the specified file path has loaded and registered successfully. If you're not familiar with this, I'd recommend checking out [this article on Service Worker registration and life-cycle](https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle).

### FetchEvent Listener

With our Service Worker registered, the next thing we want to do is add an event listener for `FetchEvent`s:

{% highlight javascript linenos %}
self.addEventListener('fetch', (event) => {});
{% endhighlight %}

This will allow us to see all the requests made by pages that the Service Worker is active on. This will include JavaScript-initiated requests, like `XMLHttpRequest` and `fetch`, as well as requests for assets and navigation requests. It's really powerful.

However, that also means we need to filter the requests to ensure we only modify the ones we're interested in. We can do this with an `if` statement:

{% highlight javascript linenos %}
self.addEventListener('fetch', (event) => {
  if (isEncryptedPNGRequest(event.request)) {}
});
{% endhighlight %}

There are two things worth noting here:

1. If a `FetchEvent` is not handled, then it will fall back to normal browser behavior, thus we don't need an `else` clause.

2. I extracted my logic to check if a request is for an encrypted PNG into a function. This is a pattern I use frequently to make code more readable and to keep conditionals short.

The logic for the `if` check is as follows:

{% highlight javascript linenos %}
const isEncryptedPNGRequest = request => {
    const url = new URL(request.url);
    return url.pathname.endsWith('.epng');
};
{% endhighlight %}

It's fairly readable, but to put it plainly, we construct a `URL` object from the request's url and ensure the pathname ends with a `.epng` extension.

We don't use the `request.url` property directly because it is a simple string. Constructing a `new URL` from the URL string allows us to use the handy `pathname` property which avoids us needing lots of extra logic to handle query (`?`) and hash (`#`) segments at the end of URLs. To more clearly, illustrate what I mean both of the following should return `true`:

{% highlight javascript linenos %}
isEncryptedPNGRequest({ url: 'https://test.com/foo.epng' });
isEncryptedPNGRequest({ url: `https://test.com/foo.epng?refresh=${Date.now()}` });
{% endhighlight %}

So with our filter in place, next we construct a new PNG from the request and tell our `FetchEvent` to respond with that instead of the original `Response`:

{% highlight javascript linenos %}
self.addEventListener('fetch', (event) => {
    if (isEncryptedPNGRequest(event.request)) {
        event.respondWith(pngFromEncryptedPNGRequest(event.request));
    }
});
{% endhighlight %}

The `respondWith` method accepts a `Response` object (or a `Promise` for a `Response` object) that is used as the "return" value to the browser. We'll dive into how we construct that next.

### Responding With A New Image

The `pngFromEncryptedPNGRequest` method is what I like to refer to as our "polyfill scaffolding"; it implements a general pattern for supporting polyfilled file formats in the browser.

{% highlight javascript linenos %}
const pngFromEncryptedPNGRequest = async (request) => {

  const response = await fetch(request);
  const decrypter = new TransformStream(new Decrypter());
  const decryptedStream = response.body.pipeThrough(decrypter);

  return new Response(decryptedStream);

};
{% endhighlight %}

What it does is perform the original request, but then intercepts it on the way back to the browser and transforms the `body` with a "transformer" (more on that in a bit). So you could see how we could genericize this function such that the polyfill transformation is pluggable.

We'll talk about the `TransformStream`, `Decrypter`, and `pipeThrough()` more in the next section, which means that the only thing really interesting in this function is the `Response`.

The `Response` object represents a response from a request. Chances are you had figured that out already. The important thing to note here is that since the `Response` represents a network `Response` there are only [a handful of supported values that can be passed into its constructor](https://developer.mozilla.org/en-US/docs/Web/API/Response/Response#Parameters).

Thus, if you want to construct a custom polyfill, you'll need your transformed data to be in one of those formats.

That's pretty much it for the Service Worker specific code. Not much to it, but there is a lot of context and knowledge baked into every line.



## The Stream

We have our `FetchEvent` listener and polyfill scaffolding in place, but how do we understand this "stream" business? Since the WHATWG Streams API is relatively new, I want to spend some extra time discussing it before implementing it.

### Readable and Writable Streams

The bulk of the Streams API centers on two concepts: _readable_ and _writable_ streams.

A `ReadableStream` represents a stream of data that you can read from. Similarly, a `WritableStream` represents a stream of data that you can write to.

For the most part, you'll likely interact with `ReadableStreams` more frequently than `WritableStreams`. This is because, in my experience, you spend far more time reading data than you do writing data on the web. For instance, as mentioned earlier, `Response` objects returned by calling `fetch()` now give you a `response.body` property that is a `ReadableStream` of data for the body of the fetch's response.

I'm not going to cover how to create these two types of streams (because it's not necessary for what we want to do), but I will talk about one method on the `ReadableStream` class: `pipeThrough()`.

`ReadableStreams` have two "pipe" methods: `pipeTo` and `pipeThrough`. The `pipeTo` method sends each chunk of data from the readable stream to a writable stream, where it can then be written out to a destination. The `pipeThrough` method, on the other hand, takes a writable and a readable stream and sends chunks of data through the writable stream which is then expected to pipe them through to the next readable stream.

Why would you want to do such a thing? The answer is to _transform_ data. By piping data to a writable stream, you can run a transformation on that data as it arrives. You then can put that data back into a readable stream and now you have a convenient way to chain transformations and then read the data as if no transformation had occurred.

This leads us to our next point.

### Transform Streams

A `TransformStream` is essentially a coordinated writable and readable stream with a transformation function in the middle.

So in our code above, when we have:

{% highlight javascript linenos %}
const decrypter = new TransformStream(new Decrypter());
const decryptedStream = response.body.pipeThrough(decrypter);
{% endhighlight %}

We can also think of it like this:

{% highlight javascript linenos %}
const decryptedStream = response.body.pipeThrough({
    writable: new WritableStream({}),
    readable: new ReadableStream({})
});
{% endhighlight %}

You could actually write a transform stream as an object like the above, but it requires a good bit of boilerplate to coordinate the two streams, which is why it's better to use the `TransformStream` class instead.

The `TransformStream` class is easier to construct as it only needs one object: a "transformer".

#### Transformers

To construct a `TransformStream` you have to provide what is known as a "transformer" object. In our code above, the `Decrypter` object we instantiate is a "transformer" object (we'll talk more about the specifics of the `Decrypter` in the next section).

A transformer is an object that defines how the transformation of a `TransformStream` actually happens; the behavior of the stream, if you will.

The interface of a transformer looks like the following:

{% highlight javascript linenos %}
class Transformer {
    async start(controller) {}
    async transform(data, controller) {}
    async flush(controller) {}
}
{% endhighlight %}

It has three methods: `start`, `transform`, and `flush`. All three of these are optional, but if no `transform` method is defined then you get a no-op transform. Additionally, they can all return `Promises` (meaning they can be async).

Each method receives a `controller` object as an argument. The `controller` represents the object controlling the output from the stream. The primary method you'll use from it is the `enqueue` method which allows you to add a chunk of data to the output.

The `start` method runs when the `TransformStream` first begins to receive data. In it, you can do any state set up for the transformation or potentially add prelude data to the output.

The `transform` method then runs for each chunk of data that the stream receives. In it, you can process the data in any fashion before enqueuing it to the output (or ignoring it).

The `flush` method runs after all the data has been received and transformed. In it, you can do any final cleanup or remaining data processing. Once this method resolves, it'll mark the end of the transform stream.

So now that we understand how to use a `TransformStream`, let's implement our polyfill as a transformer!



## The Polyfill

We've covered what the Streams API brings to the table so we're finally able to start writing our actual polyfill code. Along the way, we'll also be learning a bit about the Web Cryptography API.

### Start

We start by defining a new "transformer" `class` for our transformation. Since we're implementing an encrypted image format, our transformation will be to decrypt the image data. Thus, we'll call our class `Decrypter`:

{% highlight javascript linenos %}
class Decrypter {}
{% endhighlight %}

Next, we'll add our `start` method:

{% highlight javascript linenos %}
class Decrypter {
  async start() {
    this.key = await getCryptoKey();
    this.counter = new Uint8Array(16);
  }
}
{% endhighlight %}

This start method sets up some state for our transformations. There are two things we need:

1. The key to decrypt our data.
2. A counter to track how many blocks of data have been decrypted.

The `getCryptoKey` method is a small wrapper around the [`importKey` method](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/importKey) from the Web Crypto API. It looks like this:

{% highlight javascript linenos %}
const getCryptoKey = async () => {
  const rawKey = {
    alg: 'A256CTR',
    ext: true,
    k: 'stGLDuF_G8aWxuyLjiFj-qQxZcLoHnSu7heN7MmPoN0',
    key_ops: [
      'encrypt',
      'decrypt'
    ],
    kty: 'oct'
  };
  const algorithm = { name: 'AES-CTR' };
  const key = await crypto.subtle.importKey('jwk', rawKey, algorithm, false, ['encrypt', 'decrypt']);
  return key;
};
{% endhighlight %}

`importKey` enables you to create a [`CryptoKey` object](https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey) (which is needed for Web Crypto methods) from a simple JSON object (the `rawKey` above).

Our `rawKey` is in the [JSON Web Key, or `jwk`, format](https://tools.ietf.org/html/rfc7517) and is meant for the `AES-CTR` encryption algorithm, so we pass those as arguments. We're not planning on "extracting" the key from the `CryptoKey` object later so we pass `false` as the 4th argument and finally we specify that we'll use the key for encryption and decryption.

This polyfill is using AES encryption, which is a symmetric encryption algorithm meaning the same key is used for both encryption and decryption. So, in the function above, we're importing the key that I had previously exported when encrypting the image.

The algorithm is also using the "counter" (or `CTR`) mode which is a "[block cipher](https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation)" mode meaning that we can encrypt and decrypt data in "blocks".

That brings us to our next piece of state, we initialize a `Uint8Array` to use as our counter. This will be used in the `decrypt` method later and serves to count how many blocks of data we've decrypted.

### Transform

That's it for our `start` method; we have our key and our counter ready, now we can begin decrypting data.

We'll do this in the `transform` method:

{% highlight javascript linenos %}
class Decrypter {
  async transform(encryptedDataChunk, controller) {
  }
}
{% endhighlight %}

We'll be getting chunks of AES encrypted data. With the AES-CTR algorithm, we encrypt and decrypt "blocks" of data of a certain length. For this implementation, we're using a length of 128 bits which also equates to 16 bytes.

So, our first step in the transformation will be to figure out how many "blocks" we're decrypting:

{% highlight javascript linenos %}
class Decrypter {
  async transform(encryptedDataChunk, controller) {
    let dataToDecrypt = encryptedDataChunk;

    const length = dataToDecrypt.length;
    const blocks = Math.floor(length / 16);
    const remainder = length % 16;
  }
}
{% endhighlight %}

We get the number of blocks, but potentially have a chunk of data that includes a partial block. In that case, we want to take the remainder and save it for the next chunk of data we process:

{% highlight javascript linenos %}
if (remainder) {
  dataToDecrypt = dataToDecrypt.slice(0, length - remainder);
  this.remainderData = dataToDecrypt.slice(length - remainder);
}
{% endhighlight %}

Next, we can actually take the `dataToDecrypt` and decrypt it using the [`SubtleCrypto.decrypt` method](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/decrypt):

{% highlight javascript linenos %}
const decryptedData = new Uint8Array(
  await crypto.subtle.decrypt({
    name: 'AES-CTR',
    counter: this.counter,
    length: 128
  }, this.key, dataToDecrypt)
);
{% endhighlight %}

The first argument is an [`AesCtrParams` object](https://developer.mozilla.org/en-US/docs/Web/API/AesCtrParams). Here you can see how we use the counter and length we talked about earlier. This essentially defines how to decrypt the data.

The second argument is the key to decrypt the data with.

The third argument is then the actual data to decrypt.

The `decrypt` method returns a `Promise` that resolves with an `ArrayBuffer` of the decrypted data, but we cast it to a `Uint8Array` because since that's the format our stream is operating with.

We can then enqueue that decrypted data into the Transformer's output:

{% highlight javascript linenos %}
controller.enqueue(decryptedData);
{% endhighlight %}

Then, we need to increment our counter:

{% highlight javascript linenos %}
for (let i = 0; i < blocks; i++) {
  incrementUint8ArrayCounter(this.counter);
}
{% endhighlight %}

The `counter` acts as a starting point for the decryption algorithm. Thus, the algorithm itself doesn't increment the counter and so we have to do it ourselves to make sure the next decryption starts at the right point.

Unfortunately, since the counter is a `Uint8Array`, we have to write a special function to increment it:

{% highlight javascript linenos %}
const incrementUint8ArrayCounter = (counter, digit = 15) => {

  if (digit < 0) {
    return;
  }

  counter[digit] += 1;

  if (counter[digit] === 0) {
    incrementUint8ArrayCounter(counter, digit - 1);
  }
};
{% endhighlight %}

Basically, this increments the right-most digit of our array. If that digit reaches its maximum and rolls over to `0`, we then increment the digit to the left of it. We follow that logic recursively.

Finally, we need to handle our `remainderData` from before. At the beginning of our function, we'll check if we have any data left over from the last invocation and prepend it to our `dataToDecrypt` if so:

{% highlight javascript linenos %}
class Decrypter {
  async transform(encryptedDataChunk, controller) {
    let dataToDecrypt = encryptedDataChunk;

    if (this.remainderData) {
      dataToDecrypt = concatUint8Arrays(this.remainderData, dataToDecrypt);
      this.remainderData = null;
    }

    // ...
  }
}
{% endhighlight %}

Again, since we're dealing with `Uint8Arrays`, we have a special `concatUint8Arrays` function to concat the two arrays together. Its implementation is like so:

{% highlight javascript linenos %}
const concatUint8Arrays = (a, b) => {
  const c = new Uint8Array(a.length + b.length);
  c.set(a);
  c.set(b, a.length);
  return c;
};
{% endhighlight %}

That's everything for our `transform` function. So our final method looks like this:

{% highlight javascript linenos %}
class Decrypter {
  async transform(encryptedDataChunk, controller) {
    let dataToDecrypt = encryptedDataChunk;

    if (this.remainderData) {
      dataToDecrypt = concatUint8Arrays(this.remainderData, dataToDecrypt);
      this.remainderData = null;
    }

    const length = dataToDecrypt.length;

    const blocks = Math.floor(length / 16);
    const remainder = length % 16;

    if (remainder) {
      dataToDecrypt = dataToDecrypt.slice(0, length - remainder);
      this.remainderData = dataToDecrypt.slice(length - remainder);
    }

    const decryptedData = await decrypt(this.key, dataToDecrypt, this.counter);
    controller.enqueue(decryptedData);

    for (let i = 0; i < blocks; i++) {
      incrementUint8ArrayCounter(this.counter);
    }
  }
}
{% endhighlight %}

Note, I extracted the `crypto.subtle.decrypt` logic into a separate `decrypt` function since we'll reuse it in a moment.

### Flush

The last part of our implementation is to ensure that we don't have any leftover `remainderData` after our final chunk has been received. We do this in the `flush` method:

{% highlight javascript linenos %}
class Decrypter {
  async flush(controller) {
    if (this.remainderData) {
      const decryptedData = await decrypt(this.key, this.remainderData, this.counter);
      controller.enqueue(decryptedData);
    }
  }
}
{% endhighlight %}

This is similar to the core of our `transform` method, but since it is the final piece of data we don't worry about it being a complete block or about incrementing the counter after decrypting.

And with that, we have our full implementation of a transparent, streaming polyfill for an encrypted image format!



## The Results

So there you have it! A deep dive into putting together your own custom image format polyfill using web technologies.

We started by registering a Service Worker and setting up a `FetchEvent` listener that handles requests for our polyfilled image format. When it gets one of those requests, it fetches the original data and pipes its `body` through a `TransformStream` that converts it to normal PNG data.

Now, this approach works and is even fairly quick (depending on the type of transform), but I don't think it would be good to deploy to production environments as is. Because this approach relies on a Service Worker being registered and activated, you might miss some requests, which makes it too unreliable for many production environments (though not all).

I think implementing this is a good way to familiarize yourself with some of the awesome new web platform features we're starting to have available today and it's always fun to experiment! So, if you try this out or anything similar, let me know! I'd love to take a look and probably share it!

You can check out [the final code](https://glitch.com/edit/#!/cryptogram-streaming?path=public/service-worker.js) and [live demo](https://cryptogram-streaming.glitch.me/) on Glitch.
