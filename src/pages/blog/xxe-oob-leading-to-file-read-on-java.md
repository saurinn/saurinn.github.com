---
layout: ../../layouts/BlogLayout.astro
title: XXE Out-of-Band via a vulnerable iText library through a file upload function
description: HTML is the foundation of all websites. This guide will walk you through creating your first simple website using HTML.
tags: ["code", "html"]
time: 4
featured: true
timestamp: 2025-06-23T11:12:03+00:00
filename: xxe-oob-leading-to-file-read-on-java
---

Hey there! My name's Manuel Valdez, I go by the handle saurinn/saur1n, or whatever. This is my fisrt writeup so go easy on me.

This article explains how I found a Blind XXE via a version of iText which is vulnerable to CVE-2017-9096. This package was been used by a Bug bounty program's stack to handle/extract text and metadata from PDF documents through a file upload feature.


<mark>The scope of this does not include the definition of XXEs, sorry about that, I'm trying to make this as straightforward as I can, you know, KISS...</mark>

<img src="/src/kiss.gif" alt="kiss gif" width="500" height="300" />

