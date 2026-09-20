---
title: "test2shells - A valid URL with a Command in its Shadow"
description: "A connectivity test panel in a bug bounty program took an SSH host, shrugged off thirty minutes of SSRF testing, and never expected a semicolon."
tags: ["command-injection", "ssrf", "php", "bug-bounty"]
time: 6
featured: false
timestamp: 2026-09-17T18:00:00+00:00
---

## Summary

I found two OS command injections in a bug bounty program in two different features of a platform that provisions cloud servers for its customers. Both took an SSH host and passed it to `curl` inside a shell rather than making the connection themselves, and one of them ran the resulting command as root.

## The SSH host field, and the thirty minutes that went nowhere

A panel that tests credentials against a host someone typed in is a good place to look, because the natural way to build it is to invoke a binary rather than speak the protocol yourself. I put my collaborator server in the **SSH host** field, which is where the injection turned out to be, watched the request land, and went straight for SSRF.

For half an hour that meant the usual list: decimal, octal and IPv6 encodings of loopback, `0.0.0.0`, the link-local metadata endpoint, redirects away from an allowed host, alternate schemes. Every one of them was refused. The anti-SSRF filtering was genuinely hardened and I was wasting time on a dead end.

## The header that changed the question

My collaborator had logged the incoming request, and the User-Agent said `curl/7.x.x`. I saw it, filed it away as noise, and moved on, which is the part worth writing down. Five minutes later it hit me: a Laravel application checking reachability on its own would present a framework client, not the curl binary. Whatever was behind that panel was shelling out to `curl`, and it was very likely doing it with my host value pasted straight into the command line.

If that was true, I had been testing the wrong vulnerability class entirely. The interesting question was not "can this reach an internal host", it was "what else runs after my value ends".

The target runs PHP, so I assumed the code behind it was something along these lines:

```php
<?php
  // some code
  $output = shell_exec("curl -I $input");
  echo "<pre>$output</pre>";
?>
```

Whether that idea was exploitable came down to validation, and the two entry points that took that field validated it differently. One of them let a bare semicolon through, which is where I started.

## Bug 1: root, and a trailing semicolon

The connectivity test panel validated the host loosely enough that a bare semicolon survived it, which is why this one turned out to be the easier of the two to prove. A command line is only a string until the shell splits it. If my input is interpolated unquoted, a metacharacter ends the first command and starts a second one. My first working proof was:

```bash
http://example.com;id
```

Except it didn't work at first. The application was clearly passing more arguments after the URL, and everything following my injected command became *its* arguments, so `id` received flags it didn't understand and printed nothing useful. The fix was one more character, placed to close my command before the rest of the template could attach to it:

```bash
http://example.com;id;
```

The output pane came back with:

```text
200uid=0(root) gid=0(root) groups=0(root)
```

The process behind that panel ran as root, so anything placed after my semicolon inherited uid=0. The only thing standing between that and a worse outcome was the filter on spaces: the parser rejected them inside the injected portion, so reading a file meant using the field separator variable as the whitespace character instead:

```bash
http://example.com;cat$IFS/etc/passwd;
```

```text
200root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
...
```

## Bug 2: the same shell, behind a URL parser

The file configuration download feature was a bit tighter. It rejected semicolons outright, and this is where the interesting part lives.

I sent `https://example.com;id` into that host field and the application told me the URL wasn't valid. Worth noting: the check happened on the backend too, not only in the browser, so editing the value client side wasn't going to help. Whatever was validating my input was the same layer that decided whether to run the command, and a parser stood between me and the shell.

A validator that "checks the URL is well formed" only describes the characters it recognizes as structure. RFC 3986 section 3.2 defines the authority component as running until the next `/`, `?` or `#`. Everything after that is the query or the fragment, and both are allowed to carry punctuation a shell considers syntax. I remembered Orange Tsai's "A New Era of SSRF" talk making exactly this point about parsers disagreeing with one another.

<img src="/url-parsers-rfc3986.jpg" alt="Slide listing cURL, PHP and Python as affected by URL parser differences, quoting RFC 3986 section 3.2 on where the authority component terminates." width="1114" height="566" />

<img src="/url-parsers-authority.jpg" alt="Slide diagramming http://google.com#@evil.com/, where PHP parse_url reports google.com as the host but readfile sends the request to evil.com." width="1134" height="576" />

So I tried the two characters that end the authority in a parser's eyes and remain ordinary text in a shell's:

```bash
https://example.com?;id
https://example.com#;id
```

Both of them passed the validation and were executed.

The output pane gave:

```text
HTTP - 200uid=1111(REDACTED) gid=1111(REDACTED) groups=1111(REDACTED)
```

That was the service user, not root, and the container belonged to a single customer, so the damage stopped at that boundary. It was still code execution on their infrastructure, and the container was the only thing holding it back.

## Disclosure

Both reports went through Intigriti and the program handled them very quickly: triaged, reproduced and fixed within two days. The first was graded Exceptional and paid the maximum bounty the program offers.

<img src="/bounty-root.jpg" alt="Intigriti notification awarding $10,000 for the report, with the program name redacted." width="519" height="94" />

The second came back at $2,000, plus a $1,000 company bonus.

<img src="/bounty-container.jpg" alt="Two Intigriti notifications for the second report: a $2,000 bounty and a $1,000 company bonus, with the program name redacted." width="434" height="141" />

The severity gap tracked the sandbox each command landed in, root versus a per-user container, which is the right read even though both were technically remote code execution.

## Takeaways

The exploits were trivial because the identification was the whole bug. Thirty minutes of SSRF testing taught me nothing about the implementation; one header I almost ignored taught me everything. When a feature refuses to behave like the vulnerability you came looking for, stop testing that class and go find out what the code actually does.

Happy hacking.

## References

- Tsai, Orange. "A New Era of SSRF." Black Hat Asia, 2020.
- RFC 3986 section 3.2, Hierarchy Components. https://datatracker.ietf.org/doc/html/rfc3986#section-3.2
- OWASP Web Security Testing Guide, Testing for OS Command Injection. https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/12-Testing_for_Command_Injection
- PHP manual, shell_exec. https://www.php.net/manual/en/function.shell-exec.php
