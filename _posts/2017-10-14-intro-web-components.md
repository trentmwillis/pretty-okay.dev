---
layout: post
title:  "Intro to Web Components"
author: "Trent Willis"
date:   2017-10-14
image:  "2017-10-14-intro-web-components.jpg"
excerpt: "There are lots of great and really in-depth resources on Web Components, but relatively few that cover how to dive in and connect all the disparate pieces of them. This short article will take you through developing a simple web component that uses HTML Templates, Custom Elements, and Shadow DOM as currently specified so you can begin exploring these awesome new web technologies!"
---

There are lots of great and really in-depth resources on [Web Components](https://www.webcomponents.org/introduction), but relatively few that cover how to dive in and connect all the disparate pieces of them. This short article will take you through developing a simple web component that uses HTML Templates, Custom Elements, and Shadow DOM as currently specified so you can begin exploring these awesome new web technologies!

---

## HTML Template

The first thing we need to do is define a template to use for our component. We can do this by leveraging the new [`<template>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template):

{% highlight html linenos %}
<template></template>
{% endhighlight %}

The `<template>` element allows us to define _inactive_ HTML code that can later be used as actual HTML elements. This means you can place content, styles, or scripts within a `<template>` and they won't actually do anything until they are used elsewhere.

Before defining anything, however, we should add an identifier to make it easy for us to lookup our template in the DOM later. In this example I'm going to use the descriptive (albeit a bit long) `id` of `vanilla-webcomponent-template`:

{% highlight html linenos %}
<template id="vanilla-webcomponent-template"></template>
{% endhighlight %}

Now, we can define a bit of HTML to render:

{% highlight html linenos %}
<template id="vanilla-webcomponent-template">
  Hello, <span class="red">world</span>!
</template>
{% endhighlight %}

We're going to display the traditional "Hello, world!", but with a special CSS class to turn the word "world" red.

We can define the CSS class and style by using a `<style>` element and inserting standard CSS:

{% highlight html linenos %}
<template id="vanilla-webcomponent-template">
  <style>
    .red {
      color: red;
    }
  </style>

  Hello, <span class="red">world</span>!
</template>
{% endhighlight %}

That will be it for our component's template.

## Custom Element

Next, we need to define the [Custom Element](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Custom_Elements) class that will control the functionality of our component (this will include the logic of rendering the template):

{% highlight javascript linenos %}
class VanillaWebcomponent extends HTMLElement {
}
{% endhighlight %}

We use an [ES6 class](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes) that extends the native [`HTMLElement` class](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement). This is a valid Custom Element, but, in its current state, it won't actually do anything when we create one.

We want the component to render the template we created earlier. In order to do that, we want to define a custom [`constructor` method](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/constructor) that will be called when the element is instantiated:

{% highlight javascript linenos %}
class VanillaWebcomponent extends HTMLElement {
  constructor() {
    super();
  }
}
{% endhighlight %}

Note that since we are extending the `HTMLElement` class, we need to invoke the `super` method, which will ensure any logic from the `HTMLElement` constructor is executed in addition to the logic we will define.

## Shadow DOM

The first piece of logic we want to add is to attach a [Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Shadow_DOM) node.

One of the great promises of native web components is the ability to encapsulate styles local to the component via the use of Shadow DOM. This means that the `<style>` we added to the template earlier will only be applied to our Custom Element's template and not leak out into other elements.

However, Custom Elements don't actually use Shadow DOM by default; in order to enable it, we need to call [`attachShadow`](https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow):

{% highlight javascript linenos %}
class VanillaWebcomponent extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
  }
}
{% endhighlight %}

This method will create a Shadow DOM node for use by the element. Since we called it with the `mode` set to `open`, we will be able to access the Shadow DOM node via the `shadowRoot` property on the element.

## Pulling It All Together

Now that we have our template and a class with a shadow DOM, we can actually render something!

First, we get the markup from our template:

{% highlight javascript linenos %}
class VanillaWebcomponent extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' });

    const template = document.getElementById('vanilla-webcomponent-template');
    const templateInstance = template.content.cloneNode(true);
  }
}
{% endhighlight %}

We retrieve the `<template>` element using the `id` we gave it earlier. We can then access the actual template code via the `content` property of the template element.

If we were to use the `content` directly, it would be shared amongst all instances of our component which means that if we changed anything, those changes would be reflected everywhere. This is undesirable in most cases, so we want to clone the `content`.

Thankfully, there is a simple API for doing this cloning: [`cloneNode`](https://developer.mozilla.org/en-US/docs/Web/API/Node/cloneNode). Passing `true` to this method will deeply clone the entire structure of a [Node](https://developer.mozilla.org/en-US/docs/Web/API/Node).

Now that we have our clone, we can attach it to the shadow DOM we instantiated earlier:

{% highlight javascript linenos %}
class VanillaWebcomponent extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' });

    const template = document.getElementById('vanilla-webcomponent-template');
    const templateInstance = template.content.cloneNode(true);

    this.shadowRoot.appendChild(templateInstance);
  }
}
{% endhighlight %}

Finally, we have our Custom Element class. In order to use it, however, we need to register it for use:

{% highlight javascript linenos %}
customElements.define('vanilla-webcomponent', VanillaWebcomponent);
{% endhighlight %}

Now, whenever we use `<vanilla-webcomponent>` it will use the Custom Element class we defined. So, let's give it a whirl!

{% highlight html linenos %}
<p>Hello, <span class="red">world</span>!</p>
<vanilla-webcomponent></vanilla-webcomponent>
{% endhighlight %}

Here, we compare similar markup outside the component with the component itself. This will help illustrate the style scoping mentioned earlier.

You can see everything in action in the CodePen below:

<p data-height="265" data-theme-id="dark" data-slug-hash="NaBYWN" data-default-tab="html,result" data-user="trentmwillis" data-embed-version="2" data-pen-title="Simple (Annotated) Web Component Example" data-preview="true" class="codepen">See the Pen <a href="https://codepen.io/trentmwillis/pen/NaBYWN/">Simple (Annotated) Web Component Example</a> by Trent Willis (<a href="https://codepen.io/trentmwillis">@trentmwillis</a>) on <a href="https://codepen.io">CodePen</a>.</p>
<script async src="https://production-assets.codepen.io/assets/embed/ei.js"></script>

And that's it! This is everything you need to know to get you up and running with basic HTML Templates, Custom Elements, and Shadow DOM.

I am planning on building a side project with these native technologies, so be on the lookout for more advanced tutorials coming in the future!
