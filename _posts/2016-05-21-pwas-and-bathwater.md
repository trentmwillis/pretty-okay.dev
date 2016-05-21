---
layout: post
title:  "Progressive Web Apps: Don't Throw The Baby Out With The Bathwater"
author: "Trent Willis"
date:   2016-05-21
image:  "2016-05-21-pwas-and-bathwater.jpg"
---

This past week was [Google IO 2016](https://events.google.com/io2016/) and while there were lots of noteworthy developments and announcements, the Mobile Web track was particularly focused on one topic: [Progressive Web Apps](https://developers.google.com/web/progressive-web-apps/).

Progressive Web Apps (or PWAs) promise to bring native-like app experiences to the mobile web. They achieve this by leveraging new and emerging web standards such as [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) and [Push Notifications](https://developer.mozilla.org/en-US/docs/Web/API/Push_API). In principle, they sound awesome and, in practice, they _are_ pretty awesome as well.

But, for all the awesomeness of PWAs, there seems to be an insidious, undercutting message around their discussion: _if you're using a JS framework, you're doing web development wrong_.

## The Cult of Criticizing Frameworks

In [one of the main talks on PWAs at IO16](https://www.youtube.com/watch?v=fFF2Yup2dMM) a new catchphrase surfaced: [#usetheplatform](https://twitter.com/search?q=%23usetheplatform). The phrase, which was subsequently mentioned in almost every other Mobile Web talk I attended, is a valiant rally cry for Progressive Web App developers. It aims to push Web Standards forward by embracing new and exciting modern browser features to deliver great new experiences and in the process leverage native browser features.

However, the context in which we were being called to "use the platform" often left me feeling unsettled.

In the talk mentioned above, #usetheplatform was introduced alongside a lot of derision and criticism of modern JavaScript frameworks. Now, there obviously needs to be some point of comparison in order to highlight the ways in which PWAs are better than existing web applications, but the implicit message being sent was: _if you use a "mega" framework you're not being forward-thinking_.

This left a bitter taste in my mouth; it was as if "using the platform" stood diametrically opposed to "using frameworks". This pattern of criticizing web frameworks and then praising PWAs was seen frequently throughout the remainder of the conference.

## Progressive Web Frameworks

While JS frameworks certainly have their problems (many of which weren't solvable until recently and only in the most modern browsers), our response with the advent of a more "progressive" web should not be to ditch them entirely, but rather to push them forward as well.

However, we should acknowledge that we're pushing them forward, not as a way to keep ourselves comfortable, but because frameworks _do_ bring a lot of value to development. As [Tom Dale eloquently put it last November](http://tomdale.net/2015/11/javascript-frameworks-and-mobile-performance/):

> Frameworks let you manage the complexity of your application as it and the team building it grows over time

And that is _huge_. Even with Progressive Web Apps, our applications are still going to be complex and we will still need additional design patterns and implementations to help us deal with the complexity over time.

Abandoning all the work that has gone into the existing frameworks simply means that we will need to reinvent ways to tame the complexity of our new framework-less web applications.

So, instead of throwing out all the conventions, patterns, and tooling that we have put in place over the past decade, we should continue to move them forward with the rest of the web.

Instead of setting up the building of Progressive Web Apps as a class of development totally separated from frameworks, we should frame it as a set of features that other frameworks can leverage as well. For me, this means there are three things we need to focus on:

- _First-class support for Service Workers_. The benefits of Service Workers are evident to developers, so instead of arguing that we must use Service Workers alongside only native JavaScript, let's make it easy for developers to use them in their existing applications.

- _Modularize all the things_. If the answer to massive JavaScript files is to piece-wise load them with HTTP/2, then we should bake support for this into major frameworks. Most modern frameworks already use ES6 modules in their source, so it shouldn't be that difficult to start supporting.

- _Align component implementations_. Custom elements and interoperable web components are awesome, but most developers can't take the time to rewrite all their existing component implementations into whatever final Web Component standard is ratified. Instead frameworks should gradually align to the actual standard being proposed, so that it begins to simply work in the future.

Obviously, these tasks aren't exactly simple and will take effort from the greater JavaScript community, but I personally believe the benefits from having Progressive Web Frameworks exceed the benefits of Progressive Web Apps being built entirely in native JavaScript.

Thankfully, I don't think I am alone in this thinking. As [Addy Osmani highlighted in his IO talk](https://youtu.be/srdKq0DckXQ), many of the most popular frameworks already have or are working towards ways to enable PWAs, so the future is nearer than we think.

In summation, leverage the platform to make frameworks better. Don't throw the baby out with the bathwater.
