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

export interface CanvasOperation {
  type: 'add-node' | 'add-edge' | 'highlight' | 'animate-flow';
  node?: Node;
  edge?: Edge;
  nodeIds?: string[];
  edgeIds?: string[];
  duration?: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface RequiredAction {
  type: string;
  description: string;
  targetId?: string;
  sourceId?: string;
  targetNodeId?: string;
}

export interface WalkthroughStep {
  id: string;
  title: string;
  content: string; // Markdown
  canvasOperations: CanvasOperation[];
  widgetIds?: string[];
  quiz?: QuizQuestion;
  requiredAction?: RequiredAction;
  nextCondition: 'click' | 'quiz-correct' | 'action-complete';
}

export interface WalkthroughState {
  currentStepIndex: number;
  completedStepIds: string[];
  completedActionStepIds: string[];
  canvasNodes: Node[];
  canvasEdges: Edge[];
  highlightedNodeIds: string[];
  animatedEdgeIds: string[];
  quizAnswers: Record<string, number>; // stepId -> selectedIndex
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
      case 'click':
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
  submitQuizAnswer(stepId: string, selectedIndex: number): { correct: boolean; explanation?: string } {
    const step = this.steps.find(s => s.id === stepId);
    if (!step?.quiz) {
      return { correct: false };
    }

    this.state.quizAnswers[stepId] = selectedIndex;

    const correct = selectedIndex === step.quiz.correctIndex;
    return {
      correct,
      explanation: step.quiz.explanation,
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
            this.state.canvasNodes.push(op.node);
          }
          break;
        case 'add-edge':
          if (op.edge) {
            this.state.canvasEdges.push(op.edge);
          }
          break;
        case 'highlight':
          if (op.nodeIds) {
            this.state.highlightedNodeIds = [...op.nodeIds];
          }
          break;
        case 'animate-flow':
          if (op.edgeIds) {
            this.state.animatedEdgeIds = [...op.edgeIds];
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
    if (!step.quiz) return false;
    const answer = this.state.quizAnswers[step.id];
    return answer !== undefined && answer === step.quiz.correctIndex;
  }

  private isActionComplete(step: WalkthroughStep): boolean {
    return this.state.completedActionStepIds.includes(step.id);
  }
}
