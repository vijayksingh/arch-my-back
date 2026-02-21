import type { WidgetFlow, WidgetInstance } from '../types';

/**
 * Stripe Payment Processing Flow
 *
 * Real-world example demonstrating Stripe's payment architecture using
 * widget composition to explain the authorization → capture → settlement lifecycle
 *
 * Widget Flow:
 * 1. Breadcrumb: Navigate through payment system components
 * 2. Timeline: Show payment state transitions with timestamps
 * 3. Code Block: Demonstrate Stripe API integration with idempotency
 * 4. Code Diff: Show API evolution from v1 to v2 (PaymentIntents)
 * 5. Trade-offs Card: Document architectural decisions
 * 6. Annotation Layer: Explain state transitions and error scenarios
 */

// Helper to create widget instances
function createWidgetInstance(
  widgetId: string,
  config: unknown,
  position: { x: number; y: number },
  input?: unknown,
  output?: unknown
): WidgetInstance {
  return {
    id: `${widgetId}-${Date.now()}-${Math.random()}`,
    widgetId,
    config,
    position,
    input,
    output,
  };
}

/**
 * Stripe Payment Processing Walkthrough
 *
 * Demonstrates the complete payment lifecycle with widgets explaining each step:
 * - Breadcrumb for navigation context
 * - Timeline for state machine visualization
 * - Code blocks for API implementation
 * - Code diff for API versioning
 * - Trade-offs card for architectural decisions
 */
export const stripePaymentWalkthroughFlow: WidgetFlow = {
  id: 'stripe-payment-walkthrough',
  name: 'Stripe Payment Processing Walkthrough',
  widgets: [
    // Breadcrumb: Payment system navigation
    createWidgetInstance(
      'breadcrumb',
      {
        showIcons: true,
        interactive: true,
      },
      { x: 50, y: 50 },
      {
        path: ['Stripe', 'Payment Processing', 'PaymentIntent Lifecycle'],
      }
    ),

    // Timeline: Payment state machine with authorization → capture → settlement
    createWidgetInstance(
      'timeline',
      {
        orientation: 'vertical',
        showTimestamps: true,
      },
      { x: 50, y: 200 },
      {
        events: [
          {
            id: 'evt-1',
            timestamp: '2024-01-15T10:00:00.000Z',
            title: 'Payment Created',
            description: 'Status: requires_payment_method. Client creates PaymentIntent with idempotency key',
          },
          {
            id: 'evt-2',
            timestamp: '2024-01-15T10:00:00.150Z',
            title: 'Payment Method Attached',
            description: 'Status: requires_confirmation. Customer card details collected via Stripe.js',
          },
          {
            id: 'evt-3',
            timestamp: '2024-01-15T10:00:00.300Z',
            title: 'Fraud Check (Radar)',
            description: 'ML model analyzes 200+ signals. Risk score: 0.12 (low). Card seen 47 times on network',
          },
          {
            id: 'evt-4',
            timestamp: '2024-01-15T10:00:00.450Z',
            title: 'Authorization Request',
            description: 'Status: processing. Request sent to card network → issuing bank. Funds held for 7 days',
          },
          {
            id: 'evt-5',
            timestamp: '2024-01-15T10:00:00.780Z',
            title: 'Authorization Approved',
            description: 'Status: requires_capture. Issuing bank approves. Funds reserved on customer account',
          },
          {
            id: 'evt-6',
            timestamp: '2024-01-15T10:00:00.900Z',
            title: 'Ledger Entry Created',
            description: 'Double-entry bookkeeping: Debit customer hold, Credit merchant pending',
          },
          {
            id: 'evt-7',
            timestamp: '2024-01-15T10:05:00.000Z',
            title: 'Capture Initiated',
            description: 'Merchant confirms shipment. Capture request sent to card network',
          },
          {
            id: 'evt-8',
            timestamp: '2024-01-15T10:05:00.200Z',
            title: 'Payment Succeeded',
            description: 'Status: succeeded. Capture confirmed. Settlement process begins',
          },
          {
            id: 'evt-9',
            timestamp: '2024-01-17T10:00:00.000Z',
            title: 'Settlement Complete',
            description: 'Funds transferred to merchant account (2 business days). Ledger balanced',
          },
        ],
      }
    ),

    // Code Block: Idempotent payment creation with Stripe API
    createWidgetInstance(
      'code-block',
      {
        language: 'typescript',
        editable: true,
        showLineNumbers: true,
      },
      { x: 450, y: 200 },
      {
        code: `// Creating a payment with idempotency protection
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function createPayment(
  amount: number,
  currency: string,
  customerId: string,
  orderId: string
) {
  try {
    // Idempotency key prevents duplicate charges
    // Format: order_id to ensure uniqueness per order
    const idempotencyKey = \`order_\${orderId}_payment\`;

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount,
        currency,
        customer: customerId,
        // Automatic confirmation requires payment method
        automatic_payment_methods: {
          enabled: true,
        },
        // Manual capture for delayed fulfillment
        capture_method: 'manual',
        metadata: {
          order_id: orderId,
        },
      },
      {
        // Server caches response for 24 hours
        idempotencyKey,
      }
    );

    // State machine: requires_payment_method
    console.log('PaymentIntent created:', paymentIntent.id);
    console.log('Status:', paymentIntent.status);
    console.log('Client secret:', paymentIntent.client_secret);

    return paymentIntent;
  } catch (error) {
    // Idempotency ensures retries are safe
    if (error instanceof Stripe.errors.StripeIdempotencyError) {
      console.log('Duplicate request detected, returning cached response');
    }
    throw error;
  }
}

// Client-side: Confirm payment with Stripe.js
async function confirmPayment(clientSecret: string) {
  const { error, paymentIntent } = await stripe.confirmPayment({
    clientSecret,
    confirmParams: {
      return_url: 'https://example.com/order/complete',
    },
  });

  if (error) {
    // Handle error (insufficient funds, card declined, etc.)
    console.error('Payment failed:', error.message);
  } else if (paymentIntent.status === 'requires_capture') {
    // Authorization successful, ready for capture
    console.log('Payment authorized:', paymentIntent.id);
  }
}

// Server-side: Capture payment after fulfillment
async function capturePayment(paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.capture(
    paymentIntentId
  );

  // State: succeeded → settlement begins
  console.log('Payment captured:', paymentIntent.status);
}`,
      }
    ),

    // Code Diff: API Evolution from Charges API to PaymentIntents
    createWidgetInstance(
      'code-diff',
      {
        language: 'typescript',
        showLineNumbers: true,
        theme: 'github',
      },
      { x: 900, y: 200 },
      {
        before: `// Legacy Charges API (v1) - immediate capture, no state machine
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createCharge(token, amount) {
  const charge = await stripe.charges.create({
    amount,
    currency: 'usd',
    source: token,
    description: 'Order #1234',
  });

  // Charge created and captured immediately
  // No separation of authorization and capture
  // No built-in SCA (Strong Customer Authentication)
  return charge;
}

// Manual 3D Secure handling required
// No automatic retry logic
// Limited mobile support`,
        after: `// Modern PaymentIntents API (v2) - state machine, SCA support
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function createPaymentIntent(amount: number, orderId: string) {
  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount,
      currency: 'usd',
      capture_method: 'manual', // Separate auth and capture
      // Automatic SCA handling via Payment Element
      automatic_payment_methods: { enabled: true },
      metadata: { order_id: orderId },
    },
    {
      idempotencyKey: \`order_\${orderId}_payment\`,
    }
  );

  // State machine: requires_payment_method → requires_confirmation
  // → processing → requires_capture → succeeded
  // Automatic 3D Secure when required
  // Built-in retry logic for network failures
  // Full mobile SDK support
  return paymentIntent;
}

// Capture later after order fulfillment
await stripe.paymentIntents.capture(paymentIntent.id);`,
      }
    ),

    // Trade-offs Card: Architectural decisions
    createWidgetInstance(
      'tradeoffs-card',
      {
        showMetrics: true,
      },
      { x: 1350, y: 200 },
      {
        decision: 'Stripe Payment Architecture Decisions',
        tradeoffs: [
          {
            aspect: 'Idempotency Strategy',
            option1: 'Client-side deduplication',
            option2: '24-hour server-side cache',
            chosen: 'option2',
            rationale: 'Server controls truth. Prevents duplicate charges even if client retries. Network failures handled gracefully. 24h window balances storage cost with retry safety.',
          },
          {
            aspect: 'Capture Timing',
            option1: 'Immediate capture (simple)',
            option2: 'Manual capture (complex)',
            chosen: 'option2',
            rationale: 'Businesses need auth/capture separation for fulfillment workflows. Hotels, rentals, B2B need to authorize upfront, capture later. 7-day auth window standard.',
          },
          {
            aspect: 'Consistency Model',
            option1: 'Strong consistency',
            option2: 'Eventual consistency',
            chosen: 'option2',
            rationale: 'Distributed system across regions. Local state committed before external API calls (atomic phases). Ledger reconciliation happens asynchronously. 99.99% accuracy within 4 days.',
          },
          {
            aspect: 'Fraud Detection',
            option1: 'Rules-based (deterministic)',
            option2: 'ML-based (probabilistic)',
            chosen: 'option2',
            rationale: 'Network effects from billions of transactions. 92% card recognition rate. Adapts to new fraud patterns. Reduces false positives by 38%.',
          },
          {
            aspect: 'State Machine',
            option1: 'Simple status field',
            option2: 'Explicit state transitions',
            chosen: 'option2',
            rationale: 'Complex payment flows (SCA, async verification). State machine makes transitions explicit and auditable. Enables webhook-based async workflows.',
          },
        ],
      }
    ),

    // Annotation Layer: Explain error scenarios
    createWidgetInstance(
      'annotation-layer',
      {
        allowNewAnnotations: true,
      },
      { x: 450, y: 700 },
      {
        content: 'Payment Error Scenarios',
        annotations: [
          {
            id: 'ann-1',
            startLine: 1,
            endLine: 1,
            text: '⚠️ Network Failure: Idempotency key ensures retry safety. If request times out after server processes, retry with same key returns cached response.',
            author: 'System',
            timestamp: new Date().toISOString(),
          },
          {
            id: 'ann-2',
            startLine: 2,
            endLine: 2,
            text: '⚠️ Insufficient Funds: Caught during authorization. PaymentIntent state: requires_payment_method. Customer can update payment method and retry.',
            author: 'System',
            timestamp: new Date().toISOString(),
          },
          {
            id: 'ann-3',
            startLine: 3,
            endLine: 3,
            text: '⚠️ Fraud Detected: Radar blocks high-risk payments. State: canceled. Merchant receives webhook. Customer sees generic error to prevent gaming the system.',
            author: 'System',
            timestamp: new Date().toISOString(),
          },
          {
            id: 'ann-4',
            startLine: 4,
            endLine: 4,
            text: '⚠️ Authorization Expired: 7-day window passes without capture. PaymentIntent state: canceled. Funds released back to customer. Merchant must create new PaymentIntent.',
            author: 'System',
            timestamp: new Date().toISOString(),
          },
          {
            id: 'ann-5',
            startLine: 5,
            endLine: 5,
            text: '⚠️ SCA Required: 3D Secure needed for European cards. State: requires_action. Client redirects to bank for verification. Returns to requires_capture after approval.',
            author: 'System',
            timestamp: new Date().toISOString(),
          },
        ],
      }
    ),
  ],
  connections: [
    {
      from: { widgetId: 'breadcrumb-instance-1', outputKey: 'currentPath' },
      to: { widgetId: 'timeline-instance-1', inputKey: 'context' },
    },
    {
      from: { widgetId: 'timeline-instance-1', outputKey: 'selectedEvent' },
      to: { widgetId: 'code-block-instance-1', inputKey: 'context' },
    },
    {
      from: { widgetId: 'code-block-instance-1', outputKey: 'code' },
      to: { widgetId: 'code-diff-instance-1', inputKey: 'context' },
    },
    {
      from: { widgetId: 'code-diff-instance-1', outputKey: 'changes' },
      to: { widgetId: 'tradeoffs-card-instance-1', inputKey: 'context' },
    },
    {
      from: { widgetId: 'timeline-instance-1', outputKey: 'events' },
      to: { widgetId: 'annotation-layer-instance-1', inputKey: 'content' },
    },
  ],
};

/**
 * Get the Stripe payment flow
 */
export function getStripePaymentFlow(): WidgetFlow {
  return stripePaymentWalkthroughFlow;
}
