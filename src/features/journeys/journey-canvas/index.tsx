'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Journey, JourneyNode, StepLayer, StepStatus } from '@/types/journey';
import { PERSONA_CONFIG } from '@/types/journey';
import type { DiffStatus } from '@/types/diff';
import { useDocsContext } from '@/providers/docs-provider';
import { CanvasProvider } from '@/features/canvas/canvas-provider';
import { useViewport } from '@/features/canvas/hooks/use-viewport';
import { usePathTrace } from '@/features/canvas/hooks/use-path-trace';
import { useStaggerEntry } from '@/features/canvas/hooks/use-stagger-entry';
import { useKeyboardNav } from '@/features/canvas/hooks/use-keyboard-nav';
import { StepNode } from '@/features/canvas/components/step-node';
import { EntryNode } from '@/features/canvas/components/entry-node';
import { DecisionNode } from '@/features/canvas/components/decision-node';
import { Edge } from '@/features/canvas/components/edge';
import { AnimatedEdge } from '@/features/canvas/components/animated-edge';
import { NodeTooltip } from '@/features/canvas/components/node-tooltip';
import { Minimap } from '@/features/canvas/components/minimap';
import { CanvasToolbar } from '@/features/canvas/components/canvas-toolbar';
import { Legend } from '@/features/canvas/components/legend';
import { CanvasEmptyState } from '@/features/canvas/components/canvas-empty-state';
import { detectJourneyBackEdges } from '@/data/index';
import { useDiffMode } from '@/hooks/use-diff-mode';
import { useDiffNodes } from '@/features/canvas/hooks/use-diff-nodes';

interface JourneyCanvasProps {
  journey: Journey;
  visibleLayers: Set<string>;
  visibleStatuses: Set<string>;
  onToggleLayer: (layer: StepLayer) => void;
  onToggleStatus: (status: StepStatus) => void;
  onResetFilters?: () => void;
  filtersAreDirty?: boolean;
}

export function JourneyCanvas({
  journey,
  visibleLayers,
  visibleStatuses,
  onToggleLayer,
  onToggleStatus,
  onResetFilters,
  filtersAreDirty,
}: JourneyCanvasProps) {
  const { selectedItem, setSelectedItem, clearSelection } = useDocsContext();
  const {
    chosenPath,
    choosePath,
    startFromEntry,
    activeEntryId,
    resetPath,
    litNodes,
    litEdges,
    hasPath,
  } = usePathTrace(journey.nodes, journey.edges);
  // Diff mode integration
  const { isActive: isDiffMode, diffResult } = useDiffMode();
  const baseJourney =
    isDiffMode && diffResult
      ? (diffResult.journeys.modified.find((m) => m.base.slug === journey.slug)?.base ?? null)
      : null;

  const getNodeKey = useCallback((n: JourneyNode) => n.id, []);
  const { statusMap: nodeStatusMap, ghostNodes } = useDiffNodes(
    journey.nodes,
    baseJourney?.nodes ?? null,
    getNodeKey,
  );

  const allNodes = [...journey.nodes, ...ghostNodes];
  const viewBox = useViewport(allNodes);

  const [minimapVisible, setMinimapVisible] = useState(true);
  const [legendVisible, setLegendVisible] = useState(false);
  const [pinnedNodes, setPinnedNodes] = useState<Set<string>>(new Set());

  const entered = useStaggerEntry(journey.nodes.map((n) => ({ id: n.id, x: n.x })));

  const [edgesVisible, setEdgesVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setEdgesVisible(true), 150);
    return () => clearTimeout(t);
  }, []);

  useKeyboardNav({
    nodes: journey.nodes,
    edges: journey.edges,
    selectedId: selectedItem?.type === 'step' ? selectedItem.node.id : null,
    onSelect: (node) => setSelectedItem({ type: 'step', node, journey }),
    onClear: clearSelection,
  });

  const isNodeVisible = (node: JourneyNode) => {
    if (node.type === 'entry' || node.type === 'decision') return true;
    if (node.layer && !visibleLayers.has(node.layer)) return false;
    if (node.status && !visibleStatuses.has(node.status)) return false;
    return true;
  };

  const hasVisibleNodes = journey.nodes.some(isNodeVisible);

  const nodeMap = new Map(allNodes.map((n) => [n.id, n]));

  // Detect back-edges and decision branch edges for visual treatment
  const backEdges = detectJourneyBackEdges(journey.nodes, journey.edges);

  // Build set of decision option target IDs for identifying decision branches
  const decisionBranchTargets = new Map<string, Set<string>>();
  for (const node of journey.nodes) {
    if (node.type === 'decision' && node.options) {
      const targets = new Set<string>();
      // Skip first option (happy path exits right, not bottom)
      for (let i = 1; i < node.options.length; i++) {
        targets.add(node.options[i].to);
      }
      decisionBranchTargets.set(node.id, targets);
    }
  }

  const getEdgeDiffStatus = (fromId: string, toId: string): DiffStatus | null => {
    if (!isDiffMode || nodeStatusMap.size === 0) return null;
    const fromStatus = nodeStatusMap.get(fromId);
    const toStatus = nodeStatusMap.get(toId);
    if (fromStatus === 'removed' || toStatus === 'removed') return 'removed';
    if (fromStatus === 'added' || toStatus === 'added') return 'added';
    if (fromStatus === 'modified' || toStatus === 'modified') return 'modified';
    return 'unchanged';
  };

  const handleNodeClick = (node: JourneyNode) => {
    if (node.type === 'step') {
      setPinnedNodes((prev) => {
        const next = new Set(prev);
        if (next.has(node.id)) {
          next.delete(node.id);
        } else {
          next.add(node.id);
        }
        return next;
      });
    }
  };

  const handleDecisionChoose = (decisionId: string, opt: string, targetId: string) => {
    choosePath(decisionId, opt, targetId);
  };

  return (
    <CanvasProvider
      viewBox={viewBox}
      viewKey={`journey-${journey.slug}`}
      overlay={!hasVisibleNodes ? <CanvasEmptyState /> : undefined}
      renderMinimap={(vbs, panTo) => (
        <Minimap
          nodes={journey.nodes}
          bounds={viewBox}
          viewBoxString={vbs}
          onPan={panTo}
          visible={minimapVisible}
        />
      )}
      legend={<Legend visible={legendVisible} isDiffMode={isDiffMode} />}
      renderToolbar={(zoomControls) => (
        <CanvasToolbar
          zoomControls={zoomControls}
          minimapVisible={minimapVisible}
          onToggleMinimap={() => setMinimapVisible((p) => !p)}
          legendVisible={legendVisible}
          onToggleLegend={() => setLegendVisible((p) => !p)}
          filterControls={{
            visibleLayers,
            visibleStatuses,
            onToggleLayer,
            onToggleStatus,
          }}
          pathControls={{ hasPath, resetPath }}
          resetControls={{
            isDirty: hasPath || (filtersAreDirty ?? false),
            onReset: () => {
              resetPath();
              setPinnedNodes(new Set());
              onResetFilters?.();
            },
          }}
        />
      )}
    >
      {/* Edges */}
      {journey.edges.map((edge, i) => {
        const fromNode = nodeMap.get(edge.from);
        const toNode = nodeMap.get(edge.to);
        if (!fromNode || !toNode) return null;
        if (!isNodeVisible(fromNode) || !isNodeVisible(toNode)) return null;

        const isLit = litEdges.has(i);
        const isDimmed = !isDiffMode && hasPath && !isLit;
        const isBackEdge = backEdges.has(i);
        const isDecisionBranch = decisionBranchTargets.get(edge.from)?.has(edge.to) ?? false;
        const edgeDiffStatus = getEdgeDiffStatus(edge.from, edge.to);

        return (
          <g
            key={`${edge.from}-${edge.to}-${edge.opt ?? ''}`}
            style={{ opacity: edgesVisible ? 1 : 0, transition: 'opacity 400ms ease-out' }}
          >
            <Edge
              from={fromNode}
              to={toNode}
              isDecision={!!edge.opt}
              isLit={isLit}
              isDimmed={isDimmed}
              isBackEdge={isBackEdge}
              isDecisionBranch={isDecisionBranch}
              diffStatus={edgeDiffStatus}
              useJourneyPorts
            />
            <AnimatedEdge
              from={fromNode}
              to={toNode}
              isLit={isLit}
              isDimmed={isDimmed}
              hasActivePath={hasPath}
              isBackEdge={isBackEdge}
              isDecisionBranch={isDecisionBranch}
              diffStatus={edgeDiffStatus}
              useJourneyPorts
            />
          </g>
        );
      })}

      {/* Nodes */}
      {journey.nodes.map((node) => {
        if (!isNodeVisible(node)) return null;
        const isLit = litNodes.has(node.id);
        const isDimmed = !isDiffMode && hasPath && !isLit;
        const isSelected = !isDiffMode && pinnedNodes.has(node.id);

        const nodeDiffStatus = isDiffMode ? (nodeStatusMap.get(node.id) ?? null) : null;
        const isChangedNode = nodeDiffStatus === 'added' || nodeDiffStatus === 'modified';

        const nodeEntered = entered.has(node.id);

        if (node.type === 'entry') {
          return (
            <g
              key={node.id}
              style={{
                opacity: nodeEntered ? 1 : 0,
                transform: nodeEntered ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 300ms ease-out, transform 300ms ease-out',
                pointerEvents: isDiffMode && !isChangedNode ? 'none' : undefined,
              }}
            >
              <EntryNode
                x={node.x}
                y={node.y}
                label={node.label}
                isDimmed={isDimmed}
                isActive={activeEntryId === node.id}
                diffStatus={nodeDiffStatus}
                meta={{
                  description: journey.description,
                  persona: PERSONA_CONFIG[journey.persona]?.label,
                  personaColor: PERSONA_CONFIG[journey.persona]?.color,
                  stepCount: journey.nodes.filter((n) => n.type === 'step').length,
                  decisionCount: journey.nodes.filter((n) => n.type === 'decision').length,
                  errorCount: journey.nodes.reduce(
                    (sum, n) => sum + (n.errorCases?.length ?? 0),
                    0,
                  ),
                }}
                onClick={isDiffMode ? undefined : () => startFromEntry(node.id)}
              />
            </g>
          );
        }

        if (node.type === 'decision') {
          const chosenOpt = chosenPath.find((c) => c.decId === node.id)?.opt;

          return (
            <g
              key={node.id}
              style={{
                opacity: nodeEntered ? 1 : 0,
                transform: nodeEntered ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 300ms ease-out, transform 300ms ease-out',
                pointerEvents: isDiffMode && !isChangedNode ? 'none' : undefined,
              }}
            >
              <DecisionNode
                x={node.x}
                y={node.y}
                label={node.label}
                options={node.options ?? []}
                chosenOpt={chosenOpt}
                isDimmed={isDimmed}
                diffStatus={nodeDiffStatus}
                onChoose={
                  isDiffMode
                    ? undefined
                    : (opt, targetId) => handleDecisionChoose(node.id, opt, targetId)
                }
              />
            </g>
          );
        }

        // In diff mode: only changed nodes get hover tooltips
        const suppressTooltip = isDiffMode ? !isChangedNode : isDimmed;

        return (
          <g
            key={node.id}
            style={{
              opacity: nodeEntered ? 1 : 0,
              transform: nodeEntered ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 300ms ease-out, transform 300ms ease-out',
              pointerEvents: isDiffMode && !isChangedNode ? 'none' : undefined,
            }}
          >
            <NodeTooltip node={node} suppressTooltip={suppressTooltip} isSelected={isSelected}>
              <StepNode
                node={node}
                isSelected={isSelected}
                isDimmed={isDimmed}
                diffStatus={nodeDiffStatus}
                onClick={isDiffMode ? undefined : () => handleNodeClick(node)}
              />
            </NodeTooltip>
          </g>
        );
      })}

      {/* Ghost nodes — removed nodes from base branch */}
      {isDiffMode &&
        ghostNodes.map((node) => {
          if (node.type === 'entry') {
            return (
              <g key={`ghost-${node.id}`}>
                <EntryNode x={node.x} y={node.y} label={node.label} diffStatus="removed" />
              </g>
            );
          }
          if (node.type === 'decision') {
            return (
              <g key={`ghost-${node.id}`}>
                <DecisionNode
                  x={node.x}
                  y={node.y}
                  label={node.label}
                  options={node.options ?? []}
                  diffStatus="removed"
                />
              </g>
            );
          }
          return (
            <g key={`ghost-${node.id}`}>
              <StepNode node={node} diffStatus="removed" />
            </g>
          );
        })}
    </CanvasProvider>
  );
}
