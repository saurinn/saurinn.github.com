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
    github: "https://github.com/saurinn",
    x: "https://twitter.com/saur1n",
  },

  menu: {
    blog: "/blog/",
    about: "/about/",
  },

  articlesName: "Articles",
  profileImage: "empty.png",
};

export type GlobalConfig = typeof GLOBAL;
