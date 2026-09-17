// Single source of truth for site identity, copy and links.

const bio = {
  name: "Manuel Valdez",
  handle: "saurinn",
  // Second sentence deliberately avoids "passionate".
  tagline: "Ethical hacker and bug bounty hunter, and by training an electronics engineer.",
  summary:
    "Ethical hacker and bug bounty hunter, and by training an electronics engineer. I am relentless about finding security vulnerabilities, and I write up what I find.",
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

  articlesName: "Writing",
  profileImage: "empty.png",
};

export type GlobalConfig = typeof GLOBAL;
