---
layout: post
title:  "\"const\" As A Force For Factoring JavaScript"
author: "Trent Willis"
date:   2018-11-12
image:  "2018-11-12-const-as-a-factoring-force.jpg"
excerpt: "In the \"let\" vs \"const\" debate for JavaScript, I prefer \"const\" because it helps promote decomposition in my functions."
---

If there is any debate in the JS community as hotly contested as "tabs vs. spaces", it is the "`let` vs `const`" debate[*](#footnote). I'm not a zealous supporter of either side, but I do generally prefer using `const` for a few reasons.

Today, I want to talk about one of those reasons, a pattern I have found `const` promotes which is very beneficial: [decomposition](https://en.wikipedia.org/wiki/Decomposition_(computer_science)).

That is, `const` promotes breaking down problems (functions, mainly) into easier to understand and maintain chunks in order to avoid needing mutable bindings (a.k.a., `let`).

As an example of what I mean by this, consider the following code:

{% highlight javascript linenos %}
function generateWelcomeMessage(person) {
    let name = person.name;
    if (person.title) {
        name = `${person.title} ${name}`;
    }

    let greeting;
    switch (person.title) {
        case 'Dr.':
            greeting = 'Hello';
            break;
        case 'Mr.':
        case 'Mrs.':
            greeting = 'Hi';
            break;
        default:
            greeting = 'Hey';
            break;
    }

    return `${greeting}, ${name}!`;
}
{% endhighlight %}

I see code like this relatively regularly and there is nothing _technically_ wrong with it.

But, if that function were to grow over time or additional properties on the `person` were added that affect the resultant message, then this function might become quite difficult to understand.

If, however, we think about using `const` for the `greeting` and `name` above, it pushes us towards a better factoring of the code. This is because in order for us to use `const` we need to compute the final state of the variable in a single expression, likely a function call.

So, what you might wind up with is this instead:

{% highlight javascript linenos %}
function getName(person) {
    if (person.title) {
        return `${person.title} ${person.name}`;
    }

    return person.name;
}

function getGreeting(title) {
    switch (title) {
        case 'Dr.':
            return 'Hello';
        case 'Mr.':
        case 'Mrs.':
            return 'Hi';
        default:
            return 'Hey';
    }
}

function generateWelcomeMessage(person) {
    const name = getName(person);
    const greeting = getGreeting(person.title);

    return `${greeting}, ${name}!`;
}
{% endhighlight %}

In my opinion, this factoring of the code is much easier to both read and understand. Each individual function is easy to reason about and thus the composition of them becomes easier to understand. In the prior approach, to get a full mental model of what `generateWelcomeMessage` was doing, you had to mentally decompose the complex function into those easier to understand bits.

Now nothing prevents you from factoring code like this in a similar manner when preferring `let` over `const`, but there is also nothing pushing you towards a factoring like this.

---

<a name="footnote"></a>
<p class="footnote" markdown="1">
    _*This claim ignores the much more hotly contested debates of frameworks, but I consider those in a different category. One which I like to stay far away from._
</p>
