/**
 * React Flow node type discriminators
 * Used as the `type` field in node objects to determine rendering and behavior
 */
export const NODE_TYPE = {
  ARCH_COMPONENT: 'archComponent',
  SHAPE_RECT: 'shapeRect',
  SHAPE_CIRCLE: 'shapeCircle',
  SHAPE_TEXT: 'shapeText',
  SECTION_BADGE: 'sectionBadge',
  COLLAPSIBLE_GROUP: 'collapsibleGroup',
  WIDGET_NODE: 'widgetNode',
} as const;

export type NodeTypeId = typeof NODE_TYPE[keyof typeof NODE_TYPE];
