---
layout: post
title:  "Don't Ask Me Questions; Give Me Hypotheses"
author: "Trent Willis"
date:   2016-02-04
image:  "2016-02-04-dont-ask-questions.jpg"
---

I'm an [introvert](http://g.fastcompany.net/multisite_files/cocreate/imagecache/inline-original/inline/2013/07/1683402-inline-i-how-to-interact-with-an-introvert.jpg) by nature, which means I try to limit my interactions to those that I feel are meaningful and efficient with their use of energy. Similarly, this means that interactions which I feel are inconsequential or inefficient with their use of energy tend to annoy me. In particular, I have recently spent a good deal of time thinking about my interactions related to solving problems and how to improve them. I feel that, within the realm of software engineering, those problem solving interactions too often wind up being more inefficient and wasteful than they should be.

As "problem solvers" or "innovators", it is only natural that software engineers spend a good portion of their time seeking answers to various questions. The questions for which we seek answers to range from the innocuous, _"[what is the air-speed velocity of an unladen swallow?](https://www.youtube.com/watch?v=liIlW-ovx0Y)"_, to the tremendously involved, _"how do we scale our real time notifications to millions of members?"_, but most of the time they fall somewhere in the middle.

For many, those questions that fall somewhere in the middle require us to rely on others that have more expertise and experience than ourselves in the appropriate field. This is why platforms such as [StackOverflow](http://stackoverflow.com/) and [Quora](https://www.quora.com/) are so heavily used and frequented by developers. It is this middle range of questions that make up a large portion of our daily work (or, at least, a large portion of the interesting work). But, surprisingly, I feel a lot of us are quite bad at making problem solving interactions consistently meaningful and efficient.

Specifically, I think too many of us tend toward being "answer-finders" rather than "problem-solvers". We approach our peers inadvertently with a desire to find an answer rather than solve a problem, which can lead to inefficient and, sometimes, tedious interactions for both parties.

## Answer-Finding Vs. Problem-Solving

If we go by pure dictionary definitions, these two tasks are virtually the same thing, but their connotations are quite different, which leads to them being quite different in practice. At the most basic level, I think of answer-finding as a singular action and problem-solving as a process, or series of actions.

As a simple example, let's assume I receive an error in the application my team is working on:

{% highlight bash linenos %}
Error: Cannot find module 'child-module' imported from 'parent-module'.
{% endhighlight %}

An answer-finding approach to fixing this error is to simply repost the error and see if anyone from the team knows how to fix it. In other words, take a single action of asking if anyone knows how to fix this particular error. There is a chance someone will have the exact solution you need, but, more than likely, you won't get much further than you already were and will spend additional time churning on the issue until someone else runs into the same problem.

A problem-solving approach to the same issue starts with some background research. You might say, "_well, it says it can't find a module, so let me make sure that module exists_". If it turns out the module doesn't exist, you might say, "_well, should this module be getting imported?_" and investigate that. Before you know it, you have formed a reasonable solution to your problem, "_looks like this module was deleted in the last commit and this reference wasn't cleaned up, so I can just stop importing it_".

What is the primary difference between these situations? Well the most obvious is that you got a solution in the second example, but that is somewhat contrived. It could very well be that you got an answer by simply asking in your team's chat channel.

The true difference between the two is that in the second example you came away with an understanding of the cause of the problem as well as what the _correct_ solution is. I emphasize "correct" because it is very plausible and easy to get a solution to an issue that may not be the correct and/or best solution for that particular instance.

> Understanding the problem is often just as important as knowing the solution.

In addition to increasing your understanding of the solution, you can also inadvertently make yourself more knowledgeable of your software in general. In the above example, for instance, by diving into the error and fixing the root cause, you expose yourself to understanding that type of issue which will help you fix future, similar problems more efficiently. It also sets you up to be aware of other aspects of the system you're working on, such as the fact that `child-module` is no longer being used in your application.

## This Thing Called "The Scientific Method"

The process I describe above isn't a programming technique; it can't even be claimed by the field of software engineering. It is actually a technique most of us learned in grade school: [_the scientific method_](https://en.wikipedia.org/wiki/Scientific_method).

Since it is likely to have been a while since intentionally using the scientific method, let's review it real quick. Here are the steps:

1. Make an Observation
2. Ask a Question
3. Do Background Research
4. Construct a Hypothesis
5. Test Your Hypothesis by Doing an Experiment
6. Analyze Your Data and Draw a Conclusion
7. Communicate Your Results

Now, with this method in mind, we can think about similar processes within the realm of software engineering. For example, we frequently hear about "debugging" and "troubleshooting", but these terms are often ambiguous processes at best and skill-specific tasks at worst. Instead we should apply the science part of our "[computer science](https://en.wikipedia.org/wiki/Computer_science)" backgrounds and use the process that is applicable to virtually every problem we encounter.

If we revisit the terms "answer-finder" and "problem-solver", we can find where they fit into this process. An answer-finder stops at step 2, _"ask a question"_, but a problem-solver continues on to _at least_ step 4, _"construct a hypothesis"_, but may make it to the end of the entire process or have to repeat it multiple times until they get stumped.

## Why Answer-Finding Is Inefficient

It is easy to get sucked into the "Stack Overflow Mindset" of an answer-finder, where we expect those with more experience to simply answer our questions without much effort on our part. However, now that we have a framework in which to think about problem solving, we can look at why that mindset can lead to inefficient and tedious interactions. It breaks down into two major points.

First, by eliding background research, you are burdening the rest of your team with unnecessary work. To see this, you need recognize that in order to correctly solve an issue you need context; this ranges from "_what code changes have been made_" to "_what is the end goal you are trying to accomplish_". By not completing background research before consulting with others, you add a burden to them of needing to re-establish the context in order to do their own background research. Instead, you should just cut out that extra work and research the problem before coming to your team for help.

Second, you are cheating yourself out of **valuable experience**. I mentioned this above, but it is super important. Exposing yourself to solving various problems and practicing the development of hypotheses about issues can help you solve problem much faster in the future. It also helps distribute the problem-solving amongst the entire team instead of relying on a specific portion.

In other words, doing your due diligence up front, you will have a greater return in the future and won't be duplicating as much work.

## How To Ask For Help Efficiently

No matter how effective your problem solving skills become, there will undoubtedly be times where you need to ask for help from team members. To me, being a problem solver does not mean you never ask for help, it means you ask for help in a meaningful and respectful manner.

Specifically, when you ask for help from your team members, you should be able to immediately provide three pieces of information to them other than the problem:

1. The context of the problem,
2. The research/investigation you have done, and
3. Your current hypothesis (what you believe is the root problem, or, alternatively, the solution)

The research you have done can include previous hypotheses and tests that you have ruled out, and, in some cases, not having a hypothesis is okay. If you have exhausted your ability to reasonably research and investigate the issue, then you can help your team rule out many potential causes and solutions without necessarily giving them a hypothesis to pursue.

The whole goal of this outline is to show that you have done your due diligence, thereby showing that you have put your own effort forth and value your team's time.

So, next time you are thinking about simply asking your teammates to answer a problem for you, take a moment and do background research so you can both grow yourself and unburden your team members. In other words, don't be an answer-finder; be a problem-solver.
