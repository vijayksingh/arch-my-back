import type { CanvasNode, ArchEdge } from './index';
import type { Edge } from '@xyflow/react';

/**
 * Interactive Walkthrough System
 *
 * Enables progressive, step-by-step learning experiences that combine:
 * - Text explanations (markdown)
 * - Canvas evolution (nodes/edges added progressively)
 * - Widget interactions (Timeline, Quiz, Trade-offs, Code, etc.)
 * - User actions and validation
 */

// --- Canvas Operations ---

/**
 * Node type for walkthrough definitions where position is optional
 * (WalkthroughEngine adds default position {x: 0, y: 0} before ELK layout)
 */
export type WalkthroughNodeDef = Omit<CanvasNode, 'position'> & {
  position?: { x: number; y: number };
};

export interface AddNodeOperation {
  type: 'add-node';
  node: WalkthroughNodeDef;
  highlight?: boolean;
  animateIn?: boolean;
}

export interface AddEdgeOperation {
  type: 'add-edge';
  edge: ArchEdge;
  highlight?: boolean;
  animateFlow?: boolean;
}

export interface HighlightOperation {
  type: 'highlight';
  nodeIds: string[];
  duration?: number; // ms
  color?: string;
}

export interface AnimateFlowOperation {
  type: 'animate-flow';
  path: string[]; // node IDs in sequence
  duration?: number; // ms per hop
  label?: string;
}

export interface RemoveHighlightOperation {
  type: 'remove-highlight';
  nodeIds?: string[]; // if empty, remove all
}

export type CanvasOperation =
  | AddNodeOperation
  | AddEdgeOperation
  | HighlightOperation
  | AnimateFlowOperation
  | RemoveHighlightOperation;

// --- Widget Configurations ---

export interface TimelineWidgetConfig {
  type: 'timeline';
  title: string;
  interactive?: boolean; // enables step-through mode (default false)
  events: Array<{
    label: string;
    description: string;
    nodeIds?: string[]; // highlight when selected
    predictPrompt?: string; // show before revealing event
    predictOptions?: Array<{ text: string; correct: boolean }>;
  }>;
}

// Quiz Widget - Multiple Choice (default/legacy mode)
export interface QuizWidgetConfigMCQ {
  type: 'quiz';
  mode?: 'mcq'; // optional for backward compatibility
  question: string;
  options: Array<{
    id: string;
    text: string;
    correct: boolean;
    explanation: string; // shown after selection
  }>;
  multiSelect?: boolean;
}

// Quiz Widget - Predict the Output
export interface QuizWidgetConfigPredictOutput {
  type: 'quiz';
  mode: 'predict-output';
  question: string;
  code: string;
  language: string;
  inputs: string;
  expectedOutput: string;
  tolerance?: string; // e.g., "whitespace" or "case-insensitive"
}

// Quiz Widget - Fill in the Blank
export interface QuizWidgetConfigFillBlank {
  type: 'quiz';
  mode: 'fill-blank';
  question: string;
  code: string;
  language: string;
  blanks: Array<{
    lineNumber: number;
    hint: string;
    answer: string;
    acceptAlternatives?: string[];
  }>;
}

// Quiz Widget - Spot the Bug
export interface QuizWidgetConfigSpotBug {
  type: 'quiz';
  mode: 'spot-bug';
  question: string;
  code: string;
  language: string;
  buggyLines: number[];
  explanation: string;
}

// Quiz Widget - Ordering/Sequencing
export interface QuizWidgetConfigOrdering {
  type: 'quiz';
  mode: 'ordering';
  question: string;
  items: Array<{
    id: string;
    text: string;
  }>;
  correctOrder: string[]; // array of item IDs in correct order
}

export type QuizWidgetConfig =
  | QuizWidgetConfigMCQ
  | QuizWidgetConfigPredictOutput
  | QuizWidgetConfigFillBlank
  | QuizWidgetConfigSpotBug
  | QuizWidgetConfigOrdering;

export interface TradeoffsWidgetConfig {
  type: 'tradeoffs';
  title: string;
  decision: string;
  mode?: 'display' | 'decision'; // default 'display' for backward compat
  scenario?: string; // context for the decision (decision mode)
  constraints?: string[]; // requirements/constraints (decision mode)
  options: Array<{
    label: string;
    pros: string[];
    cons: string[];
    consequence?: string; // what happens if this option is chosen (decision mode)
    recommended?: boolean; // highlights the best choice after reveal (decision mode)
  }>;
}

export interface CodeBlockWidgetConfig {
  type: 'code-block';
  title: string;
  language: string;
  code: string;
  highlights?: number[]; // line numbers
}

export interface ComparisonTableWidgetConfig {
  type: 'comparison-table';
  title: string;
  columns: string[];
  mode?: 'display' | 'analysis'; // default 'display'
  rows: Array<{
    label: string;
    values: string[];
    blanks?: number[]; // column indices that are blank for learner to fill
    acceptableAnswers?: Record<number, string[]>; // col index -> acceptable strings
  }>;
  decisionPrompt?: string; // "Based on this data, which option would you ship?"
  decisionOptions?: Array<{
    id: string;
    text: string;
    correct: boolean;
    explanation: string;
  }>;
}

export interface ScaleExplorerWidgetConfig {
  type: 'scale-explorer';
  title: string;
  parameter: {
    name: string;
    min: number;
    max: number;
    unit: string;
    scale: 'linear' | 'log';
  };
  metrics: Array<{
    name: string;
    unit: string;
    compute: string; // formula expression, e.g., "n * n * 0.001"
    thresholds: {
      warning: number;
      critical: number;
    };
  }>;
  insights: Array<{
    triggerValue: number;
    message: string;
  }>;
}

export type WidgetConfig =
  | TimelineWidgetConfig
  | QuizWidgetConfig
  | TradeoffsWidgetConfig
  | CodeBlockWidgetConfig
  | ComparisonTableWidgetConfig
  | ScaleExplorerWidgetConfig;

// --- User Actions ---

export interface ClickNodeAction {
  type: 'click-node';
  nodeId: string;
}

export interface AnswerQuizAction {
  type: 'answer-quiz';
  correctAnswerIds: string[];
}

export interface SelectTradeoffAction {
  type: 'select-tradeoff';
  optionId: string;
}

export type UserAction = ClickNodeAction | AnswerQuizAction | SelectTradeoffAction;

// --- Build Mode Configuration ---

export interface BuildPaletteComponent {
  id: string;
  label: string;
  componentType: string; // maps to existing node types
  description: string;
}

export interface BuildValidationRule {
  type: 'must-connect' | 'must-not-connect' | 'must-exist' | 'min-count';
  params: Record<string, unknown>;
  feedback: string; // shown when rule fails
}

export interface BuildStepSolution {
  // Correct final state (positions optional - will be computed by ELK)
  nodes: WalkthroughNodeDef[];
  edges: Edge[];

  // Architectural explanation (WHY this is correct)
  explanation: {
    title: string;          // e.g., "The Cache-First Pattern"
    reasoning: string[];    // Bullet points explaining key decisions
    commonMistakes: string[]; // What learners typically get wrong
    keyInsight: string;     // One-sentence core principle
  };
}

export interface BuildConfig {
  palette: BuildPaletteComponent[];
  initialNodes?: string[]; // pre-placed node IDs (existing from canvas operations)
  validationRules: BuildValidationRule[];
  successMessage: string;
  hints: string[]; // progressive hints if learner is stuck
  solution?: BuildStepSolution; // Optional - enables "Show Answer" feature
}

// --- Walkthrough Step ---

export interface WalkthroughStep {
  id: string;
  title: string;
  phase: 'intro' | 'naive' | 'complexity' | 'real' | 'exercise' | 'deep-dive';

  // Content
  content: string; // Markdown text explanation

  // Canvas changes
  canvasOperations: CanvasOperation[];

  // Widgets to display
  widgets?: WidgetConfig[];

  // Optional user interaction
  userAction?: UserAction;

  // Build Mode (for exercise phases)
  canvasBuildMode?: boolean;
  buildConfig?: BuildConfig;

  // Completion condition
  nextCondition: 'click-next' | 'quiz-correct' | 'action-complete';

  // Timing
  estimatedMinutes: number;
}

// --- Complete Walkthrough ---

export interface Walkthrough {
  id: string;
  slug: string;
  title: string;
  description: string;
  learningGoals: string[];
  estimatedMinutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';

  // Technical metadata
  tags: string[];
  sources: Array<{
    title: string;
    url: string;
  }>;

  // Steps
  steps: WalkthroughStep[];
}
