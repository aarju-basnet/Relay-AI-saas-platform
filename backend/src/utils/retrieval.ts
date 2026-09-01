interface ScoredChunk {
  content: string;
  score: number;
}

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "do", "does", "did",
  "what", "when", "where", "how", "why", "can", "could", "will", "would",
  "i", "you", "we", "they", "it", "to", "of", "in", "on", "for", "and",
  "or", "with", "at", "by", "your", "my",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

export function findRelevantChunks(
  question: string,
  chunks: { content: string }[],
  topK = 4
): string[] {
  const questionWords = tokenize(question);
  if (questionWords.length === 0) return [];

  const scored: ScoredChunk[] = chunks.map((chunk) => {
    const chunkWordSet = new Set(tokenize(chunk.content));
    let score = 0;
    for (const word of questionWords) {
      if (chunkWordSet.has(word)) score += 1;
    }
    return { content: chunk.content, score };
  });

  return scored
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((c) => c.content);
}