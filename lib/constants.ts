// Shared constants — safe to import from client or server components.

export const CANDIDATE_TYPES = [
  { value: "urn:entity:brand", label: "Brands" },
  { value: "urn:entity:videogame", label: "Video Games" },
  { value: "urn:entity:tv_show", label: "TV Shows" },
  { value: "urn:entity:podcast", label: "Podcasts" },
  { value: "urn:entity:artist", label: "Music Artists" },
  { value: "urn:entity:movie", label: "Movies" },
  { value: "urn:entity:book", label: "Books" },
] as const;

export type CandidateType = (typeof CANDIDATE_TYPES)[number]["value"];

export const DEFAULT_CANDIDATE_TYPES: CandidateType[] = [
  "urn:entity:brand",
  "urn:entity:videogame",
  "urn:entity:tv_show",
  "urn:entity:podcast",
];

export const AGE_RANGES = [
  { value: "", label: "No age skew" },
  { value: "35_and_younger", label: "Under 36 (Gen Z / younger Millennial — Discord's core base)" },
  { value: "36_to_55", label: "36–55" },
  { value: "55_and_older", label: "55+" },
] as const;

export const DEFAULT_ANCHOR = "Discord";
export const DEFAULT_LOCATION = "Charlotte, NC";
export const DEFAULT_AGE_RANGE = "35_and_younger";
export const DEFAULT_TAKE = 10;
