export type RAGHookSettings = {
  minSimilarityScore: number;
  maxK: number;
  kIncrement: number;
};

export type SplitterSettings = {
  chunkSize: number;
  chunkOverlap: number;
};
