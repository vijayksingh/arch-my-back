/**
 * WalkthroughCanvas - ReactFlow canvas with build mode overlays
 */

import { ReactFlowProvider } from '@xyflow/react';
import { AnimatePresence } from 'motion/react';
import { Play, Square } from 'lucide-react';
import Canvas from '@/components/Canvas/Canvas';
import { BuildPalette } from './canvas/BuildPalette';
import { BuildValidator } from './canvas/BuildValidator';
import { useWalkthroughContext } from './WalkthroughContext';
import { cn } from '@/lib/utils';
import { SimulationControls } from '@/components/Simulation/SimulationControls';

export function WalkthroughCanvas() {
  const {
    currentStep,
    state,
    timelineHighlightedNodes,
    handleNodeAdd,
    handleBuildValidationSuccess,
    handleApplySolution,
    simulationEnabled,
    toggleSimulation,
  } = useWalkthroughContext();

  if (!currentStep) return null;

  return (
    <div className="relative flex h-full min-w-0 flex-1 overflow-hidden bg-background">
      <ReactFlowProvider>
        <Canvas>
          <Canvas.Walkthrough
            nodes={state.canvasNodes}
            edges={state.canvasEdges}
            stepId={currentStep.id}
            highlightedNodeIds={[...state.highlightedNodeIds, ...timelineHighlightedNodes]}
            animatedEdgeIds={state.animatedEdgeIds}
            onNodeAdd={currentStep?.canvasBuildMode ? handleNodeAdd : undefined}
            simulationEnabled={simulationEnabled}
          />
        </Canvas>
      </ReactFlowProvider>

      {/* Simulation Toggle */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        {simulationEnabled && <SimulationControls />}
        <button
          onClick={toggleSimulation}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
            simulationEnabled
              ? "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
              : "border-border bg-card/80 text-muted-foreground hover:bg-accent/20 hover:text-foreground"
          )}
          title={simulationEnabled ? 'Stop simulation' : 'Simulate load on this architecture'}
        >
          {simulationEnabled ? (
            <>
              <Square className="h-3 w-3" />
              Stop Sim
            </>
          ) : (
            <>
              <Play className="h-3 w-3" />
              Simulate
            </>
          )}
        </button>
      </div>

      {/* Build Mode Overlays */}
      {currentStep?.canvasBuildMode && currentStep.buildConfig && (
        <>
          <AnimatePresence>
            <BuildPalette
              palette={currentStep.buildConfig.palette}
              onDragStart={() => {}}
            />
          </AnimatePresence>

          <AnimatePresence>
            <BuildValidator
              validationRules={currentStep.buildConfig.validationRules}
              successMessage={currentStep.buildConfig.successMessage}
              hints={currentStep.buildConfig.hints}
              nodes={state.canvasNodes}
              edges={state.canvasEdges}
              onValidationSuccess={handleBuildValidationSuccess}
              solution={currentStep.buildConfig.solution}
              onApplySolution={handleApplySolution}
            />
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
