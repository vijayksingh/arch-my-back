import type { DesignTemplate } from '@/types';

export const urlShortenerTemplate: DesignTemplate = {
  slug: 'url-shortener',
  title: 'URL Shortener',
  description: 'Simple read-heavy system: CDN -> Load Balancer -> API -> Redis Cache + PostgreSQL',
  nodes: [
    {
      id: 'cdn',
      type: 'archComponent',
      position: { x: 100, y: 250 },
      data: {
        componentType: 'cdn',
        label: 'CDN',
        config: { cache_ttl: 86400 },
      },
    },
    {
      id: 'lb',
      type: 'archComponent',
      position: { x: 350, y: 250 },
      data: {
        componentType: 'load_balancer',
        label: 'Load Balancer',
        config: { type: 'L7', algorithm: 'round-robin' },
      },
    },
    {
      id: 'api',
      type: 'archComponent',
      position: { x: 600, y: 250 },
      data: {
        componentType: 'app_server',
        label: 'URL Service',
        config: { runtime: 'node:20', replicas: 3, cpu: '2vCPU', memory: '4GB' },
      },
    },
    {
      id: 'cache',
      type: 'archComponent',
      position: { x: 900, y: 120 },
      data: {
        componentType: 'redis',
        label: 'URL Cache',
        config: { memory: '4GB', ttl: 3600 },
      },
    },
    {
      id: 'db',
      type: 'archComponent',
      position: { x: 900, y: 380 },
      data: {
        componentType: 'postgres',
        label: 'URLs Database',
        config: { storage: '50GB', replicas: 2, mode: 'primary-replica' },
      },
    },
  ],
  edges: [
    {
      id: 'edge_cdn_lb',
      source: 'cdn',
      target: 'lb',
      type: 'archEdge',
      data: { protocol: 'HTTPS', label: 'HTTPS' },
    },
    {
      id: 'edge_lb_api',
      source: 'lb',
      target: 'api',
      type: 'archEdge',
      data: { protocol: 'HTTP', port: 8080, label: 'HTTP:8080' },
    },
    {
      id: 'edge_api_cache',
      source: 'api',
      target: 'cache',
      type: 'archEdge',
      data: { protocol: 'TCP', port: 6379, label: 'TCP:6379' },
    },
    {
      id: 'edge_api_db',
      source: 'api',
      target: 'db',
      type: 'archEdge',
      data: { protocol: 'TCP', port: 5432, label: 'TCP:5432' },
    },
  ],
};
