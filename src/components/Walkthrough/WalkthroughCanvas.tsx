/**
 * WalkthroughCanvas - ReactFlow canvas with build mode overlays
 */

import { ReactFlowProvider } from '@xyflow/react';
import { AnimatePresence } from 'motion/react';
import Canvas from '@/components/Canvas/Canvas';
import { BuildPalette } from './canvas/BuildPalette';
import { BuildValidator } from './canvas/BuildValidator';
import { useWalkthroughContext } from './WalkthroughContext';

export function WalkthroughCanvas() {
  const {
    currentStep,
    state,
    timelineHighlightedNodes,
    handleNodeAdd,
    handleBuildValidationSuccess,
    handleApplySolution,
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
          />
        </Canvas>
      </ReactFlowProvider>

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
