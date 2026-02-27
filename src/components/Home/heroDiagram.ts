import type { Node, Edge } from '@xyflow/react';
import { NODE_TYPE } from '@/constants';

export const heroNodes: Node[] = [
  {
    id: 'mobile',
    type: NODE_TYPE.ARCH_COMPONENT,
    position: { x: -250, y: 450 },
    data: { componentType: 'client_mobile', label: 'Mobile App' },
  },
  {
    id: 'client',
    type: NODE_TYPE.ARCH_COMPONENT,
    position: { x: -250, y: 250 },
    data: { componentType: 'client_browser', label: 'Web Client' },
  },
  {
    id: 'gateway',
    type: NODE_TYPE.ARCH_COMPONENT,
    position: { x: 150, y: 350 },
    data: { componentType: 'api_gateway', label: 'Global Gateway' },
  },
  {
    id: 'auth',
    type: NODE_TYPE.ARCH_COMPONENT,
    position: { x: 550, y: 150 },
    data: { componentType: 'app_server', label: 'Auth Service' },
  },
  {
    id: 'core-api',
    type: NODE_TYPE.ARCH_COMPONENT,
    position: { x: 550, y: 350 },
    data: { componentType: 'app_server', label: 'Core Graph API' },
  },
  {
    id: 'worker',
    type: NODE_TYPE.ARCH_COMPONENT,
    position: { x: 150, y: 550 },
    data: { componentType: 'lambda', label: 'Event Processor' },
  },
  {
    id: 'queue',
    type: NODE_TYPE.ARCH_COMPONENT,
    position: { x: 550, y: 550 },
    data: { componentType: 'kafka', label: 'Event Bus' },
  },
  {
    id: 'cache',
    type: NODE_TYPE.ARCH_COMPONENT,
    position: { x: 950, y: 250 },
    data: { componentType: 'redis', label: 'Global Cache' },
  },
  {
    id: 'db',
    type: NODE_TYPE.ARCH_COMPONENT,
    position: { x: 950, y: 450 },
    data: { componentType: 'postgresql', label: 'Primary DB' },
  },
  {
    id: 'search',
    type: NODE_TYPE.ARCH_COMPONENT,
    position: { x: 1350, y: 350 },
    data: { componentType: 'elasticsearch', label: 'Search Cluster' },
  },
  {
    id: 'replica',
    type: NODE_TYPE.ARCH_COMPONENT,
    position: { x: 1350, y: 550 },
    data: { componentType: 'postgresql', label: 'Read Replica' },
  },
];

export const heroEdges: Edge[] = [
  { id: 'e1', source: 'client', target: 'gateway', type: 'archEdge', animated: true },
  { id: 'e2', source: 'mobile', target: 'gateway', type: 'archEdge', animated: true },
  { id: 'e3', source: 'gateway', target: 'auth', type: 'archEdge', animated: true },
  { id: 'e4', source: 'gateway', target: 'core-api', type: 'archEdge', animated: true },
  { id: 'e5', source: 'core-api', target: 'cache', type: 'archEdge', animated: true },
  { id: 'e6', source: 'core-api', target: 'db', type: 'archEdge', animated: true },
  { id: 'e7', source: 'core-api', target: 'queue', type: 'archEdge', animated: true },
  { id: 'e8', source: 'queue', target: 'worker', type: 'archEdge', animated: true },
  { id: 'e9', source: 'db', target: 'replica', type: 'archEdge', animated: true },
  { id: 'e10', source: 'core-api', target: 'search', type: 'archEdge', animated: true },
];