'use client';

import { useState, useEffect } from 'react';
import type { Journey, JourneyNode } from '@/types/journey';
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
import { usePlayMode } from '@/features/journeys/journey-play/use-play-mode';
import { PlayButton } from '@/features/journeys/journey-play/play-button';
import { PlayBar } from '@/features/journeys/journey-play/play-bar';
import { Minimap } from '@/features/canvas/components/minimap';

interface JourneyCanvasProps {
  journey: Journey;
  visibleLayers: Set<string>;
  visibleStatuses: Set<string>;
}

export function JourneyCanvas({ journey, visibleLayers, visibleStatuses }: JourneyCanvasProps) {
  const { selectedItem, setSelectedItem, clearSelection } = useDocsContext();
  const { chosenPath, choosePath, resetPath, litNodes, litEdges, hasPath } = usePathTrace(journey.nodes, journey.edges);
  const viewBox = useViewport(journey.nodes);
  const play = usePlayMode(journey.nodes, journey.edges);

  const entered = useStaggerEntry(
    journey.nodes.map((n) => ({ id: n.id, x: n.x }))
  );

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

  const nodeMap = new Map(journey.nodes.map((n) => [n.id, n]));

  const handleNodeClick = (node: JourneyNode) => {
    if (play.isActive) {
      play.advanceTo(node.id);
    }
    if (node.type === 'step') {
      setSelectedItem({ type: 'step', node, journey });
    }
  };

  const handleDecisionChoose = (decisionId: string, opt: string, targetId: string) => {
    if (play.isActive) {
      play.chooseOption(decisionId, opt, targetId);
    } else {
      choosePath(decisionId, opt, targetId);
    }
  };

  const playOverlay = play.isActive ? (
    <PlayBar
      stepCount={play.stepCount}
      atDecision={play.atDecision}
      onUndo={play.undo}
      onStop={play.stop}
    />
  ) : (
    <PlayButton onClick={play.start} />
  );

  return (
    <CanvasProvider
      viewBox={viewBox}
      overlay={playOverlay}
      renderMinimap={(vbs, panTo) => (
        <Minimap
          nodes={journey.nodes}
          bounds={viewBox}
          viewBoxString={vbs}
          onPan={panTo}
        />
      )}
    >
      {/* Edges */}
      {journey.edges.map((edge, i) => {
        const fromNode = nodeMap.get(edge.from);
        const toNode = nodeMap.get(edge.to);
        if (!fromNode || !toNode) return null;
        if (!isNodeVisible(fromNode) || !isNodeVisible(toNode)) return null;

        const isLit = play.isActive ? play.visitedEdges.has(i) : litEdges.has(i);
        const isDimmed = play.isActive ? !play.visitedEdges.has(i) : hasPath && !isLit;

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
            />
            <AnimatedEdge
              from={fromNode}
              to={toNode}
              isLit={isLit}
              isDimmed={isDimmed}
              hasActivePath={play.isActive || hasPath}
            />
          </g>
        );
      })}

      {/* Nodes */}
      {journey.nodes.map((node) => {
        if (!isNodeVisible(node)) return null;
        const isLit = play.isActive ? play.visitedNodes.has(node.id) : litNodes.has(node.id);
        const isDimmed = play.isActive ? !play.visitedNodes.has(node.id) && !play.reachableNodes.has(node.id) : hasPath && !isLit;
        const isReachable = play.isActive && play.reachableNodes.has(node.id);
        const isCurrent = play.currentNodeId === node.id;
        const isSelected =
          (selectedItem?.type === 'step' && selectedItem.node.id === node.id) || isCurrent;

        const nodeEntered = entered.has(node.id);

        if (node.type === 'entry') {
          return (
            <g
              key={node.id}
              style={{
                opacity: nodeEntered ? 1 : 0,
                transform: nodeEntered ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 300ms ease-out, transform 300ms ease-out',
              }}
            >
              <EntryNode
                x={node.x}
                y={node.y}
                label={node.label}
                isDimmed={isDimmed}
                onClick={() => handleNodeClick(node)}
              />
            </g>
          );
        }

        if (node.type === 'decision') {
          const chosenOpt = play.isActive
            ? undefined
            : chosenPath.find((c) => c.decId === node.id)?.opt;

          return (
            <g
              key={node.id}
              style={{
                opacity: nodeEntered ? 1 : 0,
                transform: nodeEntered ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 300ms ease-out, transform 300ms ease-out',
              }}
            >
              <DecisionNode
                x={node.x}
                y={node.y}
                label={node.label}
                options={node.options ?? []}
                chosenOpt={chosenOpt}
                isDimmed={isDimmed}
                onChoose={(opt, targetId) => handleDecisionChoose(node.id, opt, targetId)}
              />
            </g>
          );
        }

        return (
          <g
            key={node.id}
            style={{
              opacity: nodeEntered ? (isReachable ? 0.7 : 1) : 0,
              transform: nodeEntered ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 300ms ease-out, transform 300ms ease-out',
              cursor: isReachable ? 'pointer' : undefined,
            }}
          >
            <NodeTooltip node={node}>
              <StepNode
                node={node}
                isSelected={isSelected}
                isDimmed={isDimmed}
                onClick={() => handleNodeClick(node)}
              />
            </NodeTooltip>
            {/* Reachable pulse ring */}
            {isReachable && (
              <circle
                cx={node.x + 80}
                cy={node.y + 22}
                r={50}
                fill="none"
                stroke="rgba(61,140,117,0.3)"
                strokeWidth={1.5}
                style={{ animation: 'glowPulse 2s ease-in-out infinite' }}
              />
            )}
          </g>
        );
      })}

      {/* Path bar */}
      {hasPath && !play.isActive && (
        <g>
          <foreignObject x={viewBox.minX + viewBox.width - 200} y={viewBox.minY + 10} width={190} height={30}>
            <button
              onClick={resetPath}
              style={{
                background: 'rgba(15,19,25,0.9)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: '6px',
                color: '#9a9790',
                fontSize: '10px',
                padding: '6px 12px',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Clear path trace
            </button>
          </foreignObject>
        </g>
      )}
    </CanvasProvider>
  );
}
