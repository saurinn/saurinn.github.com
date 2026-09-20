// Single source of truth for site identity, copy and links.

const bio = {
  name: "Manuel Valdez",
  handle: "saurinn",
  role: "Electronics Engineer turned ethical hacker and bug bounty hunter. Fascinated by finding security vulnerabilities.",
  intro:
    "My name is Manuel Valdez, I go by saurinn/saur1n on the main bug bounty platforms I work with. Most of my time goes into web, mobile and API security research, and the posts here are the writeups that came out of it.",

  // /about owns these two; bio.role stays the short home page line.
  aboutLead:
    "I am Manuel Valdez, an Electronics Engineer turned ethical hacker and bug bounty hunter. I go by saurinn or saur1n on the main bug bounty platforms, and I am fascinated by finding security vulnerabilities.",
  aboutBody:
    "Alongside my own research, I work with companies on penetration testing and application security assessments, mostly web, mobile and API. The posts here are writeups that came out of that work.",
  inquiries:
    "For engagement inquiries, assessment requests, or anything else, email me at the address below and I will get back to you.",
};

export const GLOBAL = {
  siteUrl: "https://saurinn.github.io",
  title: "saurinn",
  description:
    "Web application security research and bug bounty writeups by Manuel Valdez (saurinn), an ethical hacker and electronics engineer.",

  bio,

  links: {
    github: { url: "https://github.com/saurinn", handle: "saurinn" },
    x: { url: "https://twitter.com/saur1n", handle: "@saur1n" },
    email: "valdezgmanuel@gmail.com",
    intigriti: {
      url: "https://app.intigriti.com/profile/saurinn",
      handle: "saurinn",
    },
    hackerone: {
      url: "https://hackerone.com/saur1n?type=user",
      handle: "saur1n",
    },
    linkedin: {
      url: "https://www.linkedin.com/in/mjvaldez/",
      handle: "mjvaldez",
    },
  },

  menu: {
    blog: "/blog/",
    about: "/about/",
  },

  articlesName: "Articles",
  profileImage: "empty.png",
};

export type GlobalConfig = typeof GLOBAL;
