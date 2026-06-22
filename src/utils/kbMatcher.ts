import { MedicalDoc, medicalKB } from "../data/medical_kb";

/**
 * Normalizes Arabic text by removing tatweel and diacritics,
 * and unifying similar-looking letters to improve search accuracy of medical tags.
 */
export function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u0652]/g, "") // Remove harakat (diacritics)
    .replace(/ـ/g, "") // Remove tatweel
    .replace(/[أإآ]/g, "ا") // Unify alef
    .replace(/ة/g, "ه") // Unify teh marbuta with heh
    .replace(/ى/g, "ي") // Unify alef maksura with yeh
    .toLowerCase();
}

export interface MatchResult {
  doc: MedicalDoc;
  score: number;
}

/**
 * Matches a query against the GALE Medical Encyclopedia knowledge base.
 * Combines token overlap, normalized Arabic search, and exact tag overlaps.
 */
export function matchMedicalKB(query: string): MatchResult[] {
  const normalizedQuery = normalizeArabic(query.toLowerCase());
  const queryTokens = normalizedQuery.split(/\s+/).filter(t => t.length > 1);

  if (queryTokens.length === 0) {
    return [];
  }

  const results: MatchResult[] = medicalKB.map(doc => {
    let score = 0;

    // 1. Direct tag matches (highest weight)
    const normalizedTags = doc.tags.map(t => normalizeArabic(t.toLowerCase()));
    let tagMatches = 0;
    for (const token of queryTokens) {
      if (normalizedTags.some(tag => tag === token || tag.includes(token) || token.includes(tag))) {
        tagMatches++;
      }
    }
    score += (tagMatches / queryTokens.length) * 0.6;

    // 2. Title matches
    const normalizedTitleAr = normalizeArabic(doc.titleAr.toLowerCase());
    const normalizedTitleEn = doc.titleEn.toLowerCase();
    
    let titleArMatches = 0;
    for (const token of queryTokens) {
      if (normalizedTitleAr.includes(token)) {
        titleArMatches++;
      }
    }
    score += (titleArMatches / queryTokens.length) * 0.3;

    let titleEnMatches = 0;
    for (const token of queryTokens) {
      if (normalizedTitleEn.includes(token)) {
        titleEnMatches++;
      }
    }
    score += (titleEnMatches / queryTokens.length) * 0.3;

    // 3. Content boundary matches (Definition + Symptoms)
    const normalizedContent = normalizeArabic((doc.definition + " " + doc.symptoms + " " + doc.description).toLowerCase());
    let contentMatches = 0;
    for (const token of queryTokens) {
      if (normalizedContent.includes(token)) {
        contentMatches++;
      }
    }
    score += (contentMatches / queryTokens.length) * 0.2;

    // Limit maximum score contribution to a realistic scale
    return {
      doc,
      score: Math.min(score, 1.0)
    };
  });

  // Sort descending and filter those with score > 0.08 of significance
  return results
    .filter(r => r.score >= 0.08)
    .sort((a, b) => b.score - a.score);
}
