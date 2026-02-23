/**
 * Walkthrough Engine - State machine for progressive learning experiences
 *
 * Handles:
 * - Step navigation (next/previous)
 * - Canvas operation application
 * - Quiz validation
 * - Progress tracking
 */

import type { Node, Edge, Connection } from '@xyflow/react';
import type {
  WalkthroughStep,
  CanvasOperation,
  QuizWidgetConfig,
} from '@/types/walkthrough';
import { WIDGET_TYPE } from '@/constants';

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
  userEdgeIds: string[]; // IDs of edges created by user (for distinct styling)
  buildModeValidated: Record<string, boolean>; // stepId -> validation success
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
      userEdgeIds: [],
      buildModeValidated: {},
      ...initialState,
    };

    // Apply canvas operations for step 0 to initialize canvas state
    this.applyCanvasOperations(this.steps[0]?.canvasOperations ?? []);
  }

  getCurrentStep(): WalkthroughStep | undefined {
    return this.steps[this.state.currentStepIndex];
  }

  getState(): WalkthroughState {
    return {
      ...this.state,
      canvasNodes: this.state.canvasNodes.map(n => ({ ...n, data: { ...n.data } })),
      canvasEdges: this.state.canvasEdges.map(e => ({ ...e })),
      highlightedNodeIds: [...this.state.highlightedNodeIds],
      animatedEdgeIds: [...this.state.animatedEdgeIds],
      completedStepIds: [...this.state.completedStepIds],
      completedActionStepIds: [...this.state.completedActionStepIds],
      userEdgeIds: [...this.state.userEdgeIds],
      quizAnswers: { ...this.state.quizAnswers },
      buildModeValidated: { ...this.state.buildModeValidated },
    };
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

    // If in build mode, must validate successfully before proceeding
    if (currentStep.canvasBuildMode) {
      return this.state.buildModeValidated[currentStep.id] === true;
    }

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
   * Go to a specific step directly (for navigation, does NOT mark steps complete)
   * Steps are only marked complete via explicit next() calls
   */
  goToStep(index: number): WalkthroughState {
    if (index < 0 || index >= this.steps.length) {
      return this.getState();
    }

    this.state.currentStepIndex = index;
    this.rebuildCanvasState();

    return this.getState();
  }

  /**
   * Navigate to next step and apply canvas operations
   */
  next(): WalkthroughState {
    if (!this.canGoNext()) {
      return this.getState();
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

    return this.getState();
  }

  /**
   * Navigate to previous step and revert canvas to that state
   */
  previous(): WalkthroughState {
    if (!this.canGoPrevious()) {
      return this.getState();
    }

    this.state.currentStepIndex--;

    // Rebuild canvas state from scratch up to current step
    this.rebuildCanvasState();

    return this.getState();
  }

  /**
   * Submit quiz answer
   */
  submitQuizAnswer(stepId: string, selectedOptionIds: string[]): { correct: boolean; explanation?: string } {
    const step = this.steps.find(s => s.id === stepId);
    if (!step?.widgets) {
      return { correct: false };
    }

    this.state.quizAnswers[stepId] = selectedOptionIds;

    const { correct } = this.checkQuizAnswer(step, selectedOptionIds);

    // Find quiz widget to get explanation
    const quizWidget = step.widgets.find(w => w.type === WIDGET_TYPE.QUIZ) as QuizWidgetConfig | undefined;
    const firstSelected = quizWidget?.options.find(opt => opt.id === selectedOptionIds[0]);

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
   * Add a user-created edge to the canvas
   */
  addUserEdge(connection: Connection): void {
    if (!connection.source || !connection.target) return;

    const edgeId = `user-edge-${connection.source}-${connection.target}`;

    // Check if edge already exists
    const edgeExists = this.state.canvasEdges.some(e => e.id === edgeId);
    if (edgeExists) return;

    const newEdge: Edge = {
      id: edgeId,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      // Mark as user-created for distinct styling
      style: {
        strokeDasharray: '5,5',
        opacity: 0.6,
      },
    };

    this.state.canvasEdges.push(newEdge);
    this.state.userEdgeIds.push(edgeId);
  }

  /**
   * Add a user-created node to the canvas (from build mode palette)
   */
  addUserNode(node: Node): void {
    this.state.canvasNodes.push(node);
  }

  /**
   * Mark build mode as validated for a step
   */
  setBuildModeValidated(stepId: string, validated: boolean): void {
    this.state.buildModeValidated[stepId] = validated;
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
          // AnimateFlowOperation uses path (array of node IDs)
          // Compute which edges connect consecutive nodes in the path
          if (op.path && op.path.length > 1) {
            const edgeIds: string[] = [];
            for (let i = 0; i < op.path.length - 1; i++) {
              const sourceId = op.path[i];
              const targetId = op.path[i + 1];
              // Find edge connecting these two nodes
              const edge = this.state.canvasEdges.find(
                e => e.source === sourceId && e.target === targetId
              );
              if (edge) {
                edgeIds.push(edge.id);
              }
            }
            this.state.animatedEdgeIds = edgeIds;
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
    // Save user-created edges before clearing
    const userEdges = this.state.canvasEdges.filter(edge =>
      this.state.userEdgeIds.includes(edge.id)
    );

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

    // Restore user edges whose source and target nodes still exist
    const nodeIds = new Set(this.state.canvasNodes.map(n => n.id));
    const restoredUserEdgeIds: string[] = [];

    for (const userEdge of userEdges) {
      if (nodeIds.has(userEdge.source) && nodeIds.has(userEdge.target)) {
        this.state.canvasEdges.push(userEdge);
        restoredUserEdgeIds.push(userEdge.id);
      }
    }

    // Clean up userEdgeIds - keep only those that were restored
    this.state.userEdgeIds = restoredUserEdgeIds;
  }

  /**
   * Check quiz answer correctness for a given step and selected options
   * @returns Object with correct flag and array of correct option IDs
   */
  private checkQuizAnswer(
    step: WalkthroughStep,
    selectedOptionIds: string[]
  ): { correct: boolean; correctOptionIds: string[] } {
    // Find quiz widget in widgets array
    const quizWidget = step.widgets?.find(w => w.type === WIDGET_TYPE.QUIZ) as QuizWidgetConfig | undefined;
    if (!quizWidget) {
      return { correct: false, correctOptionIds: [] };
    }

    // For new quiz modes (predict-output, fill-blank, spot-bug, ordering),
    // the component submits ['correct'] or ['incorrect'] as a simple signal
    const mode = quizWidget.mode || 'mcq';
    if (mode !== 'mcq') {
      const correct = selectedOptionIds.includes('correct');
      return { correct, correctOptionIds: [] };
    }

    // MCQ mode: Get all correct option IDs
    const correctOptionIds = quizWidget.options.filter(opt => opt.correct).map(opt => opt.id);

    // Check if all selected options are correct
    const correct =
      selectedOptionIds.length === correctOptionIds.length &&
      selectedOptionIds.every(id => correctOptionIds.includes(id));

    return { correct, correctOptionIds };
  }

  private isQuizCorrect(step: WalkthroughStep): boolean {
    if (!step.widgets) return false;

    const selectedOptionIds = this.state.quizAnswers[step.id];
    if (!selectedOptionIds || selectedOptionIds.length === 0) return false;

    const { correct } = this.checkQuizAnswer(step, selectedOptionIds);
    return correct;
  }

  private isActionComplete(step: WalkthroughStep): boolean {
    // Check if step has a userAction requirement
    if (!step.userAction) return true; // No action required, can proceed

    return this.state.completedActionStepIds.includes(step.id);
  }
}
