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


>The scope of this does not include the definition of XXEs, sorry about that, I'm trying to make this as straightforward as I can, you know, KISS...

<img src="/kiss.gif" alt="kiss gif" width="800" height="300" />

---

My style of hacking it's a bit feature orientered, if I see something interesting or several moving parts working based on that particular fuction, I'm investing my time there. This time I was facing a web application that handles different documents like pictures, xls and PDF files, whenever I see some things going on with PDF files I'm definetly taking a look at it. 

There was an upload feature that allowed certain file types: png, jpg, xls, pdf, zip and some others. Uploading images seemed totally fine, clicking on its the settings did not show anything interesting either. Then I selected two images and clicked the same settings button (hamburger icon), suddenly a new option showed up: "Merge files". This combined the two images and embeded them on a single PDF file.

Like I said, images converting to PDF files seem pretty interesting to me, especially by taking a look at them and seeing the names of the two images inside the resulting file. At this point HTMLi to SSRF came to my mind, it's not a surprise to anyone that follows me on twitter/X for a while that I love hunting for those but in this case it wasn't that easy <b>at first</b>


