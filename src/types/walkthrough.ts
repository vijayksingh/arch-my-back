import type { CanvasNode, ArchEdge } from './index';

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

export interface AddNodeOperation {
  type: 'add-node';
  node: CanvasNode;
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
  events: Array<{
    label: string;
    description: string;
    nodeIds?: string[]; // highlight when selected
  }>;
}

export interface QuizWidgetConfig {
  type: 'quiz';
  question: string;
  options: Array<{
    id: string;
    text: string;
    correct: boolean;
    explanation: string; // shown after selection
  }>;
  multiSelect?: boolean;
}

export interface TradeoffsWidgetConfig {
  type: 'tradeoffs';
  title: string;
  decision: string;
  options: Array<{
    label: string;
    pros: string[];
    cons: string[];
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
  rows: Array<{
    label: string;
    values: string[];
  }>;
}

export type WidgetConfig =
  | TimelineWidgetConfig
  | QuizWidgetConfig
  | TradeoffsWidgetConfig
  | CodeBlockWidgetConfig
  | ComparisonTableWidgetConfig;

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
