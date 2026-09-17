// Single source of truth for site identity, copy and links.

const bio = {
  name: "Manuel Valdez",
  handle: "saurinn",
  role: "Ethical hacker and bug bounty hunter, who happens to be an electronics engineer. I am fascinated about finding security vulnerabilities.",
  intro:
    "My name is Manuel Valdez, I go by saurinn/saur1n on the platforms I work with. Most of my time goes into web and API security research, and the posts here are the writeups that came out of it.",
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
