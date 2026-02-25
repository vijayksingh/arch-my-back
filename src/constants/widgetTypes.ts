/**
 * Widget type discriminators
 * Used for interactive walkthrough widgets
 */
export const WIDGET_TYPE = {
  QUIZ: 'quiz',
  SCALE_EXPLORER: 'scale-explorer',
  SIMULATION_METRICS: 'simulation-metrics',
} as const;

export type WidgetTypeId = typeof WIDGET_TYPE[keyof typeof WIDGET_TYPE];
