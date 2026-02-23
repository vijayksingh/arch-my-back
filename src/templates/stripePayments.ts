import type { DesignTemplate } from '@/types';

/**
 * Stripe Payment Processing Architecture
 *
 * Real-world example showcasing Stripe's payment processing pipeline with:
 * - Multi-region API Gateway architecture
 * - Payment state machine (authorization → capture → settlement)
 * - Fraud detection with Stripe Radar
 * - Double-entry ledger system for financial accuracy
 * - Idempotency keys for reliable payment processing
 *
 * This template demonstrates the core architectural patterns Stripe uses to process
 * hundreds of billions in payments annually with high reliability and accuracy.
 *
 * Key Components:
 * - API Gateway: Multi-region redundant architecture
 * - PaymentIntent Service: State machine orchestration
 * - Radar: ML-based fraud detection
 * - Ledger: Double-entry bookkeeping system
 * - Partner Integrations: Card networks and banks
 *
 * Architectural Patterns:
 * - Idempotency: Prevents duplicate charges with 24-hour key caching
 * - Atomic Phases: Database operations grouped in serializable transactions
 * - Eventual Consistency: Local state committed before external API calls
 * - Network Effects: 92% card recognition rate across billions of transactions
 */
export const stripePaymentsTemplate: DesignTemplate = {
  slug: 'stripe-payments',
  title: 'Stripe Payment Processing',
  description: 'Real-world payment architecture with state machine, fraud detection, and ledger system. Demonstrates authorization → capture → settlement flow with idempotency patterns.',

  nodes: [
    // Entry point - Client applications
    {
      id: 'client-web',
      type: 'archComponent',
      position: { x: 50, y: 50 },
      data: {
        componentType: 'client_browser',
        label: 'Web Client',
        config: {
          description: 'E-commerce website with Stripe.js integration',
        },
      },
    },
    {
      id: 'client-mobile',
      type: 'archComponent',
      position: { x: 50, y: 200 },
      data: {
        componentType: 'client_mobile',
        label: 'Mobile App',
        config: {
          description: 'iOS/Android with Stripe mobile SDK',
        },
      },
    },

    // Multi-region API Gateway layer
    {
      id: 'api-gateway-us',
      type: 'archComponent',
      position: { x: 300, y: 50 },
      data: {
        componentType: 'api_gateway',
        label: 'API Gateway (US)',
        config: {
          description: 'Regional gateway with isolated failure domains',
        },
      },
    },
    {
      id: 'api-gateway-eu',
      type: 'archComponent',
      position: { x: 300, y: 150 },
      data: {
        componentType: 'api_gateway',
        label: 'API Gateway (EU)',
        config: {
          description: 'European region for GDPR compliance',
        },
      },
    },
    {
      id: 'api-gateway-asia',
      type: 'archComponent',
      position: { x: 300, y: 250 },
      data: {
        componentType: 'api_gateway',
        label: 'API Gateway (Asia)',
        config: {
          description: 'Asia-Pacific region for low latency',
        },
      },
    },

    // Core payment services
    {
      id: 'payment-intent-service',
      type: 'archComponent',
      position: { x: 550, y: 150 },
      data: {
        componentType: 'app_server',
        label: 'PaymentIntent Service',
        config: {
          description: 'State machine: requires_payment_method → requires_confirmation → processing → requires_capture → succeeded',
        },
      },
    },

    // Fraud detection
    {
      id: 'radar-ml',
      type: 'archComponent',
      position: { x: 800, y: 50 },
      data: {
        componentType: 'app_server',
        label: 'Stripe Radar',
        config: {
          description: 'ML fraud detection trained on billions of transactions. 92% card recognition rate',
        },
      },
    },
    {
      id: 'radar-db',
      type: 'archComponent',
      position: { x: 800, y: 200 },
      data: {
        componentType: 'postgres',
        label: 'Fraud Signals DB',
        config: {
          description: 'Device fingerprints, IP addresses, card metadata',
        },
      },
    },

    // Idempotency layer
    {
      id: 'idempotency-cache',
      type: 'archComponent',
      position: { x: 550, y: 0 },
      data: {
        componentType: 'redis',
        label: 'Idempotency Keys',
        config: {
          description: '24-hour cache of request IDs and responses. Prevents duplicate charges',
        },
      },
    },

    // Payment processing
    {
      id: 'authorization-service',
      type: 'archComponent',
      position: { x: 550, y: 300 },
      data: {
        componentType: 'app_server',
        label: 'Authorization Service',
        config: {
          description: 'Places hold on payment method. 7-day validity window',
        },
      },
    },
    {
      id: 'capture-service',
      type: 'archComponent',
      position: { x: 800, y: 350 },
      data: {
        componentType: 'app_server',
        label: 'Capture Service',
        config: {
          description: 'Initiates fund movement from customer to merchant',
        },
      },
    },

    // Ledger system
    {
      id: 'ledger-service',
      type: 'archComponent',
      position: { x: 1050, y: 150 },
      data: {
        componentType: 'app_server',
        label: 'Ledger Service',
        config: {
          description: 'Double-entry bookkeeping. Processes 5B events/day with 99.99% accuracy',
        },
      },
    },
    {
      id: 'ledger-db',
      type: 'archComponent',
      position: { x: 1050, y: 300 },
      data: {
        componentType: 'postgres',
        label: 'Ledger DB',
        config: {
          description: 'Immutable audit log. Every transaction balances to zero',
        },
      },
    },

    // Settlement
    {
      id: 'settlement-service',
      type: 'archComponent',
      position: { x: 1050, y: 0 },
      data: {
        componentType: 'app_server',
        label: 'Settlement Service',
        config: {
          description: 'Transfers funds to merchant accounts. 1-3 business days',
        },
      },
    },

    // Event streaming for async operations
    {
      id: 'kafka-events',
      type: 'archComponent',
      position: { x: 800, y: 500 },
      data: {
        componentType: 'kafka',
        label: 'Event Stream',
        config: {
          description: 'Payment events, webhooks, async reconciliation',
        },
      },
    },

    // External integrations
    {
      id: 'card-networks',
      type: 'archComponent',
      position: { x: 1300, y: 150 },
      data: {
        componentType: 'external_api',
        label: 'Card Networks',
        config: {
          description: 'Visa, Mastercard, Amex. Authorization requests',
        },
      },
    },
    {
      id: 'issuing-banks',
      type: 'archComponent',
      position: { x: 1300, y: 300 },
      data: {
        componentType: 'external_api',
        label: 'Issuing Banks',
        config: {
          description: 'Customer banks. Approve/decline authorization',
        },
      },
    },
    {
      id: 'acquiring-banks',
      type: 'archComponent',
      position: { x: 1300, y: 0 },
      data: {
        componentType: 'external_api',
        label: 'Acquiring Banks',
        config: {
          description: 'Merchant banks. Receive settled funds',
        },
      },
    },

    // Monitoring and observability
    {
      id: 'monitoring',
      type: 'archComponent',
      position: { x: 550, y: 500 },
      data: {
        componentType: 'app_server',
        label: 'Monitoring',
        config: {
          description: 'Real-time payment tracking, alerts, SLO monitoring',
        },
      },
    },
  ],

  edges: [
    // Client to API Gateway
    { id: 'e1', source: 'client-web', target: 'api-gateway-us', type: 'archEdge', data: { protocol: 'HTTPS', label: 'POST /v1/payment_intents' } },
    { id: 'e2', source: 'client-mobile', target: 'api-gateway-us', type: 'archEdge', data: { protocol: 'HTTPS' } },
    { id: 'e3', source: 'client-web', target: 'api-gateway-eu', type: 'archEdge', data: { protocol: 'HTTPS' } },
    { id: 'e4', source: 'client-mobile', target: 'api-gateway-asia', type: 'archEdge', data: { protocol: 'HTTPS' } },

    // API Gateway to core services
    { id: 'e5', source: 'api-gateway-us', target: 'payment-intent-service', type: 'archEdge', data: { label: 'Route request' } },
    { id: 'e6', source: 'api-gateway-eu', target: 'payment-intent-service', type: 'archEdge', data: {} },
    { id: 'e7', source: 'api-gateway-asia', target: 'payment-intent-service', type: 'archEdge', data: {} },

    // Idempotency check
    { id: 'e8', source: 'payment-intent-service', target: 'idempotency-cache', type: 'archEdge', data: { label: 'Check idempotency key' } },

    // Fraud detection
    { id: 'e9', source: 'payment-intent-service', target: 'radar-ml', type: 'archEdge', data: { label: 'Risk scoring' } },
    { id: 'e10', source: 'radar-ml', target: 'radar-db', type: 'archEdge', data: { label: 'Query fraud signals' } },

    // Authorization flow
    { id: 'e11', source: 'payment-intent-service', target: 'authorization-service', type: 'archEdge', data: { label: 'State: requires_confirmation' } },
    { id: 'e12', source: 'authorization-service', target: 'card-networks', type: 'archEdge', data: { label: 'Authorization request' } },
    { id: 'e13', source: 'card-networks', target: 'issuing-banks', type: 'archEdge', data: { label: 'Approve/decline' } },

    // Capture flow
    { id: 'e14', source: 'payment-intent-service', target: 'capture-service', type: 'archEdge', data: { label: 'State: requires_capture' } },
    { id: 'e15', source: 'capture-service', target: 'card-networks', type: 'archEdge', data: { label: 'Capture request' } },

    // Ledger recording
    { id: 'e16', source: 'authorization-service', target: 'ledger-service', type: 'archEdge', data: { label: 'Record authorization' } },
    { id: 'e17', source: 'capture-service', target: 'ledger-service', type: 'archEdge', data: { label: 'Record capture' } },
    { id: 'e18', source: 'ledger-service', target: 'ledger-db', type: 'archEdge', data: { label: 'Append-only log' } },

    // Settlement
    { id: 'e19', source: 'ledger-service', target: 'settlement-service', type: 'archEdge', data: { label: 'Trigger settlement' } },
    { id: 'e20', source: 'settlement-service', target: 'acquiring-banks', type: 'archEdge', data: { label: 'Transfer funds' } },

    // Event streaming
    { id: 'e21', source: 'payment-intent-service', target: 'kafka-events', type: 'archEdge', data: { label: 'Publish events' } },
    { id: 'e22', source: 'ledger-service', target: 'kafka-events', type: 'archEdge', data: { label: 'Reconciliation events' } },
    { id: 'e23', source: 'kafka-events', target: 'monitoring', type: 'archEdge', data: { label: 'Metrics & alerts' } },
  ],
};
