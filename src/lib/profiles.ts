import { GLOBAL } from "./variables";

export type ProfileBrand =
  | "intigriti"
  | "hackerone"
  | "github"
  | "x"
  | "linkedin";

export interface Profile {
  brand: ProfileBrand;
  /** Visible link label. */
  name: string;
  url: string;
  handle: string;
}

// Ordering is deliberate: bounty platforms lead because they are the proof of
// work. URLs and handles stay in GLOBAL.links so copy has one home.
export const PROFILES: Profile[] = [
  { brand: "intigriti", name: "Intigriti", ...GLOBAL.links.intigriti },
  { brand: "hackerone", name: "HackerOne", ...GLOBAL.links.hackerone },
  { brand: "github", name: "GitHub", ...GLOBAL.links.github },
  { brand: "x", name: "X", ...GLOBAL.links.x },
  { brand: "linkedin", name: "LinkedIn", ...GLOBAL.links.linkedin },
];
