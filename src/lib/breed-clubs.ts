import clubsData from "@/data/associazioni-specializzate.json";

export interface BreedClub {
  name: string;
  shortName: string;
  website: string | null;
  logo: string | null;
  enciSlug: string | null;
  breeds: { fciNumber: number; name: string }[];
}

const clubs = clubsData as BreedClub[];

// Index: fciNumber → clubs
const fciToClubs = new Map<number, BreedClub[]>();
for (const club of clubs) {
  for (const breed of club.breeds) {
    const list = fciToClubs.get(breed.fciNumber) ?? [];
    list.push(club);
    fciToClubs.set(breed.fciNumber, list);
  }
}

// Index: enciSlug → club
const slugToClub = new Map<string, BreedClub>();
for (const club of clubs) {
  if (club.enciSlug) slugToClub.set(club.enciSlug, club);
}

/** Get all clubs that cover a breed by its FCI ID */
export function getClubsForFciId(fciId: number): BreedClub[] {
  return fciToClubs.get(fciId) ?? [];
}

/** Look up a club by its ENCI slug */
export function getClubBySlug(slug: string): BreedClub | null {
  return slugToClub.get(slug) ?? null;
}

/** Get all 72 breed clubs */
export function getAllClubs(): BreedClub[] {
  return clubs;
}
