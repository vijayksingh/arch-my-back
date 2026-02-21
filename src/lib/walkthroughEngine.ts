/**
 * Walkthrough Engine - State machine for progressive learning experiences
 *
 * Handles:
 * - Step navigation (next/previous)
 * - Canvas operation application
 * - Quiz validation
 * - Progress tracking
 */

import type { Node, Edge } from '@xyflow/react';
import type {
  WalkthroughStep,
  CanvasOperation,
  QuizWidgetConfig,
} from '@/types/walkthrough';

// Re-export types that consumers need
export type { WalkthroughStep, QuizWidgetConfig } from '@/types/walkthrough';

export interface WalkthroughState {
  currentStepIndex: number;
  completedStepIds: string[];
  completedActionStepIds: string[];
  canvasNodes: Node[];
  canvasEdges: Edge[];
  highlightedNodeIds: string[];
  animatedEdgeIds: string[];
  quizAnswers: Record<string, string[]>; // stepId -> selected option IDs
}

export class WalkthroughEngine {
  private steps: WalkthroughStep[];
  private state: WalkthroughState;

  constructor(steps: WalkthroughStep[], initialState?: Partial<WalkthroughState>) {
    this.steps = steps;
    this.state = {
      currentStepIndex: 0,
      completedStepIds: [],
      completedActionStepIds: [],
      canvasNodes: [],
      canvasEdges: [],
      highlightedNodeIds: [],
      animatedEdgeIds: [],
      quizAnswers: {},
      ...initialState,
    };
  }

  getCurrentStep(): WalkthroughStep | undefined {
    return this.steps[this.state.currentStepIndex];
  }

  getState(): WalkthroughState {
    return { ...this.state };
  }

  getProgress(): { current: number; total: number; percentage: number } {
    return {
      current: this.state.currentStepIndex + 1,
      total: this.steps.length,
      percentage: ((this.state.currentStepIndex + 1) / this.steps.length) * 100,
    };
  }

  canGoNext(): boolean {
    const currentStep = this.getCurrentStep();
    if (!currentStep) return false;

    switch (currentStep.nextCondition) {
      case 'click-next':
        return true;
      case 'quiz-correct':
        return this.isQuizCorrect(currentStep);
      case 'action-complete':
        return this.isActionComplete(currentStep);
      default:
        return false;
    }
  }

  canGoPrevious(): boolean {
    return this.state.currentStepIndex > 0;
  }

  /**
   * Go to a specific step directly (useful for scrollytelling)
   */
  goToStep(index: number): WalkthroughState {
    if (index < 0 || index >= this.steps.length) {
      return this.state;
    }

    // Mark current step as completed before moving
    const currentStep = this.getCurrentStep();
    if (currentStep && !this.state.completedStepIds.includes(currentStep.id)) {
      this.state.completedStepIds.push(currentStep.id);
    }

    this.state.currentStepIndex = index;
    this.rebuildCanvasState();

    return { ...this.state };
  }

  /**
   * Navigate to next step and apply canvas operations
   */
  next(): WalkthroughState {
    if (!this.canGoNext()) {
      return this.state;
    }

    const currentStep = this.getCurrentStep();
    if (currentStep && !this.state.completedStepIds.includes(currentStep.id)) {
      this.state.completedStepIds.push(currentStep.id);
    }

    this.state.currentStepIndex++;

    // Apply canvas operations for new step
    const newStep = this.getCurrentStep();
    if (newStep) {
      this.applyCanvasOperations(newStep.canvasOperations);
    }

    return { ...this.state };
  }

  /**
   * Navigate to previous step and revert canvas to that state
   */
  previous(): WalkthroughState {
    if (!this.canGoPrevious()) {
      return this.state;
    }

    this.state.currentStepIndex--;

    // Rebuild canvas state from scratch up to current step
    this.rebuildCanvasState();

    return { ...this.state };
  }

  /**
   * Submit quiz answer
   */
  submitQuizAnswer(stepId: string, selectedOptionIds: string[]): { correct: boolean; explanation?: string } {
    const step = this.steps.find(s => s.id === stepId);
    if (!step?.widgets) {
      return { correct: false };
    }

    // Find quiz widget in widgets array
    const quizWidget = step.widgets.find(w => w.type === 'quiz') as QuizWidgetConfig | undefined;
    if (!quizWidget) {
      return { correct: false };
    }

    this.state.quizAnswers[stepId] = selectedOptionIds;

    // Check if all selected options are correct
    const correctOptionIds = quizWidget.options.filter(opt => opt.correct).map(opt => opt.id);
    const correct =
      selectedOptionIds.length === correctOptionIds.length &&
      selectedOptionIds.every(id => correctOptionIds.includes(id));

    // Return explanation from first selected option
    const firstSelected = quizWidget.options.find(opt => opt.id === selectedOptionIds[0]);
    return {
      correct,
      explanation: firstSelected?.explanation,
    };
  }

  /**
   * Mark user action as complete
   */
  completeAction(stepId: string): void {
    if (!this.state.completedActionStepIds.includes(stepId)) {
      this.state.completedActionStepIds.push(stepId);
    }
  }

  /**
   * Apply canvas operations (add nodes, edges, highlight, animate)
   */
  private applyCanvasOperations(operations: CanvasOperation[]): void {
    // Clear previous highlights/animations
    this.state.highlightedNodeIds = [];
    this.state.animatedEdgeIds = [];

    for (const op of operations) {
      switch (op.type) {
        case 'add-node':
          if (op.node) {
            this.state.canvasNodes.push(op.node as Node);
            // Handle highlight flag
            if (op.highlight) {
              this.state.highlightedNodeIds.push(op.node.id);
            }
          }
          break;
        case 'add-edge':
          if (op.edge) {
            this.state.canvasEdges.push(op.edge as Edge);
            // Handle highlight flag
            if (op.highlight) {
              this.state.animatedEdgeIds.push(op.edge.id);
            }
          }
          break;
        case 'highlight':
          if (op.nodeIds) {
            this.state.highlightedNodeIds = [...op.nodeIds];
          }
          break;
        case 'animate-flow':
          // AnimateFlowOperation uses path (array of node IDs), not edgeIds
          // For now, we'll just store the path in highlightedNodeIds
          if (op.path) {
            this.state.highlightedNodeIds = [...op.path];
          }
          break;
        case 'remove-highlight':
          // Remove highlights for specified nodes, or all if not specified
          if (op.nodeIds && op.nodeIds.length > 0) {
            this.state.highlightedNodeIds = this.state.highlightedNodeIds.filter(
              id => !op.nodeIds!.includes(id)
            );
          } else {
            this.state.highlightedNodeIds = [];
          }
          break;
      }
    }
  }

  /**
   * Rebuild canvas state by replaying all operations up to current step
   */
  private rebuildCanvasState(): void {
    this.state.canvasNodes = [];
    this.state.canvasEdges = [];
    this.state.highlightedNodeIds = [];
    this.state.animatedEdgeIds = [];

    for (let i = 0; i <= this.state.currentStepIndex; i++) {
      const step = this.steps[i];
      if (step) {
        this.applyCanvasOperations(step.canvasOperations);
      }
    }
  }

  private isQuizCorrect(step: WalkthroughStep): boolean {
    if (!step.widgets) return false;

    // Find quiz widget in widgets array
    const quizWidget = step.widgets.find(w => w.type === 'quiz') as QuizWidgetConfig | undefined;
    if (!quizWidget) return false;

    const selectedOptionIds = this.state.quizAnswers[step.id];
    if (!selectedOptionIds || selectedOptionIds.length === 0) return false;

    // Get all correct option IDs
    const correctOptionIds = quizWidget.options.filter(opt => opt.correct).map(opt => opt.id);

    // Check if all selected options are correct
    return (
      selectedOptionIds.length === correctOptionIds.length &&
      selectedOptionIds.every(id => correctOptionIds.includes(id))
    );
  }

  private isActionComplete(step: WalkthroughStep): boolean {
    // Check if step has a userAction requirement
    if (!step.userAction) return true; // No action required, can proceed

    return this.state.completedActionStepIds.includes(step.id);
  }
}
