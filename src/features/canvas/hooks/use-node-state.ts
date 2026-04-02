import type React from 'react';
import type { DiffStatus } from '@/types/diff';
import { DIFF_COLORS } from '@/constants/diff';

export interface NodeStateInput {
  diffStatus?: DiffStatus | null;
  isDimmed?: boolean;
  isPlanned?: boolean;
  isHovered?: boolean;
  isSelected?: boolean;
}

export interface NodeStateOutput {
  opacity: number;
  isInteractive: boolean;
  pointerEvents: 'auto' | 'none';
  cursor: 'pointer' | 'default';
  isGhost: boolean;
  isDiffChanged: boolean;
  diffColor: string | undefined;
  containerStyle: React.CSSProperties;
}

export function useNodeState({ diffStatus, isDimmed, isPlanned }: NodeStateInput): NodeStateOutput {
  const isGhost = diffStatus === 'removed';
  const isDiffChanged = diffStatus === 'added' || diffStatus === 'modified';
  const diffColor = diffStatus && diffStatus !== 'unchanged' ? DIFF_COLORS[diffStatus] : undefined;

  const isInteractive = !isGhost && (!diffStatus || isDiffChanged);

  const diffOpacity = isGhost ? 0.35 : diffStatus === 'unchanged' ? 0.2 : 1;
  const opacity = isDimmed ? 0.15 : diffStatus != null ? diffOpacity : isPlanned ? 0.45 : 1;

  const containerStyle: React.CSSProperties = {
    cursor: isInteractive ? 'pointer' : 'default',
    opacity,
    transition: 'opacity 400ms ease-out',
    pointerEvents: isInteractive ? 'auto' : 'none',
  };

  return {
    opacity,
    isInteractive,
    pointerEvents: isInteractive ? 'auto' : 'none',
    cursor: isInteractive ? 'pointer' : 'default',
    isGhost,
    isDiffChanged,
    diffColor,
    containerStyle,
  };
}
