import type { DesignTemplate } from '@/types';

/**
 * Uber Real-Time Dispatch System Template
 *
 * Demonstrates a real-world dispatch architecture with:
 * - H3 geospatial indexing for fast driver lookup
 * - Real-time matching engine with bipartite graph optimization
 * - DeepETA routing with ML-based ETA prediction
 * - Surge pricing with demand-supply balancing
 * - Timeline showing dispatch flow
 * - Comparison table for matching algorithms
 * - Trade-offs documentation
 */
export const uberDispatchTemplate: DesignTemplate = {
  slug: 'uber-dispatch',
  title: 'Uber Real-Time Dispatch System',
  description: 'Real-world dispatch architecture featuring H3 geospatial indexing, bipartite graph matching, DeepETA routing engine, and surge pricing. Handles 1M+ requests/second with <3s matching latency.',
  nodes: [
    // --- Client Layer ---
    {
      id: 'rider-app',
      type: 'archComponent',
      position: { x: 50, y: 50 },
      data: {
        componentType: 'client_mobile',
        label: 'Rider App',
        config: { runtime: 'mobile', replicas: 1 },
      },
    },
    {
      id: 'driver-app',
      type: 'archComponent',
      position: { x: 350, y: 50 },
      data: {
        componentType: 'client_mobile',
        label: 'Driver App',
        config: { runtime: 'mobile', replicas: 1 },
      },
    },

    // --- API Gateway & WebSocket Layer ---
    {
      id: 'api-gateway',
      type: 'archComponent',
      position: { x: 200, y: 200 },
      data: {
        componentType: 'api_gateway',
        label: 'API Gateway',
        config: { rate_limit: 1000000, auth_method: 'jwt' },
      },
    },
    {
      id: 'websocket-lb',
      type: 'archComponent',
      position: { x: 200, y: 350 },
      data: {
        componentType: 'load_balancer',
        label: 'WebSocket LB (Ringpop)',
        config: { type: 'L7', algorithm: 'ip-hash' },
      },
    },

    // --- Core Services ---
    {
      id: 'dispatch-service',
      type: 'archComponent',
      position: { x: 50, y: 500 },
      data: {
        componentType: 'app_server',
        label: 'Dispatch Service (NodeJS)',
        config: { runtime: 'node:20', replicas: 50, cpu: '4vCPU', memory: '8GB', autoscaling: true },
      },
    },
    {
      id: 'matching-engine',
      type: 'archComponent',
      position: { x: 300, y: 500 },
      data: {
        componentType: 'app_server',
        label: 'Matching Engine',
        config: { runtime: 'go:1.22', replicas: 30, cpu: '8vCPU', memory: '16GB' },
      },
    },
    {
      id: 'geospatial-service',
      type: 'archComponent',
      position: { x: 550, y: 500 },
      data: {
        componentType: 'app_server',
        label: 'Geospatial Service (H3)',
        config: { runtime: 'go:1.22', replicas: 40, cpu: '4vCPU', memory: '16GB' },
      },
    },
    {
      id: 'eta-service',
      type: 'archComponent',
      position: { x: 800, y: 500 },
      data: {
        componentType: 'app_server',
        label: 'ETA Service (Gurafu)',
        config: { runtime: 'rust:1.77', replicas: 20, cpu: '8vCPU', memory: '16GB' },
      },
    },
    {
      id: 'surge-pricing',
      type: 'archComponent',
      position: { x: 1050, y: 500 },
      data: {
        componentType: 'app_server',
        label: 'Surge Pricing Service',
        config: { runtime: 'python:3.12', replicas: 10, cpu: '4vCPU', memory: '8GB' },
      },
    },

    // --- Data Layer ---
    {
      id: 'redis-locations',
      type: 'archComponent',
      position: { x: 550, y: 700 },
      data: {
        componentType: 'redis',
        label: 'Redis (Driver Locations)',
        config: { memory: '256GB', persistence: 'aof', cluster: true },
      },
    },
    {
      id: 'cassandra-trips',
      type: 'archComponent',
      position: { x: 50, y: 700 },
      data: {
        componentType: 'object_storage',
        label: 'Cassandra (Trip Data)',
        config: { versioning: 'false' },
      },
    },
    {
      id: 'postgres-users',
      type: 'archComponent',
      position: { x: 300, y: 700 },
      data: {
        componentType: 'postgres',
        label: 'PostgreSQL (User/Driver DB)',
        config: { replicas: 3 },
      },
    },
    {
      id: 'graph-cache',
      type: 'archComponent',
      position: { x: 800, y: 700 },
      data: {
        componentType: 'redis',
        label: 'Redis (Road Network Graph)',
        config: { memory: '128GB', persistence: 'none', cluster: true },
      },
    },

    // --- ML & Analytics ---
    {
      id: 'ml-model-service',
      type: 'archComponent',
      position: { x: 300, y: 850 },
      data: {
        componentType: 'app_server',
        label: 'ML Model Service (DeepETA)',
        config: { runtime: 'python:3.12', replicas: 15, cpu: '8vCPU', memory: '32GB' },
      },
    },
    {
      id: 'demand-predictor',
      type: 'archComponent',
      position: { x: 1050, y: 700 },
      data: {
        componentType: 'app_server',
        label: 'Demand Prediction',
        config: { runtime: 'python:3.12', replicas: 5, cpu: '4vCPU', memory: '16GB' },
      },
    },

    // --- Streaming & Events ---
    {
      id: 'kafka-events',
      type: 'archComponent',
      position: { x: 550, y: 850 },
      data: {
        componentType: 'kafka',
        label: 'Kafka (Location Stream)',
        config: { partitions: 100, replication: 3 },
      },
    },

    // --- External Services ---
    {
      id: 'maps-api',
      type: 'archComponent',
      position: { x: 1050, y: 350 },
      data: {
        componentType: 'external_api',
        label: 'Maps/Traffic API',
        config: {},
      },
    },
  ],
  edges: [
    // Client to API Gateway
    { id: 'e1', source: 'rider-app', target: 'api-gateway', type: 'archEdge', data: { label: 'HTTPS/REST' } },
    { id: 'e2', source: 'driver-app', target: 'api-gateway', type: 'archEdge', data: { label: 'HTTPS/REST' } },

    // API Gateway to WebSocket LB
    { id: 'e3', source: 'api-gateway', target: 'websocket-lb', type: 'archEdge', data: { label: 'Route' } },

    // WebSocket LB to Services
    { id: 'e4', source: 'websocket-lb', target: 'dispatch-service', type: 'archEdge', data: { label: 'WebSocket' } },

    // Dispatch Service flows
    { id: 'e5', source: 'dispatch-service', target: 'matching-engine', type: 'archEdge', data: { label: 'Match Request' } },
    { id: 'e6', source: 'dispatch-service', target: 'cassandra-trips', type: 'archEdge', data: { label: 'Write Trip' } },

    // Matching Engine flows
    { id: 'e7', source: 'matching-engine', target: 'geospatial-service', type: 'archEdge', data: { label: 'Find Drivers' } },
    { id: 'e8', source: 'matching-engine', target: 'eta-service', type: 'archEdge', data: { label: 'Get ETAs' } },
    { id: 'e9', source: 'matching-engine', target: 'surge-pricing', type: 'archEdge', data: { label: 'Get Price' } },
    { id: 'e10', source: 'matching-engine', target: 'postgres-users', type: 'archEdge', data: { label: 'Get Ratings' } },

    // Geospatial Service
    { id: 'e11', source: 'geospatial-service', target: 'redis-locations', type: 'archEdge', data: { label: 'H3 Query' } },
    { id: 'e12', source: 'driver-app', target: 'kafka-events', type: 'archEdge', data: { label: 'GPS Stream' } },
    { id: 'e13', source: 'kafka-events', target: 'geospatial-service', type: 'archEdge', data: { label: 'Consume' } },

    // ETA Service
    { id: 'e14', source: 'eta-service', target: 'graph-cache', type: 'archEdge', data: { label: 'Road Graph' } },
    { id: 'e15', source: 'eta-service', target: 'ml-model-service', type: 'archEdge', data: { label: 'Post-Process' } },
    { id: 'e16', source: 'eta-service', target: 'maps-api', type: 'archEdge', data: { label: 'Traffic Data' } },

    // Surge Pricing
    { id: 'e17', source: 'surge-pricing', target: 'demand-predictor', type: 'archEdge', data: { label: 'Predictions' } },
    { id: 'e18', source: 'surge-pricing', target: 'redis-locations', type: 'archEdge', data: { label: 'Supply Count' } },

    // ML Training
    { id: 'e19', source: 'ml-model-service', target: 'cassandra-trips', type: 'archEdge', data: { label: 'Training Data' } },
  ],
};
