import { computeDiff } from '@/data/diff-engine';
import type { BranchData } from '@/types/branch';
import type { DiffResult } from '@/types/diff';

/**
 * Computes a diff between two branch snapshots.
 * Wraps computeDiff from the data layer with a stable service interface.
 */
export function getDiff(activeData: BranchData, comparisonData: BranchData): DiffResult {
  return computeDiff(activeData, comparisonData);
}
