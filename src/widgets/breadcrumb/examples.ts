import type { WidgetExample } from '../types';
import type { BreadcrumbInput, BreadcrumbConfig } from './Breadcrumb';

/**
 * Example 1: File Path Navigation
 */
export const filePathExample: WidgetExample<BreadcrumbInput, BreadcrumbConfig> = {
  name: 'File Path Navigation',
  description: 'Navigate through a file system hierarchy',
  input: {
    path: [
      {
        id: 'root',
        label: 'src',
        type: 'folder',
        metadata: { absolutePath: '/Users/dev/project/src' },
      },
      {
        id: 'components',
        label: 'components',
        type: 'folder',
        metadata: { fileCount: 42 },
      },
      {
        id: 'widgets',
        label: 'widgets',
        type: 'folder',
        metadata: { fileCount: 7 },
      },
      {
        id: 'comparison-table',
        label: 'comparison-table',
        type: 'folder',
        metadata: { fileCount: 3 },
      },
      {
        id: 'component-file',
        label: 'ComparisonTable.tsx',
        type: 'file',
        metadata: { lines: 350, size: '12.4 KB' },
      },
    ],
    currentId: 'component-file',
  },
  config: {
    name: 'File Navigator',
    maxLength: 5,
    showIcons: true,
    separator: 'chevron',
  },
};

/**
 * Example 2: Call Stack Trace
 */
export const callStackExample: WidgetExample<BreadcrumbInput, BreadcrumbConfig> = {
  name: 'Call Stack Trace',
  description: 'Show the execution call stack',
  input: {
    path: [
      {
        id: 'main',
        label: 'main()',
        type: 'function',
        metadata: { line: 1, file: 'index.ts' },
      },
      {
        id: 'app',
        label: 'App.render()',
        type: 'function',
        metadata: { line: 42, file: 'App.tsx' },
      },
      {
        id: 'dashboard',
        label: 'Dashboard.mount()',
        type: 'function',
        metadata: { line: 156, file: 'Dashboard.tsx' },
      },
      {
        id: 'widget-container',
        label: 'WidgetContainer.init()',
        type: 'function',
        metadata: { line: 78, file: 'WidgetContainer.tsx' },
      },
      {
        id: 'comparison-table',
        label: 'ComparisonTable.render()',
        type: 'function',
        metadata: { line: 230, file: 'ComparisonTable.tsx' },
      },
    ],
    currentId: 'comparison-table',
  },
  config: {
    name: 'Call Stack',
    maxLength: 5,
    showIcons: true,
    separator: 'chevron',
  },
};

/**
 * Example 3: Feature Path
 */
export const featurePathExample: WidgetExample<BreadcrumbInput, BreadcrumbConfig> = {
  name: 'Feature Path',
  description: 'Navigate through feature hierarchy',
  input: {
    path: [
      {
        id: 'app',
        label: 'Application',
        type: 'module',
        metadata: { version: '2.0.0' },
      },
      {
        id: 'auth',
        label: 'Authentication',
        type: 'module',
        metadata: { status: 'stable' },
      },
      {
        id: 'login',
        label: 'Login Flow',
        type: 'module',
        metadata: { coverage: '95%' },
      },
      {
        id: 'oauth',
        label: 'OAuth Integration',
        type: 'module',
        metadata: { providers: 3 },
      },
      {
        id: 'google-auth',
        label: 'Google OAuth',
        type: 'class',
        metadata: { status: 'active' },
      },
    ],
    currentId: 'google-auth',
  },
  config: {
    name: 'Feature Path',
    maxLength: 5,
    showIcons: true,
    separator: 'slash',
  },
};

/**
 * Example 4: Long Path with Truncation
 */
export const longPathExample: WidgetExample<BreadcrumbInput, BreadcrumbConfig> = {
  name: 'Long Path (Truncated)',
  description: 'Demonstrate path truncation for long hierarchies',
  input: {
    path: [
      { id: '1', label: 'root', type: 'folder' },
      { id: '2', label: 'usr', type: 'folder' },
      { id: '3', label: 'local', type: 'folder' },
      { id: '4', label: 'lib', type: 'folder' },
      { id: '5', label: 'node_modules', type: 'folder' },
      { id: '6', label: '@tanstack', type: 'folder' },
      { id: '7', label: 'react-router', type: 'folder' },
      { id: '8', label: 'dist', type: 'folder' },
      { id: '9', label: 'esm', type: 'folder' },
      { id: '10', label: 'index.js', type: 'file' },
    ],
    currentId: '10',
  },
  config: {
    name: 'Deep Path',
    maxLength: 5,
    showIcons: true,
    separator: 'slash',
  },
};

/**
 * Example 5: Class Hierarchy
 */
export const classHierarchyExample: WidgetExample<BreadcrumbInput, BreadcrumbConfig> = {
  name: 'Class Hierarchy',
  description: 'Show object-oriented class hierarchy',
  input: {
    path: [
      {
        id: 'base',
        label: 'BaseWidget',
        type: 'class',
        metadata: { abstract: true },
      },
      {
        id: 'interactive',
        label: 'InteractiveWidget',
        type: 'class',
        metadata: { abstract: true },
      },
      {
        id: 'table',
        label: 'TableWidget',
        type: 'class',
        metadata: { abstract: false },
      },
      {
        id: 'comparison',
        label: 'ComparisonTable',
        type: 'class',
        metadata: { instances: 12 },
      },
    ],
    currentId: 'comparison',
  },
  config: {
    name: 'Class Hierarchy',
    maxLength: 5,
    showIcons: true,
    separator: 'dot',
  },
};

export const breadcrumbExamples = [
  filePathExample,
  callStackExample,
  featurePathExample,
  longPathExample,
  classHierarchyExample,
];
