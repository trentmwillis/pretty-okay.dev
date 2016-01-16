---
layout: post
title:  "Quick Tip: Filter-Map -> Reduce"
author: "Trent Willis"
date:   2016-01-15
---

If you do any decent amount of data manipulation in JavaScript, you are likely to use `Array.prototype.map` and `Array.prototype.filter`. They're immensely useful for performing transforms on each member of the data set, but sometimes this usefulness leads to poor design decisions.

Particularly, I have often seen developers chain the two methods together. This is enticing since it allows some really cool and compact code. For instance, let's say you have an array of users and you want to transform it into an array of name's that match a certain pattern:

{% highlight javascript linenos %}
let matchedNames = users
  .filter((user) => pattern.test(user.name))
  .map((user) => user.name);
{% endhighlight %}

While this is nice and compact (things you should definitely desire), you are sacrificing performance by performing two loops over a data set that you should only traverse once. In other words, your worst case performance using the above is `O(2n)` when it should only be `O(n)`.

We can keep the code similarly compact but get better performance by using the lesser-known Array method `reduce`. If we use it to rewrite the above we get the following:

{% highlight javascript linenos %}
let matchedNames = users.reduce((out, user) => {
  pattern.test(user.name) && out.push(user.name);
  return out;
}, []);
{% endhighlight %}

This code is slightly less easy to read, but if you are working with a large data set on a user interface or the transform sits in a hot code path, the gained performance is well worth it to improve user experience.
