---
layout: post
title:  "QUnit-In-Browser: Lightweight End-To-End Testing"
author: "Trent Willis"
date:   2017-12-04
image:  "2017-12-04-qunit-in-browser.jpg"
---

Last week, I published the 1.0.0 release of [QUnit-In-Browser](https://github.com/trentmwillis/qunit-in-browser) and, shortly after, got the chance to discuss it briefly at [dotJS](https://www.dotjs.io). I've been using the package for a while now at [Netflix](https://www.netflix.com) and wanted to give a bit of background into what it is and why I've been working on it.

## What It Is

The short pitch for QUnit-In-Browser is that it is a plugin for [QUnit](http://qunitjs.com/) to allow you to execute tests in the browser _within the runtime of any web page_ (including those that are locally hosted or served from the file system). This means that the code your write for an "in browser" test is not run in the context that you actually write it, but is instead run as if it were part of a web page that you specify.

That may have been a bit too abstract, so the following is a more concrete explanation.

First, a quick primer for those unfamiliar with QUnit (or that haven't used it in a while), tests are defined like so:

```js
QUnit.test('description', function(assert) {
  // Test code goes here
});
```

Pretty simple. When using QUnit-In-Browser, tests are defined with just a slight difference:

```js
QUnit.test.inBrowser('description', 'url', function(assert) {
  // Test code to execute in the browser at the specified URL
});
```

The only difference is that there is an additional argument, to specify the URL of the site you want to visit. The code within the function body will then execute at that URL once it loads.

So with some slight deviation from the standard QUnit test, we get tests that execute in the runtime of a web page. And that is basically all that QUnit-In-Browser is. If you feel underwhelmed, I encourage you to keep reading to understand why this is important.

## Why It Matters

This ability, to execute code in the runtime of a web page, is important for making it easier for developers to create "end-to-end" (or "integration") tests for their applications.

Before now, the vast majority of end-to-end testing for web applications was done via one of two approaches:

1. _Controlling the browser externally, via tools like Selenium WebDriver_. This is arguably the most common approach for end-to-end testing and it lets you test against your application in the same environment and fashion that your users are likely to experience it. However, these tests usually do not provide a good experience for developers during maintenance and debugging, because they have a unique [doman-specific language](https://en.wikipedia.org/wiki/Domain-specific_language) and may not even be written in JavaScript. Thus, the whole development experience is quite different from everything else.

2. _Running the application in a "sandbox" context that allows for extra scripts to be loaded, but not in production_. This approach is less common, but seems to have grown in popularity over the last couple years. It provides a better experience for developers during maintenance and debugging, by having a development experience that is similar to other web development. But, it means that the application is run differently from how a user experiences it and thus often diverges from reality at some point, meaning the tests give you less confidence and assuarance that the application actually works in production.

The approach taken by QUnit-In-Browser solves the problems of both of the approaches above.

Since it can run against any web page, you can run your application exactly as your users would experience it. This means testing against production data or staging environments is trivial, which can give you confidence that your tests are verifying reality and not just your sandbox.

Additionally, since the tests execute in the context of the browser, you get full access to your normal development tools in the browser. This means you can debug and iterate just as you would on a normal application feature.

In fact, if you place a `debugger` statement in your test code, QUnit-In-Browser will automatically open the DevTools for you and cause test execution to pause, allowing you to start debugging.

```js
QUnit.test.inBrowser('Debugging test', 'https://pretty-okay.com', function(assert) {
  debugger; // Opens DevTools and pauses the test
});
```

This new approach hits the sweet spot of prioritizing user experience _and_ developer experience.

## How It Works

A reasonable question at this point is, _why hasn't this been done before_? The answer is that, until earlier this year, there just wasn't a good way for us to inject code from an external process into a running web page, and especially not one that was practical for JavaScript.

With the advent of [headless Chrome](https://developers.google.com/web/updates/2017/04/headless-chrome), however, it is now somewhat trivial for us to do. This is because Chrome has a remote debugging protocol that gives us a lot of power for automating a running Chrome instance, including the ability to evaluate code in a running web page context. So, now that we can run Chrome headlessly in CI environments, it opens up new possibilities for how we think about approaching testing.

That is really the crux of how QUnit-In-Browser works. When the test starts, it launches a Chrome instance and connects a remote debugger. The debugger then navigates the browser to the specified web page and injects the test after the page loads. The browser then returns the results from the test and QUnit-In-Browser simply reports them like a normal QUnit test.

I'd highly recommend checking out the [source code](https://github.com/trentmwillis/qunit-in-browser/tree/master/src) if you want more details. It isn't super clean, but should be relatively straightforward, and, if you have any questions, feel free to [reach out to me](https://twitter.com/trentmwillis).

## Where It Is Heading

The project is still in its early stages. As a result, the roadmap right now is just to generate some awareness and figure out what features would be valuable for folks. I'm hoping that work in this space will also dogfood features and ideas for QUnit's built-in CLI as well, since that is how you actually trigger the tests to run.

In the near-term, however, there are at least two features I am planning on adding:

1. Only launch a single Chrome instance for a given test suite. Currently, a new one is launched for each test which is inefficient.
2. Integrate with Chrome 63 support for multiple debuggers. Currently, the package does some hacking to enable a DevTools instance _and_ the test controller to be run simultaneously.

If you want to get involved or have ideas, just [let me know](https://twitter.com/trentmwillis)!
