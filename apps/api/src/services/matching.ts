import type { Item } from "@prisma/client";
import { CampusLocations, DropOffPoints } from "../../../../packages/shared/src/index.js";

const stopWords = new Set([
  "dan", "yang", "untuk", "dari", "pada", "dengan", "ini", "itu", "saya", "barang",
  "item", "the", "and", "for", "with", "found", "lost",
  "hilang", "ditemukan", "tertinggal", "temuan", "laporan", "lokasi", "area", "dekat",
  "ruang", "meja", "baca", "kampus", "gedung", "lantai", "perpustakaan", "pradita",
  "warna", "berwarna", "dalam", "berisi", "hitam", "putih", "merah", "biru", "hijau", "perak", "silver"
]);

type MatchableItem = Pick<Item, "title" | "description" | "category" | "location">;

function words(text: string): string[] {
  return text.normalize("NFKC").toLocaleLowerCase("id-ID").match(/[\p{L}\p{N}]+/gu) ?? [];
}

function tokens(text: string, locationPhrases: string[][]): Set<string> {
  const parts = words(text);
  const contextIndexes = new Set<number>();
  for (const phrase of locationPhrases) {
    for (let start = 0; start <= parts.length - phrase.length; start += 1) {
      if (phrase.every((word, index) => parts[start + index] === word)) {
        phrase.forEach((_word, index) => contextIndexes.add(start + index));
      }
    }
  }
  return new Set(parts.filter((word, index) =>
    !contextIndexes.has(index) && [...word].length >= 3 && !stopWords.has(word)
  ));
}

function normalizeLocation(location: string | null): string {
  return location?.normalize("NFKC")
    .toLocaleLowerCase("id-ID")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/gu, " ") ?? "";
}

export function scoreMatch(source: MatchableItem, candidate: MatchableItem): {
  score: number;
  reasons: string[];
  hasIdentityEvidence: boolean;
} {
  let score = 0;
  const reasons: string[] = [];

  if (source.category && source.category === candidate.category) {
    score += 40;
    reasons.push("Kategori barang sama");
  }

  const locationPhrases = [...CampusLocations, ...DropOffPoints, source.location ?? "", candidate.location ?? ""]
    .map(words).filter((phrase) => phrase.length >= 2);
  const sourceTitle = tokens(source.title, locationPhrases);
  const candidateTitle = tokens(candidate.title, locationPhrases);
  const sourceWords = new Set([...sourceTitle, ...tokens(source.description, locationPhrases)]);
  const candidateWords = new Set([...candidateTitle, ...tokens(candidate.description, locationPhrases)]);
  const overlap = [...sourceWords].filter((word) => candidateWords.has(word));
  const hasIdentityEvidence = overlap.some((word) => sourceTitle.has(word) || candidateTitle.has(word));
  if (overlap.length > 0) {
    const keywordScore = overlap.length >= 3 ? 40 : 20;
    score += keywordScore;
    reasons.push("Kata kunci barang cocok");
  }

  const sourceLocation = normalizeLocation(source.location);
  if (sourceLocation && sourceLocation === normalizeLocation(candidate.location)) {
    score += 25;
    reasons.push("Lokasi kampus sama");
  }

  return { score, reasons, hasIdentityEvidence };
}
