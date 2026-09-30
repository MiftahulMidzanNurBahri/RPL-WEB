import type { Item } from "@prisma/client";

const stopWords = new Set([
  "dan", "yang", "untuk", "dari", "pada", "dengan", "ini", "itu", "saya", "barang",
  "item", "the", "and", "for", "with", "found", "lost"
]);

type MatchableItem = Pick<Item, "title" | "description" | "category" | "location">;

function tokens(item: Pick<MatchableItem, "title" | "description">): Set<string> {
  const words = `${item.title} ${item.description}`.toLocaleLowerCase("id-ID")
    .match(/[\p{L}\p{N}]{3,}/gu) ?? [];
  return new Set(words.filter((word) => !stopWords.has(word)));
}

export function scoreMatch(source: MatchableItem, candidate: MatchableItem): {
  score: number;
  reasons: string[];
} {
  let score = 0;
  const reasons: string[] = [];

  if (source.category === candidate.category) {
    score += 40;
    reasons.push("Kategori barang sama");
  }

  const sourceWords = tokens(source);
  const candidateWords = tokens(candidate);
  const overlap = [...sourceWords].filter((word) => candidateWords.has(word));
  if (overlap.length > 0) {
    const keywordScore = overlap.length >= 3 ? 40 : 20;
    score += keywordScore;
    reasons.push("Kata kunci barang cocok");
  }

  if (source.location === candidate.location) {
    score += 25;
    reasons.push("Lokasi kampus sama");
  }

  return { score, reasons };
}