export interface ExtractionGap {
  domain: string;
  item: string;
  reason: string;
}

export interface ExtractionMeta {
  extractedAt: string;
  sourceCommit: string;
  sourceRepo: string;
  scriptVersion: string;
  itemCounts: Record<string, number>;
  gaps?: ExtractionGap[];
}
