export interface ExtractionMeta {
  extractedAt: string;
  sourceCommit: string;
  sourceRepo: string;
  scriptVersion: string;
  itemCounts: Record<string, number>;
}
