---
title: "Every customer's PDF file was there for the taking"
description: "An upload request lets the browser name the storage path of the file the server should go and read, and one field decides whether anybody checks that the path belongs to the person asking."
tags: ["bug-bounty", "idor", "cross-tenant", "saas"]
time: 4
featured: false
timestamp: 2026-11-07T21:40:00+00:00
---

A vulnerability in a bug bounty program let me exfiltrate PDF files uploaded by other customers straight into my account with no invitation and no relationship to the target. Like in most large file uploads, it uses a presigned POST, so the API issues a signed slot in an S3 bucket, the browser uploads the file and one last request points the server where to go and extract the file. **The server checked that the address it was given had a PDF file but never checked the ownership of it.**

## Direct to storage, which is how everybody builds this now

This is the flow the application followed.

<img src="/diag-a.svg" alt="Three vertical lanes labelled Your browser, The API and Object storage, separated by a dashed red trust boundary. Numbered arrows cross the boundary in order: ask for somewhere to put a file, upload URL and a path the API chose, upload the bytes straight to storage. A fourth arrow in red crosses from the browser to the API naming my own key docs/1007/1793667812_1.pdf, and a red panel below states that the API opens whatever path it is handed." width="760" height="480" class="dark:hidden max-w-full h-auto" />
<img src="/diag-a-dark.svg" alt="" width="760" height="480" aria-hidden="true" class="hidden dark:block max-w-full h-auto" />

Choosing a PDF in that product goes through the same three steps as any large upload these days, because routing large files through an API spends its bandwidth and its request workers on bytes it never reads. The middle step is why the design exists, since the bytes go straight to object storage and the API never handles them. By the third call the path is arriving from my side of the connection, and the API has no other source for it:

```json
POST /api/v1/reviews HTTP/2
Content-Type: application/json

{"files":[{"file_name":"document.pdf","source":"uploaded",
"key":"docs/1007/1793667812_1.pdf","storage":"https://<bucket>"}],
"title":"My review"}
```

That layout is standard and the presigned step does what it is meant to. The problem is one request later, because the path is passed as a plain parameter like any other, and nothing in that handler ties it back to the account that made the first two calls.

## The problem: nobody asks whose path it is

The `key` is simply where that file ended up, a folder per account followed by the upload time as a Unix timestamp, and putting somebody else's path into it gets you a clean refusal.

That path was not the only thing interesting on that request; it also carried a `source` field saying how the file reached storage, and the app defaults to the same value on every upload. So it was the obvious thing to poke at.

> **Tip:** To find out whether a field takes values other than the one the browser sends, enter some random string in it and see what error message the application returns. Plenty of those checks gracefully print the whole allow list in the response; in this case the error was `Validation failed. The source parameter accepts only "uploaded" or "linked"`.

Huh, another value, let's see what it does. Set `source` to `linked` and the server walks to the path itself, confirms the bytes begin with `%PDF`, and copies the file straight into my account. The ownership check behind that refusal never runs on the `linked` value.

This is the same request body sent twice, differing in one field, and the two answers it came back with.

<img src="/diag-b.svg" alt="Two panels side by side holding the same request body, the left one headed source uploaded and the right one headed source linked, both naming the same foreign key. Beneath the left panel a grey verdict reads 422 Uploaded PDF file is not supported, and beneath the right panel a red verdict reads 201 Created, nothing asked whether the path was mine." width="860" height="372" class="dark:hidden max-w-full h-auto" />
<img src="/diag-b-dark.svg" alt="" width="860" height="372" aria-hidden="true" class="hidden dark:block max-w-full h-auto" />

## Any path will do

Even a single known path would already be a cross-tenant read. What makes this worse is that the path is not something you have to steal, it is something you can build. This is how one of those paths is built, with a real one underneath the shape:

<img src="/diag-d.svg" alt="Two monospace lines. The top one, labelled shape, reads docs slash userId slash uploadTime underscore 1 dot pdf, with the two placeholders in violet. The lower one, labelled one real path, reads docs slash 1002 slash 1793669694 underscore 1 dot pdf, with the two numbers in red, each underlined and captioned victim's account id and Unix timestamp, and a dashed leader running from each placeholder down to the number that fills it." width="860" height="250" class="dark:hidden max-w-full h-auto" />
<img src="/diag-d-dark.svg" alt="" width="860" height="250" aria-hidden="true" class="hidden dark:block max-w-full h-auto" />

User IDs were incremental integers and a clock reading is not a secret, so there is nothing to steal in advance, only two numbers to walk through. Two requests, both naming paths under 1002, the account in the figure above, show how the server behaves:

- `docs/1002/1793669694_1.pdf`, a path belonging to that other account: the document arrives inside the attacker's account
- `docs/1002/1793669690_1.pdf`, four seconds earlier, where nothing was ever stored: refused, because there is no PDF sitting at that path

That second answer is the one that turns a single known path into a search over all of them, because the API does not reply the same way to a path holding a file and a path holding nothing. From there it is only arithmetic: pick a user id, pick a second, build the path, send it, and read the answer. Run that loop fast enough and it becomes a sweep.

This is one minute of candidate paths for a single account, and the two seconds in it that held a document.

<img src="/diag-c.svg" alt="A horizontal strip of sixty small cells representing one minute of upload seconds for account 1002, with two cells filled in red as live uploads. An arrow runs beneath the strip from right to left, labelled to show that the search walks backwards one second at a time, from newest taken from the server clock towards older." width="860" height="268" class="dark:hidden max-w-full h-auto" />
<img src="/diag-c-dark.svg" alt="" width="860" height="268" aria-hidden="true" class="hidden dark:block max-w-full h-auto" />

I let the AI build a Python script to do the recovery sweep, and I only had to enter the victim's user id and the attacker's session cookie. It asks the site what time it is and then works backwards one second at a time, trying the path an upload would have had, a few dozen every second, until one of them lands and I have somebody else's document in my list. I only ran it against my own accounts, but that pattern is the same for every file any customer has ever uploaded.

## Final Thoughts

Keep the presigned upload response rather than scrolling past it, because it is the only point in the flow where the API states which path it expects that account to own. **So whenever a later request carries its own path, swap that path for somebody else's and see what happens.**

Happy hacking.

## References

- ivision Research, Signed, Sealed, Delivered... Secure? (Pre-)Signed AWS URL Hacks. https://research.ivision.com/signed-sealed-delivered-secure.html
