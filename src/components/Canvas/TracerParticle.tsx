/**
 * TracerParticle — Bright tracer particle that follows a request path through the graph
 *
 * Visual Philosophy:
 * A bright white circle with trailing glow that travels along edges and pauses at nodes.
 * Teaches distributed tracing (Jaeger/Zipkin) by showing the journey of a single request
 * through the system, with timing proportional to real latencies.
 *
 * Rendering:
 * - Lead particle: Bright white circle (r=4px) with radial gradient glow
 * - Trail: 3-4 fading ghost particles behind the lead
 * - At node: Brief "processing" pulse animation
 * - Between nodes: Smooth travel along edge path
 *
 * Technical:
 * - SVG rendering inside ReactFlow viewport (scrolls/zooms with canvas)
 * - Uses edge Bezier paths from ReactFlow
 * - Animated via CSS transitions for smooth motion
 */

import { memo, useMemo, useEffect, useState } from 'react';
import { useReactFlow, getBezierPath, Position } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import { cn } from '@/lib/utils';
import type { TracerState } from '@/hooks/useRequestTracer';

interface TracerParticleProps {
  tracer: TracerState;
  nodes: Node[]; // Required for prop passing but unused (we use getNode instead)
  edges: Edge[];
}

function TracerParticleComponent({ tracer, edges }: TracerParticleProps) {
  const { getNode } = useReactFlow();
  const [pulseKey, setPulseKey] = useState(0);

  const { pathNodeIds, currentNodeIndex, progress, phase } = tracer;

  // Current and next nodes
  const currentNodeId = pathNodeIds[currentNodeIndex];
  const nextNodeId = pathNodeIds[currentNodeIndex + 1];

  // Trigger pulse animation when entering processing phase
  useEffect(() => {
    if (phase === 'processing') {
      setPulseKey(prev => prev + 1);
    }
  }, [phase, currentNodeIndex]);

  // Get current node position
  const currentNode = getNode(currentNodeId);

  // Find edge between current and next node (if traveling)
  const currentEdge = useMemo(() => {
    if (phase === 'traveling' && nextNodeId) {
      return edges.find(e => e.source === currentNodeId && e.target === nextNodeId);
    }
    return null;
  }, [phase, currentNodeId, nextNodeId, edges]);

  // Calculate tracer position
  const tracerPosition = useMemo(() => {
    if (phase === 'processing' && currentNode) {
      // At node — center position
      return {
        x: currentNode.position.x + (currentNode.measured?.width ?? 180) / 2,
        y: currentNode.position.y + (currentNode.measured?.height ?? 80) / 2,
      };
    }

    if (phase === 'traveling' && currentEdge && currentNode) {
      const nextNode = getNode(nextNodeId);
      if (!nextNode) return null;

      // Calculate positions along edge path
      const sourceX = currentNode.position.x + (currentNode.measured?.width ?? 180) / 2;
      const sourceY = currentNode.position.y + (currentNode.measured?.height ?? 80) / 2;
      const targetX = nextNode.position.x + (nextNode.measured?.width ?? 180) / 2;
      const targetY = nextNode.position.y + (nextNode.measured?.height ?? 80) / 2;

      // Use Bezier curve interpolation for smooth path following
      const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition: Position.Right,
        targetX,
        targetY,
        targetPosition: Position.Left,
      });

      // Get point along path at current progress
      const point = getPointAtProgress(edgePath, progress);
      return point;
    }

    return null;
  }, [phase, currentNode, currentEdge, nextNodeId, progress, getNode]);

  if (!tracerPosition) {
    return null;
  }

  const { x, y } = tracerPosition;

  // Trail particles: 4 ghost copies behind lead particle
  const trailParticles = [0.75, 0.5, 0.25, 0.1].map((opacity, i) => ({
    opacity,
    scale: 1 - i * 0.15,
    delay: i * 30, // Stagger slightly
  }));

  return (
    <svg
      className="pointer-events-none absolute inset-0 overflow-visible"
      style={{ zIndex: 1000 }}
    >
      <defs>
        {/* Lead particle glow */}
        <radialGradient id="tracer-glow">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 1)" />
          <stop offset="50%" stopColor="rgba(147, 197, 253, 0.8)" />
          <stop offset="100%" stopColor="rgba(147, 197, 253, 0)" />
        </radialGradient>

        {/* Processing pulse animation */}
        <radialGradient id="tracer-pulse">
          <stop offset="0%" stopColor="rgba(96, 165, 250, 1)" />
          <stop offset="100%" stopColor="rgba(96, 165, 250, 0)" />
        </radialGradient>
      </defs>

      {/* Processing pulse (only visible when at node) */}
      {phase === 'processing' && (
        <circle
          key={`pulse-${pulseKey}`}
          cx={x}
          cy={y}
          r={8}
          fill="url(#tracer-pulse)"
          className="animate-ping"
          style={{
            animationDuration: '0.6s',
            animationIterationCount: 'infinite',
          }}
        />
      )}

      {/* Trail particles */}
      {trailParticles.map((trail, i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={3.5 * trail.scale}
          fill="rgba(147, 197, 253, 0.6)"
          opacity={trail.opacity}
          style={{
            transition: 'cx 0.03s linear, cy 0.03s linear',
            filter: 'blur(1px)',
          }}
        />
      ))}

      {/* Lead particle with glow */}
      <circle
        cx={x}
        cy={y}
        r={12}
        fill="url(#tracer-glow)"
        className={cn(
          phase === 'processing' && 'animate-pulse'
        )}
        style={{
          transition: 'cx 0.03s linear, cy 0.03s linear',
        }}
      />

      {/* Core bright particle */}
      <circle
        cx={x}
        cy={y}
        r={4}
        fill="white"
        style={{
          transition: 'cx 0.03s linear, cy 0.03s linear',
          filter: 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.9))',
        }}
      />
    </svg>
  );
}

/**
 * Parse SVG path and get point at given progress (0-1).
 * Uses simple linear interpolation along path commands.
 */
function getPointAtProgress(path: string, progress: number): { x: number; y: number } | null {
  // Parse path commands (simplified — handles M, L, C commands)
  const commands = path.match(/[MLCmlc][^MLCmlc]*/g);
  if (!commands) return null;

  // Extract all points from path
  const points: Array<{ x: number; y: number }> = [];

  for (const cmd of commands) {
    const type = cmd[0];
    const coords = cmd.slice(1).trim().split(/[\s,]+/).map(parseFloat);

    if (type === 'M' || type === 'm') {
      points.push({ x: coords[0], y: coords[1] });
    } else if (type === 'L' || type === 'l') {
      points.push({ x: coords[0], y: coords[1] });
    } else if (type === 'C' || type === 'c') {
      // Cubic Bezier: sample multiple points along curve
      const p0 = points[points.length - 1];
      const p1 = { x: coords[0], y: coords[1] };
      const p2 = { x: coords[2], y: coords[3] };
      const p3 = { x: coords[4], y: coords[5] };

      // Sample 10 points along Bezier curve
      for (let i = 1; i <= 10; i++) {
        const t = i / 10;
        const point = bezierPoint(p0, p1, p2, p3, t);
        points.push(point);
      }
    }
  }

  if (points.length === 0) return null;

  // Interpolate position at progress
  const index = Math.floor(progress * (points.length - 1));
  const nextIndex = Math.min(index + 1, points.length - 1);
  const localProgress = (progress * (points.length - 1)) - index;

  const p1 = points[index];
  const p2 = points[nextIndex];

  return {
    x: p1.x + (p2.x - p1.x) * localProgress,
    y: p1.y + (p2.y - p1.y) * localProgress,
  };
}

/**
 * Calculate point on cubic Bezier curve at parameter t (0-1).
 */
function bezierPoint(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  t: number
): { x: number; y: number } {
  const t2 = t * t;
  const t3 = t2 * t;
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;

  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
  };
}

export const TracerParticle = memo(TracerParticleComponent);
