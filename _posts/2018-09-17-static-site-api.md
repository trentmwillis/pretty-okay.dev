---
layout: post
title:  "How To Turn Your Static Site Into An API With Puppeteer"
author: "Trent Willis"
date:   2018-09-17
image:  "2018-09-17-static-site-api.jpg"
excerpt: "A couple weeks ago I gave a talk at Nordic.js about Powerful Automation with the Chrome DevTools Protocol. In the talk, I shared a demo of an API using Puppeteer that retrieved content from a static website. Let's build that together!"
---

A couple weeks ago I gave a talk at [Nordic.js](http://nordicjs.com/) about [_Powerful Automation with the Chrome DevTools Protocol_](https://noti.st/trentmwillis/wls5J4/powerful-automation-with-the-chrome-devtools-protocol). In the talk, I shared a number of demos for various use cases of the protocol powered by [Puppeteer](https://github.com/GoogleChrome/puppeteer), which allows you to control [Chromium](https://www.chromium.org/)-based browsers in [Node](https://nodejs.org/) via the [DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/).

One of the later demos I gave was using Puppeteer to power a [RESTful API](https://en.wikipedia.org/wiki/Representational_state_transfer) for your [static website](https://en.wikipedia.org/wiki/Static_web_page) (or any website where you can't build a direct API for the content). If you have a site that fits that bill, then this may sound appealing. For instance, if I want to access and share the content I currently have published on this blog, then I would have to either completely change how the site is built or duplicate the content. There is no easy way for me to reuse the content I have published...until now!

Let's walk through how to build a small server that allows us to get a random post from this blog as a simple `GET` request!

_Note: The following walkthrough expects you to have some familiarity with setting up Node applications. If you're new to Node, you might want to start with the [Node getting started guide](https://nodejs.org/en/docs/guides/getting-started-guide/)._

## The Approach

Before we dive into the code, we should think about what our implementation should look like.

Given that the site is static we'll want to pull content from it similarly to how a user would do so. For a random post, we'll want to visit the posts index and select one randomly from there. Once we have it selected, we'll click on the link and wait for the content to load before reading it with Puppeteer. Make sense?

At this point, I feel it's worth mentioning that this approach is viable because this site loads quickly, which means our API can load multiple pages while still having reasonable latency for each request. It's important that if you want to build a Puppeteer-powered API, then the underlying website you interact with will need to be performant or else you'll have long load times for anything that depends on your API.

With the approach for the implementation settled on, let's dive in!

## The Server

We can start by setting up a minimal [Express](https://expressjs.com/) server:

{% highlight javascript linenos %}
// file: server.js
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.get('/random-post', async (request, response) => {
    response.json(await getRandomPost());
});

app.listen(port, () => console.log(`http://localhost:${port}`));
{% endhighlight %}

This server is roughly the same as the one covered in the [Express "Hello world" example](http://expressjs.com/en/starter/hello-world.html), so if any of the above is confusing to you, it's recommended you check out that guide.

The most noteworthy aspect is that we define an `async` route handler for `/random-post` (lines 7-9) that is going to get us a random post from the blog as we discussed above.

That's all there is for the server itself, so let's move on to the good stuff: the `getRandomPost` method that powers our endpoint!

## The Endpoint

For our endpoint function, we're going to use Puppeteer to get the content of a random post on the blog.

To start, we'll import Puppeteer and define our function signature:

{% highlight javascript linenos %}
// file: server.js
const puppeteer = require('puppeteer');
const getRandomPost = async () => {};
{% endhighlight %}

Pretty straightforward so far.

Next, we'll define the actual function logic. We want to start by launching a browser instance with Puppeteer and then navigating to the blog site:

{% highlight javascript linenos %}
// file: server.js method: getRandomPost
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto('https://pretty-okay.dev/');
{% endhighlight %}

Thanks to Puppeteers descriptive API, it's pretty clear what is happening in the above snippet. The only thing that might be worth clarifying is that you can think of a "page" as a "tab" in the context of Chrome.

So, we're launching the browser, opening a tab, and going to the blog. Cool.

Next, we need to load up a random blog post. Thankfully, this site isn't paginated at all (because I don't write _that_ many posts), so we can accomplish this by grabbing all the post links and then selecting one at random:

{% highlight javascript linenos %}
// file: server.js method: getRandomPost
const postLinks = await page.$$('.post-title > a');
const postIndex = getRandomInt(postLinks.length);
{% endhighlight %}

The `page.$$` method runs [`document.querySelectorAll`](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelectorAll) within the browser page and returns the results. (Note: `page.$` runs [`document.querySelector`](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector) if you're interested in a single object). I'm personally not a fan of the naming of this method as I feel it's a bit opaque, but alas.

We then use the number of links we got (the `length`) to help us get a random integer within the range of `[0, length)`. To do this I wrote a small helper function:

{% highlight javascript linenos %}
// file: server.js
const getRandomInt = max => Math.floor(Math.random() * max);
{% endhighlight %}

Now that we have selected the index of our random blog post, we need to actually view it so that we can access the content. We do so by clicking on it and waiting for it to load (like a real user would):

{% highlight javascript linenos %}
// file: server.js method: getRandomPost
const postLink = postLinks[postIndex];
const navigation = page.waitForNavigation();
await postLink.click();
await navigation;
{% endhighlight %}

This little section can be a bit unclear at first so let's break it down.

We get the link we plan to click and then, before clicking the link, we call `page.waitForNavigation`. The reason we do this is that if we click the link first, then the navigation event might fire before we call `page.waitForNavigation` and then we will be waiting forever for another navigation event. So we start waiting for the navigation event, click the link, and then finish waiting once the navigation is completed.

Once the above is completed, we'll now be on the actual random blog post page.

Now, all we need to do is get the content from the page that we're interested in:

{% highlight javascript linenos %}
// file: server.js method: getRandomPost
const title = await page.$eval('.banner-title', title => title.textContent.trim());
const content = await page.$eval('.article-content', content => content.textContent.trim());
{% endhighlight %}

In this case, we extract the post's `title` and `content`. We do this by using the `page.$eval` method which performs a `document.querySelector` call and then passes the result of that to a callback function to evaluate in the browser's page. The result of that callback function is then returned to our script.

So, in this instance, we get the title and content elements and then extract their text content minus any leading or trailing whitespace.

Finally, we'll also grab the post's url and return all that information as an object:

{% highlight javascript linenos %}
const permalink = await page.url();

await browser.close();

return {
    title,
    content,
    permalink
};
{% endhighlight %}

Oh and make sure you close down the browser! You don't want a bunch of stray Chrome instances sitting idle on your server.

## The Final Product

And that about wraps it up! Aside from the bit about the navigation and understanding `$`, it's a relatively straightforward implementation that lets us build an API for accessing a static site. Instead of having to completely rearchitect my blog, I can stand up this little Node server to make accessing my blog's content easy!

You can view a working demo of this on Glitch at [static-site-api.glitch.me](https://static-site-api.glitch.me/) or, alternatively, you can view the entire source code in the snippet below.

<div class="collapsible">
{% highlight javascript linenos %}
// file: server.js
const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = process.env.PORT || 3000;

const getRandomInt = max => Math.floor(Math.random() * max);

const getRandomPost = async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://pretty-okay.dev/');

    const postLinks = await page.$$('.post-title > a');
    const postIndex = getRandomInt(postLinks.length);

    const postLink = postLinks[postIndex];
    const navigation = page.waitForNavigation();
    await postLink.click();
    await navigation;

    const title = await page.$eval('.banner-title', title => title.textContent.trim());
    const content = await page.$eval('.article-content', content => content.textContent.trim());
    const permalink = await page.url();

    await browser.close();

    return {
        title,
        content,
        permalink
    };
};

app.get('/post', async (request, response) => {
    response.json(await getRandomPost());
});

app.listen(port, () => console.log(`http://localhost:${port}`));
{% endhighlight %}
</div>

That's all for now! Assuming I find the motivation, I'll likely deconstruct a couple more of the demos I shared at Nordic.js in the coming months, so if you found this insightful, [stay tuned](https://twitter.com/trentmwillis)!
