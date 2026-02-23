import type { Walkthrough } from '@/types/walkthrough';

/**
 * Stripe Payment Processing - Interactive Walkthrough
 *
 * A comprehensive 90-120 minute progressive learning experience covering payment processing,
 * idempotency, reliability patterns, state machines, and webhook delivery systems.
 *
 * Sources:
 * - Stripe Engineering Blog: https://stripe.com/blog/engineering
 * - Idempotency in Stripe API: https://stripe.com/docs/api/idempotent_requests
 * - PCI-DSS Compliance: https://stripe.com/docs/security/guide
 * - Patrick McKenzie on Payment Processing
 * - Online Payment Processing talks & production systems
 */

export const stripeWalkthrough: Walkthrough = {
  id: 'stripe-payment-walkthrough',
  slug: 'stripe-payment-processing',
  title: 'Stripe Payment Processing',
  description:
    'Master payment processing, idempotency keys, state machines, and webhook delivery at Stripe scale',
  learningGoals: [
    'Understand payment processing challenges: money, reliability, and compliance',
    'Learn idempotency patterns for handling retries and network failures',
    'Master payment state machines (auth → capture → settle)',
    'Build reliable webhook delivery systems with exponential backoff',
    'Explore PCI-DSS compliance and fraud detection',
  ],
  estimatedMinutes: 105,
  difficulty: 'advanced',
  tags: [
    'payment-processing',
    'distributed-systems',
    'idempotency',
    'state-machines',
    'webhooks',
    'reliability',
    'pci-dss',
  ],
  sources: [
    {
      title: 'Stripe Engineering Blog',
      url: 'https://stripe.com/blog/engineering',
    },
    {
      title: 'Idempotency in Stripe API',
      url: 'https://stripe.com/docs/api/idempotent_requests',
    },
    {
      title: 'PCI-DSS Compliance Guide',
      url: 'https://stripe.com/docs/security/guide',
    },
    {
      title: 'Patrick McKenzie on Payment Processing',
      url: 'https://www.kalzumeus.com/',
    },
  ],

  steps: [
    // ========== PHASE 1: PROBLEM INTRODUCTION (10 min) ==========
    {
      id: 'step-1-intro',
      title: 'The Payment Processing Challenge',
      phase: 'intro',
      estimatedMinutes: 5,
      content: `
# Welcome to Stripe's Payment Processing System

You're building a payment processing platform. You need to handle:
- **$1 trillion+ in annual payment volume** (Stripe's scale in 2025)
- **Millions of businesses** across 50+ countries
- **135+ currencies** and payment methods
- **99.999% uptime** (5.26 minutes of downtime per year)
- **PCI-DSS Level 1 compliance** (strictest security standard)

## The Challenge

Every payment request involves **real money** moving between bank accounts. This creates unique challenges:

1. **Money is precious**: You cannot lose, duplicate, or misplace a penny
2. **Networks are unreliable**: Requests fail, timeout, or duplicate
3. **Regulatory requirements**: PCI-DSS, GDPR, KYC/AML compliance
4. **Fraud**: Bad actors try to steal money every second
5. **Scale**: Process millions of payments per day with <100ms latency

## Why Is This Hard?

Unlike most APIs where retries are safe, payment processing has **financial consequences**:
- Retry a failed charge → User charged twice ❌
- Don't retry a timeout → Sale lost, merchant angry ❌
- Store credit card data → PCI compliance nightmare ❌
- Slow processing → Abandoned carts, lost revenue ❌

## Think First: What Would You Do?

Before we dive into solutions, consider: How would YOU design a payment API that handles real money reliably?
      `,
      widgets: [
        {
          type: 'quiz',
          question: 'What makes payment processing uniquely difficult compared to other APIs?',
          options: [
            {
              id: 'scale',
              text: 'Scale - handling millions of requests per second',
              correct: false,
              explanation:
                'Scale is a challenge, but not the PRIMARY issue. Twitter handles 6000 tweets/sec, Netflix serves 200M users. Stripe\'s peak is ~10K payments/sec, which is manageable. The core difficulty is that payments involve MONEY and cannot be retried naively.',
            },
            {
              id: 'money',
              text: 'Money - cannot lose, duplicate, or misplace transactions',
              correct: true,
              explanation:
                'Exactly! Money makes everything different. If you duplicate a "like" on Twitter, no big deal. If you duplicate a $10,000 payment, you have a VERY angry customer and potential legal liability. Every payment must be processed exactly once, even in the face of network failures, retries, and timeouts.',
            },
            {
              id: 'security',
              text: 'Security - protecting credit card data from hackers',
              correct: false,
              explanation:
                'Security is important, but Stripe sidesteps this by NOT storing raw card data. They use tokenization (card → token) so merchants never touch sensitive data. PCI compliance is hard, but the fundamental challenge is reliability: ensuring exactly-once processing despite network failures.',
            },
            {
              id: 'international',
              text: 'International - supporting 135+ currencies and payment methods',
              correct: false,
              explanation:
                'Multi-currency support is complex but mostly engineering work (exchange rates, payment method integrations). The CORE difficulty is handling money reliably: ensuring a payment is processed exactly once even when networks fail, requests timeout, or clients retry.',
            },
          ],
          multiSelect: false,
        },
      ],
      canvasOperations: [
        {
          type: 'add-node',
          node: {
            id: 'merchant',
            type: 'archComponent',
            data: {
              componentType: 'external_api',
              label: 'Merchant (Your App)',
              config: {},
            },
          },
          highlight: true,
        },
        {
          type: 'add-node',
          node: {
            id: 'stripe-api',
            type: 'archComponent',
            data: {
              componentType: 'api_gateway',
              label: 'Stripe API',
              config: {},
            },
          },
          highlight: true,
        },
        {
          type: 'add-node',
          node: {
            id: 'bank',
            type: 'archComponent',
            data: {
              componentType: 'external_api',
              label: 'Card Network / Bank',
              config: {},
            },
          },
          highlight: true,
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e-merchant-stripe',
            source: 'merchant',
            target: 'stripe-api',
            type: 'archEdge',
            data: { label: 'Charge $100' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e-stripe-bank',
            source: 'stripe-api',
            target: 'bank',
            type: 'archEdge',
            data: { label: 'Authorize payment' },
          },
        },
      ],
      nextCondition: 'click-next',
    },

    {
      id: 'step-2-compliance',
      title: 'Money, Regulations, and Compliance',
      phase: 'intro',
      estimatedMinutes: 5,
      content: `
# The Regulatory Landscape

Payment processing isn't just engineering—it's **heavily regulated**. Here's why:

## PCI-DSS (Payment Card Industry Data Security Standard)

**Level 1 Compliance** (strictest tier for >6M transactions/year):
- ✅ Encrypt card data in transit and at rest
- ✅ Never log full card numbers (PAN)
- ✅ Maintain firewall between cardholder data and public networks
- ✅ Regular penetration testing and security audits
- ✅ Quarterly vulnerability scans by approved vendors

**Why Stripe uses tokenization**:
- Merchant sends card → Stripe returns token \`tok_abc123\`
- Merchant stores token, NOT card data
- Merchant's PCI scope reduced from Level 1 to SAQ-A (simplest)

## KYC/AML (Know Your Customer / Anti-Money Laundering)

Required for financial institutions:
- Verify business identity (Tax ID, incorporation docs)
- Monitor transactions for suspicious patterns
- Report large or unusual transactions to authorities
- Block sanctioned countries/individuals (OFAC list)

## GDPR (General Data Protection Regulation)

For European customers:
- Right to data deletion
- Data must stay in EU (regional data residency)
- Explicit consent for data processing

## The Cost of Non-Compliance

- **PCI violations**: $5,000 to $100,000 per month in fines
- **Data breach**: Average cost $4.45M + reputation damage
- **AML violations**: Billions in fines (HSBC paid $1.9B in 2012)

Stripe handles all of this so merchants don't have to!
      `,
      canvasOperations: [],
      widgets: [
        {
          type: 'comparison-table',
          title: 'Compliance Requirements Comparison',
          columns: ['Standard', 'Scope', 'Key Requirements', 'Penalty for Violation'],
          rows: [
            {
              label: 'PCI-DSS Level 1',
              values: [
                'Payment processors',
                'Encrypt card data, no logging PANs, firewalls, audits',
                '$5K-$100K/month fines',
              ],
            },
            {
              label: 'KYC/AML',
              values: [
                'Financial institutions',
                'Verify identity, monitor suspicious activity, OFAC checks',
                'Up to $1B+ fines',
              ],
            },
            {
              label: 'GDPR',
              values: [
                'EU customer data',
                'Data deletion rights, EU residency, explicit consent',
                '4% annual revenue or €20M',
              ],
            },
          ],
        },
        {
          type: 'quiz',
          question: 'Why does Stripe use tokenization (card → token) instead of letting merchants store credit cards directly?',
          options: [
            {
              id: 'security',
              text: 'Security - tokens are more secure than cards',
              correct: false,
              explanation:
                'Tokens aren\'t inherently more secure. A stolen token can still be used to charge customers. The REAL reason is PCI compliance reduction for merchants.',
            },
            {
              id: 'pci',
              text: 'PCI Compliance - merchants avoid storing sensitive card data',
              correct: true,
              explanation:
                'Exactly! If you store raw card data (PAN), you need PCI Level 1 compliance: expensive audits, security infrastructure, quarterly scans. With tokenization, the merchant only stores a token. Stripe holds the card data and handles PCI compliance. This reduces merchant compliance from Level 1 to SAQ-A (simple self-assessment).',
            },
            {
              id: 'portability',
              text: 'Portability - tokens work across different payment processors',
              correct: false,
              explanation:
                'Tokens are processor-specific! A Stripe token doesn\'t work with PayPal. The reason for tokenization is to keep card data OUT of merchant systems, reducing their PCI scope dramatically.',
            },
            {
              id: 'performance',
              text: 'Performance - tokens are faster to process than cards',
              correct: false,
              explanation:
                'Processing time is similar. Both require API calls to Stripe. The benefit is PCI compliance reduction: merchants don\'t need expensive security infrastructure if they never touch raw card data.',
            },
          ],
          multiSelect: false,
        },
      ],
      nextCondition: 'click-next',
    },

    // ========== PHASE 2: NAIVE APPROACH (15 min) ==========
    {
      id: 'step-3-naive-api',
      title: 'The Naive Payment API',
      phase: 'naive',
      estimatedMinutes: 7,
      content: `
# Let's Build a Simple Payment API

Most engineers start here: A straightforward POST endpoint that charges a card.

## The Naive Design

\`\`\`http
POST /v1/charges
{
  "amount": 10000,  // $100.00 in cents
  "currency": "usd",
  "source": "tok_visa",  // Card token
  "description": "Order #12345"
}
\`\`\`

**Server-side logic**:
1. Receive request
2. Call bank/card network to authorize charge
3. Save transaction to database
4. Return success response

Seems simple, right? **What could go wrong?**

## The Problem: Network Failures

Real-world networks are unreliable:
- **Request fails mid-flight**: Merchant never gets response
- **Response lost after charge succeeds**: Bank charged, but merchant thinks it failed
- **Timeout**: Did the charge happen? No idea!

## What Happens Next?

Merchant's natural response: **"I'll just retry!"**

But retrying a payment request can **charge the customer twice**:
1. First request: Charge succeeds, response lost
2. Merchant retries: Second charge succeeds
3. Customer charged $200 instead of $100 ❌

This is called the **"exactly-once" problem**: How do you ensure an operation happens EXACTLY ONCE, even when the network is unreliable?
      `,
      widgets: [
        {
          type: 'code-block',
          title: 'Naive Payment Processing (Broken)',
          language: 'javascript',
          code: `// WARNING: This code has a critical bug!
async function processPayment(amount, cardToken) {
  try {
    // 1. Call bank to authorize charge
    const chargeResult = await stripe.charges.create({
      amount: amount,
      currency: 'usd',
      source: cardToken,
    });

    // 2. Save to database
    await db.payments.insert({
      id: chargeResult.id,
      amount: amount,
      status: 'succeeded',
    });

    // 3. Return success
    return { success: true, chargeId: chargeResult.id };

  } catch (error) {
    // ❌ PROBLEM: What if charge succeeded but DB insert failed?
    // ❌ Merchant thinks payment failed, but customer was charged!
    // ❌ If merchant retries, customer gets double-charged!
    console.error('Payment failed:', error);
    return { success: false, error: error.message };
  }
}`,
          highlights: [19, 20, 21, 22],
        },
        {
          type: 'quiz',
          mode: 'spot-bug',
          question:
            'Which line in this retry logic causes the double-charge bug when the network fails?',
          code: `async function retryPayment(amount, cardToken) {
  let attempts = 0;
  while (attempts < 3) {
    try {
      const result = await stripe.charges.create({
        amount: amount,
        currency: 'usd',
        source: cardToken,
      });
      return result; // Success
    } catch (error) {
      attempts++;
      console.log(\`Attempt \${attempts} failed, retrying...\`);
      // Retry immediately
    }
  }
  throw new Error('Payment failed after 3 attempts');
}`,
          language: 'javascript',
          buggyLines: [5, 6, 7, 8, 9],
          explanation:
            'Lines 5-9 create a NEW charge on every retry without using an idempotency key. If the first request succeeds but the response is lost (network timeout), the retry will create a second charge. The fix: use the same idempotency key for all retries of the same payment attempt.',
        },
        {
          type: 'scale-explorer',
          title: 'Double-Charge Risk at Scale',
          parameter: {
            name: 'Transactions per second',
            min: 1,
            max: 100000,
            unit: 'txn/s',
            scale: 'log',
          },
          metrics: [
            {
              name: 'Double-charge probability',
              unit: '%',
              compute: '(1 - Math.pow(0.9999, n)) * 100',
              thresholds: {
                warning: 1,
                critical: 5,
              },
            },
            {
              name: 'Financial exposure per hour',
              unit: '$',
              compute: 'n * 3600 * 50 * (1 - Math.pow(0.9999, n))',
              thresholds: {
                warning: 1000,
                critical: 10000,
              },
            },
            {
              name: 'Customer complaints per day',
              unit: 'complaints',
              compute: 'n * 86400 * (1 - Math.pow(0.9999, n)) * 0.1',
              thresholds: {
                warning: 10,
                critical: 100,
              },
            },
          ],
          insights: [
            {
              triggerValue: 100,
              message:
                'At 100 txn/s: ~1% chance of occasional duplicates. Customers will notice.',
            },
            {
              triggerValue: 1000,
              message:
                'At 1,000 txn/s: ~10% duplicate rate. Expect daily customer complaints and chargebacks.',
            },
            {
              triggerValue: 10000,
              message:
                'At 10,000 txn/s: 63%+ duplicate rate. Regulatory risk, massive financial exposure. Idempotency is non-negotiable.',
            },
          ],
        },
        {
          type: 'timeline',
          title: 'What Goes Wrong: The Double-Charge Scenario',
          events: [
            {
              label: '1. Merchant calls payment API',
              description: 'POST /charges { amount: 10000 }',
              nodeIds: ['merchant'],
            },
            {
              label: '2. Stripe charges bank - SUCCESS',
              description: 'Bank authorizes $100 charge',
              nodeIds: ['stripe-api', 'bank'],
            },
            {
              label: '3. Response lost (network failure)',
              description: 'HTTP response times out or drops',
              nodeIds: ['stripe-api', 'merchant'],
            },
            {
              label: '4. Merchant thinks it failed - RETRIES',
              description: 'No response received, assumes failure, sends another POST',
              nodeIds: ['merchant'],
            },
            {
              label: '5. Second charge succeeds',
              description: 'Customer charged $200 total instead of $100 ❌',
              nodeIds: ['stripe-api', 'bank'],
            },
          ],
        },
        {
          type: 'quiz',
          question: 'In the naive implementation, what happens if the charge succeeds at the bank but the database insert fails?',
          options: [
            {
              id: 'rollback',
              text: 'The charge is automatically rolled back (like a database transaction)',
              correct: false,
              explanation:
                'Banks don\'t support rollbacks like databases do! Once a charge is authorized, you need an explicit REFUND API call (separate transaction). There\'s no distributed transaction coordinator between Stripe and banks.',
            },
            {
              id: 'charged-no-record',
              text: 'Customer is charged, but there\'s no record in the database',
              correct: true,
              explanation:
                'Exactly! This is the worst outcome: The customer was charged (money left their account), but your database has no record. The merchant thinks the payment failed and might retry (double charge) or tell the customer "payment failed" (customer sees charge on credit card but merchant says order failed). This violates exactly-once semantics.',
            },
            {
              id: 'retry',
              text: 'The system automatically retries the database insert',
              correct: false,
              explanation:
                'Even if you retry the DB insert, you still don\'t know if the charge succeeded at the bank! The charge might have succeeded (customer charged) but the response was lost. You need a different approach: idempotency keys.',
            },
            {
              id: 'no-problem',
              text: 'No problem - the API returns an error so the charge never happened',
              correct: false,
              explanation:
                'Wrong! The charge DID happen at the bank. The error is from the DATABASE insert, which happens AFTER the charge. Money has already left the customer\'s account. This is the split-brain problem.',
            },
          ],
          multiSelect: false,
        },
      ],
      canvasOperations: [
        {
          type: 'add-node',
          node: {
            id: 'database',
            type: 'archComponent',
            data: {
              componentType: 'postgres',
              label: 'Database',
              config: {},
            },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e-stripe-db',
            source: 'stripe-api',
            target: 'database',
            type: 'archEdge',
            data: { label: 'Save transaction' },
          },
        },
        {
          type: 'highlight',
          nodeIds: ['bank', 'database'],
          duration: 5000,
          color: '#ef4444',
        },
      ],
      nextCondition: 'click-next',
    },

    {
      id: 'step-4-exactly-once',
      title: 'The Exactly-Once Problem',
      phase: 'naive',
      estimatedMinutes: 8,
      content: `
# Exactly-Once Semantics

The core challenge in distributed systems: **How do you guarantee an operation happens exactly once?**

## The Three Failure Modes

1. **At-Most-Once**: Operation happens 0 or 1 times
   - Never retry on failure
   - Risk: Lost payments, angry customers ❌

2. **At-Least-Once**: Operation happens 1+ times
   - Always retry on failure
   - Risk: Double charges, angry customers ❌

3. **Exactly-Once**: Operation happens exactly 1 time ✅
   - Even with network failures, retries, timeouts
   - This is what payment processing REQUIRES

## Why Is This Hard?

Consider this timeline:

\`\`\`
Client: "Charge $100"
  ↓
[Network]
  ↓
Server: Charges bank successfully
  ↓
[Network failure - response lost]
  ↓
Client: "Hmm, no response. Did it work? Should I retry?"
\`\`\`

**The client cannot tell the difference between**:
- Payment failed (should retry)
- Payment succeeded but response lost (should NOT retry)

## Real-World Impact

- **Shopify 2016**: Billing bug charged some merchants 97 times in a single day
- **Apple 2015**: Users charged multiple times for single App Store purchases
- **Every payment processor**: Handles duplicate requests daily

Stripe processes **millions of duplicate/retry requests per day**. They MUST handle this correctly.

## The Solution Preview

Stripe's approach: **Idempotency Keys**

Clients send a unique key with each request. Stripe guarantees:
- Same key = same result (even on retry)
- Never charge twice for the same key
- Safe to retry any request

We'll build this in the next phase!
      `,
      widgets: [
        {
          type: 'tradeoffs',
          title: 'Retry Strategies for Payment APIs',
          decision: 'How should we handle failed/timeout payment requests?',
          mode: 'decision',
          scenario:
            'A customer\'s payment request times out after 30 seconds. Your server called Stripe\'s API, but you never received a response. The customer is waiting to see if their order succeeded. What do you do?',
          constraints: [
            'Customer must not be double-charged',
            'Payment must eventually succeed if the first attempt worked',
            'System must handle network partitions and split-brain scenarios',
          ],
          options: [
            {
              label: 'Never Retry (At-Most-Once)',
              pros: ['Simple', 'No risk of double-charging', 'Minimal server load'],
              cons: [
                'Lost revenue (transient failures = failed sales)',
                'Poor user experience (users must manually retry)',
                'High abandonment rate (~70% won\'t retry)',
              ],
              consequence:
                'Customer sees "Payment Failed" even though they might have been charged. They check their credit card statement tomorrow and see a charge. They call support angry, dispute the charge, and never buy from you again.',
            },
            {
              label: 'Always Retry (At-Least-Once)',
              pros: [
                'Maximizes successful payments',
                'Good for non-payment APIs (reading data)',
                'Handles transient network failures',
              ],
              cons: [
                'Risk of double-charging customers',
                'Financial liability + customer trust lost',
                'Chargebacks and refund costs',
              ],
              consequence:
                'You retry blindly. The first request actually succeeded (response was just lost). Now the customer is charged $200 instead of $100. They call their bank to dispute. You lose the chargeback, pay a $15 fee, and the customer leaves a 1-star review.',
            },
            {
              label: 'Idempotent Retries (Exactly-Once)',
              pros: [
                'Safe to retry any request',
                'Customer never double-charged',
                'Handles network failures gracefully',
                'Industry standard (Stripe, PayPal, Square)',
              ],
              cons: [
                'Requires idempotency infrastructure',
                'Servers must cache request/response',
                'More complex implementation',
              ],
              consequence:
                'You retry with the same idempotency key. Stripe detects the duplicate and returns the original result (success or failure). Customer charged exactly once. Order completes successfully. Everyone is happy.',
              recommended: true,
            },
          ],
        },
        {
          type: 'quiz',
          question: 'A merchant sends a charge request, doesn\'t receive a response (timeout), and wants to retry. Without idempotency, what should they do?',
          options: [
            {
              id: 'retry-immediately',
              text: 'Retry immediately - maximize chances of success',
              correct: false,
              explanation:
                'Dangerous! If the first request succeeded but response was lost, retry will double-charge. You can\'t distinguish between "failed" and "succeeded but response lost" without idempotency.',
            },
            {
              id: 'check-first',
              text: 'Check if the charge already succeeded before retrying',
              correct: false,
              explanation:
                'This seems logical but has a race condition: You check (not found) → meanwhile first charge succeeds → you retry (double charge). Also, if you don\'t have an ID from the first request, what do you query for?',
            },
            {
              id: 'give-up',
              text: 'Give up - assume failure and tell user to try again',
              correct: false,
              explanation:
                'Safest for avoiding double-charges, but terrible UX. Most users won\'t retry (70%+ abandonment). Also, if the charge DID succeed, customer will see it on their credit card and dispute it.',
            },
            {
              id: 'idempotency',
              text: 'Use idempotency keys - retry with same key guarantees same result',
              correct: true,
              explanation:
                'Correct! With idempotency keys, the merchant sends the same unique key on retry. Stripe detects it\'s a duplicate and returns the ORIGINAL response (whether success or failure). This makes retries safe: same key = same outcome. No double charges possible.',
            },
          ],
          multiSelect: false,
        },
      ],
      canvasOperations: [],
      nextCondition: 'click-next',
    },

    // ========== PHASE 3: IDEMPOTENCY & RELIABILITY (20 min) ==========
    {
      id: 'step-5-idempotency-keys',
      title: 'Idempotency Keys',
      phase: 'complexity',
      estimatedMinutes: 7,
      content: `
# Solution: Idempotency Keys

An **idempotency key** is a unique identifier (UUID) that the client generates and includes with each request.

## How It Works

\`\`\`http
POST /v1/charges
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000

{
  "amount": 10000,
  "currency": "usd",
  "source": "tok_visa"
}
\`\`\`

**Stripe's guarantee**: Requests with the same idempotency key produce the same result.

## Server-Side Implementation

\`\`\`
1. Receive request with key "abc-123"
2. Check cache: Have we seen "abc-123" before?
   - YES: Return cached response (don't reprocess)
   - NO: Continue...
3. Begin transaction
4. Save idempotency key to DB (with lock)
5. Process payment (charge bank)
6. Save result to DB
7. Cache key → result mapping
8. Commit transaction
9. Return response
\`\`\`

## Benefits

✅ **Safe retries**: Same key = same result, no double-charging
✅ **Network resilience**: Client can retry any timeout
✅ **Crash recovery**: Server restarts don't cause duplicate charges
✅ **Client simplicity**: Just generate UUID once, use for all retries

## Stripe's Implementation

- Idempotency keys expire after **24 hours**
- Keys are scoped to **live vs test mode** (same key in test ≠ same in live)
- Cached responses include **full HTTP response** (status, headers, body)
- Locks prevent race conditions (two requests with same key at same time)
      `,
      widgets: [
        {
          type: 'code-block',
          title: 'Idempotent Payment Processing (Correct)',
          language: 'javascript',
          code: `async function processPaymentIdempotent(amount, cardToken, idempotencyKey) {
  // 1. Check if we've already processed this key
  const cached = await cache.get(\`idem:\${idempotencyKey}\`);
  if (cached) {
    console.log('Idempotency key seen before, returning cached result');
    return cached; // Return previous result without reprocessing ✅
  }

  // 2. Acquire lock on idempotency key (prevent concurrent processing)
  const lock = await db.acquireLock(\`idem:\${idempotencyKey}\`, timeout: 30);
  if (!lock) {
    throw new Error('Another request with this key is in progress');
  }

  try {
    // 3. Double-check cache (might have been processed while waiting for lock)
    const recheck = await cache.get(\`idem:\${idempotencyKey}\`);
    if (recheck) return recheck;

    // 4. Process payment (this is the ONLY place we charge the bank)
    const chargeResult = await stripe.charges.create({
      amount: amount,
      currency: 'usd',
      source: cardToken,
    });

    // 5. Save to database
    await db.payments.insert({
      id: chargeResult.id,
      idempotency_key: idempotencyKey,
      amount: amount,
      status: 'succeeded',
    });

    // 6. Cache result (key → response mapping)
    const response = { success: true, chargeId: chargeResult.id };
    await cache.set(\`idem:\${idempotencyKey}\`, response, ttl: 86400); // 24h

    return response;

  } finally {
    // 7. Release lock
    await db.releaseLock(\`idem:\${idempotencyKey}\`);
  }
}`,
          highlights: [2, 3, 4, 5, 6, 9, 10, 36, 37],
        },
        {
          type: 'timeline',
          title: 'Idempotent Request Flow (with Retry)',
          events: [
            {
              label: '1. First attempt (key: abc-123)',
              description: 'Merchant sends charge request with idempotency key',
              nodeIds: ['merchant', 'stripe-api'],
            },
            {
              label: '2. Stripe processes and charges bank',
              description: 'Key not in cache, process payment, save to DB',
              nodeIds: ['stripe-api', 'bank', 'database'],
            },
            {
              label: '3. Response lost (network timeout)',
              description: 'Payment succeeded, but merchant never gets HTTP response',
              nodeIds: ['stripe-api', 'merchant'],
            },
            {
              label: '4. Merchant retries (same key: abc-123)',
              description: 'Sends identical request with SAME idempotency key',
              nodeIds: ['merchant', 'stripe-api'],
            },
            {
              label: '5. Stripe finds cached result',
              description: 'Key "abc-123" in cache → return original response ✅',
              nodeIds: ['stripe-api'],
            },
            {
              label: '6. Merchant receives success',
              description: 'Customer charged ONCE, merchant gets result. Exactly-once achieved!',
              nodeIds: ['merchant'],
            },
          ],
        },
        {
          type: 'quiz',
          question: 'Why does Stripe cache idempotency keys for 24 hours instead of forever?',
          options: [
            {
              id: 'storage',
              text: 'Storage cost - caching forever would require infinite storage',
              correct: false,
              explanation:
                'Storage is cheap (~$0.023/GB/month on S3). Even with millions of requests/day, caching forever would cost <$1000/month. The real reason is different.',
            },
            {
              id: 'stale',
              text: 'Avoid stale responses - business logic might change over time',
              correct: true,
              explanation:
                'Correct! After 24 hours, it\'s reasonable to assume the client has given up or the transaction context has changed. If a client retries after 24 hours with the same key, it\'s likely a NEW payment intent (e.g., user manually re-entered order). Returning a week-old response could be confusing or incorrect if prices/inventory changed.',
            },
            {
              id: 'performance',
              text: 'Performance - lookups get slower as cache grows',
              correct: false,
              explanation:
                'Hash table lookups are O(1) regardless of size. Even with billions of keys, Redis/Memcached lookup takes <1ms. Performance isn\'t the issue.',
            },
            {
              id: 'compliance',
              text: 'PCI-DSS compliance requires deleting payment data after 24h',
              correct: false,
              explanation:
                'Idempotency cache stores request/response metadata, not raw card data. PCI doesn\'t mandate 24h deletion for this type of data. The reason is business logic: after 24h, a retry is likely a NEW payment.',
            },
          ],
          multiSelect: false,
        },
      ],
      canvasOperations: [
        {
          type: 'add-node',
          node: {
            id: 'redis-idem',
            type: 'archComponent',
            data: {
              componentType: 'redis',
              label: 'Redis (Idempotency Cache)',
              config: { description: '24h TTL on keys' },
            },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e-stripe-redis',
            source: 'stripe-api',
            target: 'redis-idem',
            type: 'archEdge',
            data: { label: 'Check/set key' },
          },
        },
      ],
      nextCondition: 'click-next',
    },

    {
      id: 'step-6-retry-logic',
      title: 'Retry Logic and Exponential Backoff',
      phase: 'complexity',
      estimatedMinutes: 6,
      content: `
# Client-Side: Retry Logic

Now that servers support idempotency, clients can safely retry! But **how** should they retry?

## Naive Retry (Bad)

\`\`\`javascript
// ❌ DON'T DO THIS
for (let i = 0; i < 10; i++) {
  try {
    return await chargePayment();
  } catch (err) {
    // Retry immediately, 10 times
  }
}
\`\`\`

**Problems**:
- Hammers server with requests (10 requests in <1 second)
- Network timeouts = all retries timeout (wasted effort)
- Amplifies load during outages (thundering herd)

## Exponential Backoff (Good)

Wait progressively longer between retries:

\`\`\`
Attempt 1: 0ms (immediate)
Attempt 2: 1s (2^0 = 1 second)
Attempt 3: 2s (2^1 = 2 seconds)
Attempt 4: 4s (2^2 = 4 seconds)
Attempt 5: 8s (2^3 = 8 seconds)
...
Max: 60s (cap at 1 minute)
\`\`\`

**With jitter** (random factor to prevent synchronized retries):
\`\`\`
delay = min(MAX_DELAY, base * 2^attempt) * (0.5 + random(0, 0.5))
\`\`\`

## Why Exponential Backoff?

- **Transient errors** (network blip): Immediate retry works
- **Server overload**: Backing off gives server time to recover
- **Rate limiting**: Avoids triggering rate limit repeatedly
- **Thundering herd**: Jitter spreads out retries from many clients

## Stripe's Recommendation

Stripe's official SDKs implement:
- **Max 3 retries** for network errors
- **Exponential backoff** with jitter
- **Idempotency keys** auto-generated
- **Only retry safe errors** (network issues, 429, 500-series)
- **Never retry 4xx** errors (client mistake, won't succeed on retry)
      `,
      widgets: [
        {
          type: 'code-block',
          title: 'Proper Retry Logic with Exponential Backoff',
          language: 'javascript',
          code: `const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second
const MAX_DELAY = 60000; // 1 minute

async function chargeWithRetry(amount, cardToken) {
  const idempotencyKey = generateUUID(); // Same key for all retries

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await stripe.charges.create({
        amount,
        source: cardToken,
      }, {
        idempotencyKey, // ✅ Same key on every retry
      });

      return result; // Success!

    } catch (error) {
      // Check if error is retryable
      if (!isRetryable(error)) {
        throw error; // 400-series = client error, don't retry
      }

      // Last attempt failed
      if (attempt === MAX_RETRIES) {
        throw new Error(\`Payment failed after \${MAX_RETRIES} retries\`);
      }

      // Calculate backoff with jitter
      const exponentialDelay = Math.min(
        MAX_DELAY,
        BASE_DELAY * Math.pow(2, attempt)
      );
      const jitter = 0.5 + Math.random() * 0.5; // 0.5 to 1.0
      const delay = exponentialDelay * jitter;

      console.log(\`Retry \${attempt + 1} after \${delay}ms\`);
      await sleep(delay);
    }
  }
}

function isRetryable(error) {
  // Network errors: Always retry
  if (error.type === 'network_error') return true;

  // 429 Rate Limit: Retry with backoff
  if (error.statusCode === 429) return true;

  // 500-series: Server error, retry
  if (error.statusCode >= 500) return true;

  // 400-series: Client error, don't retry (bad request, auth failed, etc.)
  return false;
}`,
          highlights: [5, 13, 30, 31, 32, 33, 34, 44, 47, 50, 53],
        },
        {
          type: 'tradeoffs',
          title: 'Retry Strategy Trade-offs',
          decision: 'How should clients retry failed payment requests?',
          options: [
            {
              label: 'Immediate Retry (No Backoff)',
              pros: ['Fast recovery for transient errors', 'Simple implementation', 'Low latency'],
              cons: [
                'Amplifies load during outages (thundering herd)',
                'Wastes resources if error persists',
                'Can trigger rate limits',
              ],
            },
            {
              label: 'Fixed Delay (e.g., 5s between retries)',
              pros: ['Predictable timing', 'Easy to understand', 'Prevents thundering herd'],
              cons: [
                'Too slow for transient errors',
                'Too fast for long outages',
                'All clients retry at same interval (synchronized spike)',
              ],
            },
            {
              label: 'Exponential Backoff + Jitter',
              pros: [
                'Fast recovery for transient errors (1s first retry)',
                'Backs off for persistent errors (up to 60s)',
                'Jitter prevents thundering herd',
                'Industry standard (AWS, Stripe, Google)',
              ],
              cons: [
                'More complex implementation',
                'Harder to predict total retry time',
                'Requires tuning (max retries, base delay, max delay)',
              ],
            },
          ],
        },
      ],
      canvasOperations: [],
      nextCondition: 'click-next',
    },

    {
      id: 'step-7-state-machine',
      title: 'Payment State Machine',
      phase: 'complexity',
      estimatedMinutes: 7,
      content: `
# Beyond Simple Success/Failure: The Payment Lifecycle

Real payments aren't just "succeeded" or "failed". They go through **multiple states**:

## The State Machine

\`\`\`
pending → requires_action → processing → succeeded
   ↓           ↓                ↓
failed      canceled         refunded
\`\`\`

## State Definitions

**pending**: Payment created, waiting to be processed
- Example: User submitted checkout form
- Actions: Can cancel

**requires_action**: Waiting for user input
- Example: 3D Secure authentication popup
- Actions: User completes auth OR times out (fails)

**processing**: Sent to bank, waiting for response
- Example: Authorization request in flight
- Actions: None (wait for bank)

**succeeded**: Bank approved, money authorized
- Example: Charge will appear on customer's card statement
- Actions: Can refund (but can't cancel)

**failed**: Bank declined or error occurred
- Example: Insufficient funds, fraud suspected
- Actions: None (terminal state)

**canceled**: Merchant canceled before completion
- Example: Order canceled before payment processed
- Actions: None (terminal state)

**refunded**: Money returned to customer
- Example: Product returned, merchant issued refund
- Actions: None (terminal state)

## Why State Machines Matter

- **Clarity**: Everyone understands payment lifecycle
- **Idempotency**: State transitions are deterministic
- **Error handling**: Know what actions are valid in each state
- **Auditing**: Track payment history for compliance
      `,
      widgets: [
        {
          type: 'code-block',
          title: 'Payment State Machine Implementation',
          language: 'javascript',
          code: `// State transition rules
const VALID_TRANSITIONS = {
  pending: ['requires_action', 'processing', 'failed', 'canceled'],
  requires_action: ['processing', 'failed', 'canceled'],
  processing: ['succeeded', 'failed'],
  succeeded: ['refunded'], // Can only refund after success
  failed: [], // Terminal state
  canceled: [], // Terminal state
  refunded: [], // Terminal state
};

async function transitionPaymentState(paymentId, newState) {
  const payment = await db.payments.findById(paymentId);
  const currentState = payment.status;

  // Validate transition
  if (!VALID_TRANSITIONS[currentState].includes(newState)) {
    throw new Error(
      \`Invalid transition: \${currentState} → \${newState}\`
    );
  }

  // Idempotent: If already in target state, return success
  if (currentState === newState) {
    return payment; // No-op
  }

  // Perform state-specific actions
  if (newState === 'processing') {
    await sendToBank(payment);
  } else if (newState === 'succeeded') {
    await ledger.recordDebit(payment.amount); // Double-entry bookkeeping
    await webhooks.send('payment.succeeded', payment);
  } else if (newState === 'refunded') {
    await bank.refund(payment.chargeId);
    await ledger.recordCredit(payment.amount);
    await webhooks.send('payment.refunded', payment);
  }

  // Update state in database (atomic operation)
  await db.payments.update(paymentId, {
    status: newState,
    updated_at: Date.now(),
  });

  return payment;
}`,
          highlights: [16, 17, 18, 19, 20, 23, 24, 25],
        },
        {
          type: 'quiz',
          mode: 'fill-blank',
          question:
            'Complete the missing state transition logic for the payment state machine. Fill in the correct state names where payments transition between stages.',
          code: `async function processPaymentFlow(paymentId) {
  // 1. Start in pending state
  let payment = await transitionPaymentState(paymentId, 'pending');

  // 2. Send to bank for processing
  payment = await transitionPaymentState(paymentId, _____);

  const bankResponse = await waitForBankResponse(paymentId);

  // 3. Handle bank response
  if (bankResponse.approved) {
    payment = await transitionPaymentState(paymentId, _____);
    await notifyMerchant(payment);
  } else {
    payment = await transitionPaymentState(paymentId, _____);
  }

  // 4. If customer requests refund after success
  if (payment.status === 'succeeded' && customerRequestedRefund) {
    payment = await transitionPaymentState(paymentId, _____);
  }

  return payment;
}`,
          language: 'javascript',
          blanks: [
            {
              lineNumber: 6,
              hint: 'What state comes after pending when you send a payment to the bank?',
              answer: 'processing',
              acceptAlternatives: ["'processing'"],
            },
            {
              lineNumber: 11,
              hint: 'What state indicates the bank approved the payment?',
              answer: 'succeeded',
              acceptAlternatives: ["'succeeded'"],
            },
            {
              lineNumber: 14,
              hint: 'What state indicates the bank declined the payment?',
              answer: 'failed',
              acceptAlternatives: ["'failed'"],
            },
            {
              lineNumber: 19,
              hint: 'What is the only valid transition from succeeded state?',
              answer: 'refunded',
              acceptAlternatives: ["'refunded'"],
            },
          ],
        },
        {
          type: 'quiz',
          question: 'A payment is in "succeeded" state. What transitions are allowed?',
          options: [
            {
              id: 'cancel',
              text: 'succeeded → canceled (merchant cancels order)',
              correct: false,
              explanation:
                'You can\'t cancel a succeeded payment! The money has already been authorized/charged. If the merchant wants to reverse it, they must issue a REFUND (succeeded → refunded). Cancellation is only valid before the payment is processed.',
            },
            {
              id: 'refunded',
              text: 'succeeded → refunded (merchant issues refund)',
              correct: true,
              explanation:
                'Correct! This is the ONLY valid transition from succeeded. Once a payment succeeds, the money is charged. The only way to reverse it is a refund (which creates a separate credit transaction at the bank). Stripe\'s API enforces this with the /refunds endpoint.',
            },
            {
              id: 'failed',
              text: 'succeeded → failed (bank declines after approval)',
              correct: false,
              explanation:
                'Once a payment reaches "succeeded", it can\'t fail. The bank already approved it. However, a succeeded payment CAN be disputed/charged-back later (customer claims fraud), but that\'s a different state flow (disputed, not failed).',
            },
            {
              id: 'processing',
              text: 'succeeded → processing (retry authorization)',
              correct: false,
              explanation:
                'You can\'t go backwards in the state machine! "succeeded" is after "processing". The payment already processed successfully. If you want to charge again, create a NEW payment (separate transaction).',
            },
          ],
          multiSelect: false,
        },
      ],
      canvasOperations: [
        {
          type: 'add-node',
          node: {
            id: 'state-machine',
            type: 'archComponent',
            data: {
              componentType: 'worker',
              label: 'State Machine Engine',
              config: {},
            },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e-api-state',
            source: 'stripe-api',
            target: 'state-machine',
            type: 'archEdge',
            data: { label: 'Transition states' },
          },
        },
      ],
      nextCondition: 'click-next',
    },

    // ========== PHASE 4: REAL STRIPE ARCHITECTURE (25 min) ==========
    {
      id: 'step-8-full-payment-flow',
      title: 'Complete Payment Flow: Auth → Capture → Settle',
      phase: 'real',
      estimatedMinutes: 8,
      content: `
# The Real Payment Lifecycle (3 Stages)

Most people think a "charge" is a single action. Actually, there are **three separate steps**:

## 1. Authorization (Hold Funds)

Bank **reserves** the amount on customer's card but doesn't transfer money yet.

- Amount: $100 held
- Customer: Sees "pending" charge on statement
- Merchant: Has 7-day window to capture

**Use case**: E-commerce orders where you need to verify stock/fraud before shipping

## 2. Capture (Transfer Funds)

Merchant confirms they want the money. Bank **transfers** funds from customer → merchant.

- Amount: $100 captured
- Customer: "Pending" becomes "posted" on statement
- Merchant: Money deposited (minus fees) in 2-3 business days

**Use case**: Item shipped, ready to collect payment

## 3. Settlement (Payout to Merchant)

Stripe **pays out** to merchant's bank account.

- Amount: $97 ($100 - $3 Stripe fees)
- Merchant: Funds available in bank account
- Timing: Configurable (daily, weekly, monthly)

**Why separate steps?**

- **Fraud prevention**: Authorize first, capture after fraud check
- **Inventory verification**: Hold funds while confirming stock
- **Flexible cancellation**: Can void authorization (full refund, no fees) before capture
- **Partial capture**: Authorize $100, capture $80 (final price after discounts)

## Stripe's Two Modes

**1. Automatic Capture (Default)**:
\`\`\`
POST /v1/charges → Authorize AND capture in one step
\`\`\`

**2. Separate Auth and Capture**:
\`\`\`
POST /v1/charges { capture: false } → Authorize only
POST /v1/charges/:id/capture → Capture later
\`\`\`
      `,
      widgets: [
        {
          type: 'timeline',
          title: 'Payment Lifecycle: Authorization → Capture → Settlement',
          interactive: true,
          events: [
            {
              label: 'Day 0 - Authorization',
              description: 'Customer checks out. Stripe authorizes $100 (hold on card). 7-day window starts.',
              nodeIds: ['merchant', 'stripe-api', 'bank'],
              predictPrompt: 'Does Stripe charge the customer\'s card immediately during authorization?',
              predictOptions: [
                {
                  text: 'Yes - Money is transferred from customer to merchant',
                  correct: false,
                },
                {
                  text: 'No - Authorization only places a hold on the card',
                  correct: true,
                },
                {
                  text: 'Depends - Only for high-risk merchants',
                  correct: false,
                },
              ],
            },
            {
              label: 'Day 0 - Fraud Check',
              description: 'Merchant runs fraud analysis (Stripe Radar). Order flagged for manual review.',
              nodeIds: ['stripe-api'],
              predictPrompt: 'Can the merchant cancel the payment at this point without any fees?',
              predictOptions: [
                {
                  text: 'No - Authorization fees are non-refundable',
                  correct: false,
                },
                {
                  text: 'Yes - Can void the authorization with no fees',
                  correct: true,
                },
                {
                  text: 'Partial - Only get back 50% of the fee',
                  correct: false,
                },
              ],
            },
            {
              label: 'Day 1 - Capture',
              description: 'Order approved, item ships. Merchant captures $100 (transfer funds).',
              nodeIds: ['merchant', 'stripe-api', 'bank'],
              predictPrompt: 'What happens if capture fails within the 7-day authorization window?',
              predictOptions: [
                {
                  text: 'Customer is charged anyway (authorization guarantee)',
                  correct: false,
                },
                {
                  text: 'Authorization expires and hold is released (no charge)',
                  correct: true,
                },
                {
                  text: 'Stripe automatically retries capture every day',
                  correct: false,
                },
              ],
            },
            {
              label: 'Day 3 - Settlement',
              description: 'Stripe pays out $97 to merchant bank account (2-day rolling payout).',
              nodeIds: ['stripe-api', 'merchant'],
              predictPrompt: 'Can the customer dispute/chargeback the payment after settlement?',
              predictOptions: [
                {
                  text: 'No - Settlement is final and irreversible',
                  correct: false,
                },
                {
                  text: 'Yes - Customers can dispute up to 120 days later',
                  correct: true,
                },
                {
                  text: 'Only for fraud - Not for "product not received"',
                  correct: false,
                },
              ],
            },
          ],
        },
        {
          type: 'code-block',
          title: 'Separate Authorization and Capture',
          language: 'javascript',
          code: `// Step 1: Authorize (hold funds)
const authorization = await stripe.charges.create({
  amount: 10000, // $100
  currency: 'usd',
  source: cardToken,
  capture: false, // ✅ Authorize only, don't capture yet
  description: 'Order #12345 - Pending fraud check',
});

console.log(authorization.status); // 'authorized' (not 'succeeded')

// ... Later, after fraud check and shipping...

// Step 2: Capture (transfer funds)
const capture = await stripe.charges.capture(authorization.id);

console.log(capture.status); // 'succeeded'

// OR: Void authorization (cancel charge, no fees)
const voided = await stripe.refunds.create({
  charge: authorization.id,
  reason: 'fraudulent',
});`,
          highlights: [5, 10, 15, 20],
        },
        {
          type: 'quiz',
          question: 'You authorized a $100 charge but the final order total is $80 (applied discount). What should you do?',
          options: [
            {
              id: 'full-capture-refund',
              text: 'Capture $100, then refund $20',
              correct: false,
              explanation:
                'This works but is inefficient. You pay Stripe fees on $100, then refund $20 (Stripe keeps the fee on the original $100). Better to capture only $80.',
            },
            {
              id: 'partial-capture',
              text: 'Capture $80 (partial capture)',
              correct: true,
              explanation:
                'Perfect! Stripe allows partial captures: authorize $100, capture $80. The uncaptured $20 is automatically released (voided). You only pay fees on the $80 captured. This is common for orders where final price is determined after authorization (shipping, discounts, out-of-stock items).',
            },
            {
              id: 'new-charge',
              text: 'Void the $100 authorization, create new $80 charge',
              correct: false,
              explanation:
                'This works but is unnecessarily complex. You already have authorization. Just capture $80 instead of $100 (partial capture). Stripe releases the remaining $20 automatically.',
            },
            {
              id: 'full-capture',
              text: 'Capture $100 anyway (customer pays $20 extra)',
              correct: false,
              explanation:
                'Absolutely not! You can\'t charge customers more than they agreed to pay. This is fraud and violates card network rules. Always capture ≤ authorized amount.',
            },
          ],
          multiSelect: false,
        },
      ],
      canvasOperations: [
        {
          type: 'add-node',
          node: {
            id: 'fraud-radar',
            type: 'archComponent',
            data: {
              componentType: 'serverless',
              label: 'Stripe Radar (Fraud Detection)',
              config: {},
            },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e-state-radar',
            source: 'state-machine',
            target: 'fraud-radar',
            type: 'archEdge',
            data: { label: 'Risk analysis' },
          },
        },
      ],
      nextCondition: 'click-next',
    },

    {
      id: 'step-9-webhooks-intro',
      title: 'Webhooks: Asynchronous Event Delivery',
      phase: 'real',
      estimatedMinutes: 8,
      content: `
# The Problem: Async Payment Results

Some payments **don't complete immediately**:

- **3D Secure**: Customer must authenticate in popup (30s - 5min)
- **Bank transfers**: ACH takes 3-5 business days
- **Async card networks**: Some banks respond in 24-48h

**How does the merchant know when payment succeeds?**

## Naive Approach: Polling (Bad)

\`\`\`javascript
// ❌ Don't do this
while (payment.status !== 'succeeded') {
  payment = await stripe.charges.retrieve(chargeId);
  await sleep(5000); // Check every 5 seconds
}
\`\`\`

**Problems**:
- Wastes API calls (rate limits)
- High latency (5s polling interval)
- Server resources (keep connection open)

## Solution: Webhooks (Good)

Stripe sends HTTP POST to your server when events happen:

\`\`\`
Payment succeeds → Stripe calls YOUR_URL/webhooks
\`\`\`

**Benefits**:
- ✅ Real-time (< 1 second notification)
- ✅ No polling needed
- ✅ Scales to millions of events

## How Webhooks Work

1. **Merchant registers webhook URL**: \`https://yourdomain.com/webhooks\`
2. **Event occurs**: Payment succeeds
3. **Stripe sends HTTP POST**:
   \`\`\`json
   POST https://yourdomain.com/webhooks
   {
     "type": "payment_intent.succeeded",
     "data": { "object": { "id": "pi_123", "amount": 10000 } }
   }
   \`\`\`
4. **Merchant processes**: Update database, send confirmation email
5. **Merchant responds**: HTTP 200 OK

## The Challenge: Delivery Reliability

What if:
- Merchant's server is down? 🔥
- Network timeout? ⏱️
- Merchant returns 500 error? ⚠️

**Stripe's solution**: Retry with exponential backoff (next section!)
      `,
      widgets: [
        {
          type: 'comparison-table',
          title: 'Polling vs Webhooks',
          columns: ['Approach', 'Latency', 'API Usage', 'Complexity', 'Best For'],
          rows: [
            {
              label: 'Polling',
              values: [
                '5-60 seconds (depends on interval)',
                'High (1 request per poll)',
                'Simple client logic',
                'Low-volume, immediate results',
              ],
            },
            {
              label: 'Webhooks',
              values: [
                '<1 second (real-time)',
                'Low (1 request per event)',
                'Requires webhook endpoint',
                'High-volume, async events',
              ],
            },
          ],
        },
        {
          type: 'code-block',
          title: 'Basic Webhook Handler',
          language: 'javascript',
          code: `// Express.js webhook endpoint
app.post('/webhooks', async (req, res) => {
  const event = req.body;

  // Handle different event types
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await handlePaymentSuccess(paymentIntent);
      break;

    case 'payment_intent.failed':
      const failed = event.data.object;
      await handlePaymentFailure(failed);
      break;

    case 'charge.refunded':
      const refund = event.data.object;
      await handleRefund(refund);
      break;

    default:
      console.log(\`Unhandled event type: \${event.type}\`);
  }

  // ✅ CRITICAL: Always return 200 OK quickly
  res.status(200).send({ received: true });
});

async function handlePaymentSuccess(paymentIntent) {
  // Update database
  await db.orders.update(paymentIntent.metadata.order_id, {
    status: 'paid',
    payment_id: paymentIntent.id,
  });

  // Send confirmation email
  await email.send(paymentIntent.receipt_email, 'Payment Confirmed');
}`,
          highlights: [25, 26],
        },
      ],
      canvasOperations: [
        {
          type: 'add-node',
          node: {
            id: 'webhook-worker',
            type: 'archComponent',
            data: {
              componentType: 'worker',
              label: 'Webhook Delivery Worker',
              config: {},
            },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e-state-webhook',
            source: 'state-machine',
            target: 'webhook-worker',
            type: 'archEdge',
            data: { label: 'Trigger events' },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e-webhook-merchant',
            source: 'webhook-worker',
            target: 'merchant',
            type: 'archEdge',
            data: { label: 'POST /webhooks' },
          },
        },
      ],
      nextCondition: 'click-next',
    },

    {
      id: 'step-10-webhook-reliability',
      title: 'Webhook Reliability and Retry Logic',
      phase: 'real',
      estimatedMinutes: 9,
      content: `
# Making Webhooks Reliable

Webhooks are **HTTP requests over unreliable networks**. They can fail!

## Failure Scenarios

1. **Merchant server down**: HTTP connection refused
2. **Timeout**: Request takes >30 seconds
3. **500 error**: Merchant's code crashed
4. **Network partition**: Packets dropped

**Stripe's goal**: Deliver every webhook, even if it takes days.

## Stripe's Retry Strategy

\`\`\`
Attempt 1: Immediate
Attempt 2: 1 hour later
Attempt 3: 2 hours later
Attempt 4: 4 hours later
...
Attempt N: Up to 3 days total
\`\`\`

**Exponential backoff**: Each retry waits 2× longer than previous

## Why Exponential Backoff?

- **Transient errors** (merchant deployed new code): Recover within 1 hour
- **Extended outages** (AWS region down): Wait hours before retry
- **Permanent failures** (merchant shut down): Stop after 3 days

## Idempotency (Again!)

Webhooks can be **delivered multiple times**:
- Stripe retries after timeout (but first request actually succeeded)
- Network split-brain: Both requests arrive

**Merchant must handle duplicates**:
\`\`\`javascript
// ✅ Check if event already processed
const existing = await db.processedEvents.find(event.id);
if (existing) {
  return res.status(200).send({ received: true }); // Idempotent
}

// Process event
await handleEvent(event);

// Mark as processed
await db.processedEvents.insert({ id: event.id, processed_at: Date.now() });
\`\`\`

## Webhook Signatures (Security)

**Problem**: Anyone can POST to your webhook URL (fake events!)

**Solution**: Stripe signs webhooks with HMAC-SHA256

\`\`\`javascript
const signature = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  req.body,
  signature,
  WEBHOOK_SECRET // From Stripe Dashboard
);
// If signature invalid, throws error ✅
\`\`\`

## Best Practices

1. **Return 200 fast** (< 1 second): Don't block on slow operations
2. **Process async**: Add to job queue, return 200, process in background
3. **Idempotency**: Check event.id before processing
4. **Verify signatures**: Prevent fake webhooks
5. **Monitor failures**: Alert if webhooks fail repeatedly
      `,
      widgets: [
        {
          type: 'code-block',
          title: 'Production Webhook Handler (with Retry Safety)',
          language: 'javascript',
          code: `app.post('/webhooks', async (req, res) => {
  let event;

  // 1. Verify signature (prevent fake webhooks)
  try {
    const signature = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(\`Webhook Error: \${err.message}\`);
  }

  // 2. Idempotency check (handle duplicate deliveries)
  const processed = await redis.get(\`webhook:\${event.id}\`);
  if (processed) {
    console.log('Webhook already processed:', event.id);
    return res.status(200).send({ received: true }); // ✅ Return 200 even if duplicate
  }

  // 3. Return 200 IMMEDIATELY (don't block Stripe)
  res.status(200).send({ received: true });

  // 4. Process async in background (job queue)
  try {
    await queue.add('process-webhook', {
      eventId: event.id,
      type: event.type,
      data: event.data.object,
    });

    // Mark as processed (24h TTL)
    await redis.set(\`webhook:\${event.id}\`, 'true', 'EX', 86400);

  } catch (err) {
    console.error('Failed to queue webhook:', err);
    // Don't re-throw! We already sent 200 to Stripe.
    // Alert monitoring system instead.
    await monitoring.alert('webhook-queue-failed', { event: event.id });
  }
});`,
          highlights: [4, 5, 6, 7, 8, 9, 10, 17, 18, 19, 20, 21, 24, 25, 35, 36],
        },
        {
          type: 'tradeoffs',
          title: 'Webhook Retry Strategy Trade-offs',
          decision: 'How aggressively should we retry failed webhook deliveries?',
          options: [
            {
              label: 'No Retries',
              pros: ['Simple', 'No retry infrastructure', 'No duplicate deliveries'],
              cons: [
                'Lost events (merchants miss critical updates)',
                'Poor reliability',
                'Angry merchants',
              ],
            },
            {
              label: 'Aggressive Retries (1min intervals)',
              pros: ['Fast recovery from transient errors', 'Low latency', 'Real-time updates'],
              cons: [
                'Hammers merchant during outages',
                'Wastes resources on permanent failures',
                'Amplifies load during incidents',
              ],
            },
            {
              label: 'Exponential Backoff (Stripe)',
              pros: [
                'Fast recovery (1h for transient errors)',
                'Backs off for outages (hours between retries)',
                'Stops eventually (3 days max)',
                'Industry standard',
              ],
              cons: [
                'Complex implementation',
                'Delayed notification for long outages',
                'Requires retry queue infrastructure',
              ],
            },
          ],
        },
        {
          type: 'quiz',
          question: 'Your webhook endpoint processed an event successfully but returned HTTP 500 by mistake (bug in response code). What happens?',
          options: [
            {
              id: 'lost',
              text: 'Event is lost - Stripe won\'t retry because it was processed',
              correct: false,
              explanation:
                'Stripe has NO WAY to know if you processed it! Stripe only sees the HTTP response code. 500 = failure, so Stripe will retry.',
            },
            {
              id: 'retry',
              text: 'Stripe retries, causing duplicate processing',
              correct: true,
              explanation:
                'Exactly! Stripe sees HTTP 500 → failure → retries. Even though you processed it, Stripe sends it again. This is why IDEMPOTENCY is critical: check if event.id was already processed before handling. Always return 200 if you processed successfully, even if something else goes wrong.',
            },
            {
              id: 'manual',
              text: 'Stripe pauses retries and sends you a manual notification',
              correct: false,
              explanation:
                'Stripe doesn\'t do manual intervention for individual webhooks. It just retries automatically based on exponential backoff. You\'ll get duplicate delivery.',
            },
            {
              id: 'smart',
              text: 'Stripe detects the event was processed and skips retry',
              correct: false,
              explanation:
                'Stripe cannot detect this! It only knows what you tell it via HTTP status code. 500 = retry. This is why you must check for duplicates (idempotency) on your end.',
            },
          ],
          multiSelect: false,
        },
      ],
      canvasOperations: [
        {
          type: 'add-node',
          node: {
            id: 'retry-queue',
            type: 'archComponent',
            data: {
              componentType: 'kafka',
              label: 'Retry Queue (SQS)',
              config: { description: 'Exponential backoff' },
            },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e-webhook-queue',
            source: 'webhook-worker',
            target: 'retry-queue',
            type: 'archEdge',
            data: { label: 'Failed deliveries' },
          },
        },
      ],
      nextCondition: 'click-next',
    },

    // ========== PHASE 5: HANDS-ON EXERCISE (20 min) ==========
    {
      id: 'step-11-exercise',
      title: 'Exercise: Build a Webhook Delivery System',
      phase: 'exercise',
      estimatedMinutes: 15,
      canvasBuildMode: true,
      buildConfig: {
        palette: [
          {
            id: 'api-gateway',
            label: 'API Gateway',
            componentType: 'api_gateway',
            description: 'Handles incoming merchant payment requests',
          },
          {
            id: 'payment-service',
            label: 'Payment Service',
            componentType: 'serverless',
            description: 'Core payment processing logic',
          },
          {
            id: 'ledger-db',
            label: 'Ledger DB',
            componentType: 'postgres',
            description: 'Immutable ledger for all financial transactions',
          },
          {
            id: 'card-network',
            label: 'Card Network Gateway',
            componentType: 'external_api',
            description: 'Communicates with Visa/Mastercard/bank networks',
          },
          {
            id: 'fraud-detection',
            label: 'Fraud Detection',
            componentType: 'serverless',
            description: 'ML-based risk scoring (Stripe Radar)',
          },
          {
            id: 'webhook-service',
            label: 'Webhook Service',
            componentType: 'worker',
            description: 'Delivers event notifications to merchants',
          },
          {
            id: 'idempotency-store',
            label: 'Idempotency Store',
            componentType: 'redis',
            description: 'Caches idempotency keys to prevent duplicate charges',
          },
          {
            id: 'message-queue',
            label: 'Message Queue',
            componentType: 'kafka',
            description: 'Async job queue for background processing',
          },
        ],
        initialNodes: [],
        validationRules: [
          {
            type: 'must-exist',
            params: { componentType: 'redis' },
            feedback:
              'Your architecture is missing an Idempotency Store. Without this, retries will double-charge customers!',
          },
          {
            type: 'must-connect',
            params: {
              sourceType: 'serverless',
              targetType: 'postgres',
            },
            feedback:
              'Payment Service must connect to Ledger DB to record all financial transactions immutably.',
          },
          {
            type: 'must-connect',
            params: {
              sourceType: 'serverless',
              targetType: 'external_api',
            },
            feedback:
              'Payment Service must connect to Card Network Gateway to authorize charges with banks.',
          },
          {
            type: 'must-exist',
            params: { componentType: 'serverless', labelMatch: 'Fraud' },
            feedback:
              'Missing Fraud Detection! Every payment should be scored for risk before authorization.',
          },
        ],
        successMessage:
          'Excellent! Your payment architecture includes all critical components: idempotency for safe retries, ledger for audit trails, fraud detection for security, and webhooks for async notifications. This is production-ready!',
        hints: [
          'Every payment needs to be recorded somewhere immutable for regulatory compliance.',
          'How do you prevent double charges when network requests fail and clients retry?',
          'What notifies the merchant when a payment succeeds asynchronously (e.g., after 3D Secure)?',
          'Payments involve real money - you need to check for fraud before authorizing charges.',
        ],
      },
      content: `
# Hands-On Challenge

You're building Stripe's webhook delivery system. Requirements:

## Your Task

Implement a reliable webhook delivery worker that:

1. **Sends webhooks** to merchant URLs
2. **Retries on failure** with exponential backoff
3. **Handles duplicates** (idempotency)
4. **Gives up eventually** (max 3 days)
5. **Logs all attempts** for debugging

## Constraints

- **Network**: Merchant URLs can timeout (30s), return 500, or refuse connection
- **Scale**: 10,000 webhooks/second to deliver
- **Reliability**: 99.9% delivery rate (merchants get notified even if down for hours)

## Starter Code

We've provided skeleton code below. Fill in the missing pieces:

- How do you implement exponential backoff?
- How do you prevent duplicate processing?
- How do you handle timeouts?
- When do you give up?

## Discussion Points

- How would you scale this to 10K webhooks/second?
- How do you debug failed webhooks?
- What metrics would you track?

Take 10-15 minutes to think through your approach. When ready, click "Next" to see Stripe's solution.
      `,
      widgets: [
        {
          type: 'code-block',
          title: 'Webhook Delivery System - YOUR IMPLEMENTATION',
          language: 'javascript',
          code: `// TODO: Implement reliable webhook delivery
class WebhookDeliveryWorker {
  constructor() {
    this.MAX_RETRIES = 10;
    this.MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
    this.BASE_DELAY = 1000; // 1 second
  }

  async deliver(webhook) {
    // TODO: Implement delivery logic
    // Hints:
    // - Send HTTP POST to webhook.url
    // - Handle timeouts (30s max)
    // - Check HTTP status (200-299 = success)
    // - Retry on failure with exponential backoff
    // - Give up after 3 days or 10 attempts
    // - Log each attempt for debugging
  }

  calculateBackoff(attempt) {
    // TODO: Implement exponential backoff with jitter
    // - Attempt 1: 1s
    // - Attempt 2: 2s
    // - Attempt 3: 4s
    // - Attempt 4: 8s
    // - Max: 1 hour
  }

  async retry(webhook, attempt, error) {
    // TODO: Implement retry logic
    // - Check if max retries exceeded
    // - Check if webhook too old (> 3 days)
    // - Calculate delay
    // - Schedule retry
  }
}`,
        },
        {
          type: 'quiz',
          question: 'When should you give up retrying a webhook delivery?',
          options: [
            {
              id: 'immediately',
              text: 'After first 500 error - merchant clearly has a bug',
              correct: false,
              explanation:
                'Too aggressive! A single 500 could be a transient error (deployment, restart). You should retry multiple times over hours/days.',
            },
            {
              id: 'max-attempts',
              text: 'After 10 attempts OR 3 days, whichever comes first',
              correct: true,
              explanation:
                'Correct! Stripe uses BOTH limits: max attempts (10) AND max age (3 days). If a webhook is delivered successfully on attempt 3, great. If it fails 10 times within 1 day, stop (merchant clearly can\'t handle it). If it fails for 3 days straight, stop (too old, merchant likely doesn\'t care anymore).',
            },
            {
              id: 'never',
              text: 'Never - keep retrying forever until it succeeds',
              correct: false,
              explanation:
                'This wastes resources! If a merchant shuts down their webhook endpoint permanently, you\'d retry forever. Better to give up after a reasonable time (3 days) and let the merchant fetch missed events via API if needed.',
            },
            {
              id: 'manual',
              text: 'Never automatically - wait for merchant to request replay',
              correct: false,
              explanation:
                'Merchants expect webhooks to be delivered automatically! Manual replay is a fallback, not the primary mechanism. Auto-retry with exponential backoff is the right approach.',
            },
          ],
          multiSelect: false,
        },
      ],
      canvasOperations: [
        {
          type: 'highlight',
          nodeIds: ['webhook-worker', 'retry-queue', 'merchant'],
          duration: 10000,
          color: '#f59e0b',
        },
      ],
      nextCondition: 'click-next',
    },

    {
      id: 'step-12-exercise-solution',
      title: 'Solution: Webhook Delivery System',
      phase: 'exercise',
      estimatedMinutes: 5,
      content: `
# Stripe's Webhook Delivery Implementation

Here's how Stripe actually implements reliable webhook delivery:

## Key Components

1. **Webhook Queue**: SQS/Kafka with priority lanes
2. **Delivery Workers**: Horizontally scalable (100+ workers)
3. **Retry Scheduler**: Exponential backoff with jitter
4. **Idempotency Store**: Redis with 24h TTL
5. **Monitoring**: Track success rate, latency, failures

## Delivery Algorithm

\`\`\`
1. Pop webhook from queue
2. Check age (> 3 days? → discard)
3. Check attempts (> 10? → discard)
4. Send HTTP POST (30s timeout)
5. Handle response:
   - 200-299: Success! ✅
   - 429: Rate limited → retry in 1 hour
   - 500-599: Server error → exponential backoff
   - Timeout: → exponential backoff
6. Log attempt
7. If failed: Schedule retry, push to queue
\`\`\`

## Scaling to 10K/second

- **Partition by merchant**: Each merchant gets dedicated queue
- **Parallel workers**: 100+ workers processing concurrently
- **Rate limiting**: Max 100 webhooks/second per merchant endpoint
- **Circuit breaker**: If merchant fails 10 in a row, pause for 1h

## Production Metrics

- **Delivery success rate**: 99.95%
- **P50 latency**: 100ms
- **P99 latency**: 2 seconds
- **Average retries**: 1.2 per webhook
- **Max queue depth**: 10M pending webhooks (during incidents)
      `,
      widgets: [
        {
          type: 'code-block',
          title: 'Production Webhook Delivery System',
          language: 'javascript',
          code: `class WebhookDeliveryWorker {
  async deliver(webhook) {
    const startTime = Date.now();

    // Check if too old or too many attempts
    if (Date.now() - webhook.created_at > this.MAX_AGE_MS) {
      await this.logFailure(webhook, 'expired', 'Webhook older than 3 days');
      return { status: 'expired' };
    }

    if (webhook.attempts >= this.MAX_RETRIES) {
      await this.logFailure(webhook, 'max_retries', \`Failed after \${this.MAX_RETRIES} attempts\`);
      return { status: 'max_retries' };
    }

    try {
      // Send HTTP POST with timeout
      const response = await axios.post(webhook.url, webhook.payload, {
        timeout: 30000, // 30 seconds
        headers: {
          'Content-Type': 'application/json',
          'Stripe-Signature': this.generateSignature(webhook.payload),
        },
      });

      // Success!
      if (response.status >= 200 && response.status < 300) {
        await this.logSuccess(webhook, Date.now() - startTime);
        return { status: 'succeeded' };
      }

      // Unexpected status code
      throw new Error(\`Unexpected status: \${response.status}\`);

    } catch (error) {
      // Handle different error types
      const shouldRetry = this.shouldRetry(error);

      if (shouldRetry) {
        const delay = this.calculateBackoff(webhook.attempts);
        await this.scheduleRetry(webhook, delay, error.message);
        return { status: 'retrying', delay };
      } else {
        await this.logFailure(webhook, 'permanent', error.message);
        return { status: 'failed' };
      }
    }
  }

  calculateBackoff(attempt) {
    // Exponential backoff: 1s, 2s, 4s, 8s, ..., max 1 hour
    const exponentialDelay = Math.min(
      3600000, // 1 hour max
      this.BASE_DELAY * Math.pow(2, attempt)
    );

    // Jitter: ±20% randomness
    const jitter = 0.8 + Math.random() * 0.4;
    return exponentialDelay * jitter;
  }

  shouldRetry(error) {
    // Always retry network errors and timeouts
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return true;
    }

    // Retry 500-series errors
    if (error.response && error.response.status >= 500) {
      return true;
    }

    // Don't retry 4xx (client errors - merchant's fault)
    return false;
  }

  async scheduleRetry(webhook, delayMs, errorMessage) {
    await db.webhooks.update(webhook.id, {
      attempts: webhook.attempts + 1,
      next_attempt_at: Date.now() + delayMs,
      last_error: errorMessage,
    });

    // Push back to retry queue
    await queue.schedule('webhook-retry', {
      webhookId: webhook.id,
      delay: delayMs,
    });
  }
}`,
          highlights: [5, 6, 7, 10, 11, 12, 17, 18, 26, 27, 28, 49, 50, 51, 52, 53, 54],
        },
      ],
      canvasOperations: [],
      nextCondition: 'click-next',
    },

    // ========== PHASE 6: DEEP DIVE (20 min) ==========
    {
      id: 'step-13-ledger-system',
      title: 'Double-Entry Bookkeeping and Ledger Systems',
      phase: 'deep-dive',
      estimatedMinutes: 8,
      content: `
# Following the Money: Ledger Systems

Every payment creates **financial transactions** that must balance to the penny.

## Double-Entry Bookkeeping

Every transaction has **two sides** (debits and credits):

**Example: Customer pays merchant $100**

\`\`\`
Debit:  Customer's bank account  -$100
Credit: Merchant's account        +$97
Credit: Stripe's account          +$3 (fees)
---
Total: $0 (balanced) ✅
\`\`\`

**Why double-entry?**
- Detects errors: If totals don't sum to $0, something is wrong
- Auditability: Every dollar accounted for
- Reconciliation: Match Stripe's records with banks

## Stripe's Ledger Architecture

**Components**:
- **Ledger DB**: Append-only log of all transactions
- **Balance Service**: Computes current balances (sum of ledger entries)
- **Reconciliation**: Daily comparison with bank statements

**Invariants** (always true):
1. Sum of all ledger entries = $0
2. Customer balance ≥ 0 (can't go negative without authorization)
3. Merchant balance = (charges - refunds - fees)

## Handling Disputes and Chargebacks

**Chargeback**: Customer disputes charge with bank

\`\`\`
Original payment:
  Debit: Customer -$100
  Credit: Merchant +$97
  Credit: Stripe +$3

Chargeback (merchant loses):
  Debit: Merchant -$100 (money taken back + $15 fee)
  Credit: Customer +$100
  Debit: Stripe -$3 (refund fees)
---
Merchant net: -$115 (lost $100 + $15 chargeback fee)
\`\`\`

## Fraud Prevention

Stripe uses machine learning (Radar) to detect fraud:
- **Before authorization**: Block suspicious cards
- **After authorization**: Hold payouts for risky merchants
- **Chargeback patterns**: Flag merchants with high dispute rates

**Trade-off**: False positives (block legitimate payments) vs false negatives (allow fraud)
      `,
      widgets: [
        {
          type: 'code-block',
          title: 'Ledger Entry Example',
          language: 'sql',
          code: `-- Ledger table (append-only, immutable)
CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP NOT NULL,
  account_id UUID NOT NULL, -- Which account (customer, merchant, Stripe)
  transaction_id UUID NOT NULL, -- Links related entries
  amount_cents BIGINT NOT NULL, -- Negative = debit, Positive = credit
  currency CHAR(3) NOT NULL,
  description TEXT,
  metadata JSONB
);

-- Example: $100 payment with $3 fee
INSERT INTO ledger_entries VALUES
  -- Customer pays $100
  ('...', NOW(), 'cust_123', 'txn_abc', -10000, 'usd', 'Payment for Order #123', '{}'),

  -- Merchant receives $97
  ('...', NOW(), 'merch_456', 'txn_abc', 9700, 'usd', 'Payment from cust_123', '{}'),

  -- Stripe collects $3 fee
  ('...', NOW(), 'stripe_fees', 'txn_abc', 300, 'usd', 'Fee for txn_abc', '{}');

-- Query: Verify transaction balances
SELECT transaction_id, SUM(amount_cents) AS balance
FROM ledger_entries
GROUP BY transaction_id
HAVING SUM(amount_cents) != 0; -- Should return 0 rows! ✅`,
          highlights: [5, 22, 23, 24, 25, 26],
        },
        {
          type: 'tradeoffs',
          title: 'Fraud Detection Trade-offs',
          decision: 'How aggressive should fraud detection be?',
          options: [
            {
              label: 'Strict (Block Aggressively)',
              pros: ['Low fraud rate (<0.1%)', 'Fewer chargebacks', 'Protect merchants'],
              cons: [
                'High false positive rate (5-10% legitimate blocked)',
                'Lost revenue',
                'Angry customers ("Why was my card declined?")',
              ],
            },
            {
              label: 'Lenient (Allow Most)',
              pros: ['High conversion rate', 'Happy customers', 'Maximum revenue'],
              cons: [
                'High fraud rate (1-5%)',
                'Chargebacks cost Stripe $15 each',
                'Merchant loses money + chargeback fees',
              ],
            },
            {
              label: 'ML-Based (Stripe Radar)',
              pros: [
                'Adaptive (learns from fraud patterns)',
                'Low false positive rate (~1%)',
                'Merchant can set own risk tolerance',
                'Real-time scoring',
              ],
              cons: [
                'Complex ML infrastructure',
                'Needs training data (cold start)',
                'Can be gamed by sophisticated fraudsters',
              ],
            },
          ],
        },
      ],
      canvasOperations: [
        {
          type: 'add-node',
          node: {
            id: 'ledger-db',
            type: 'archComponent',
            data: {
              componentType: 'postgres',
              label: 'Ledger Database',
              config: { description: 'Append-only, double-entry' },
            },
          },
        },
        {
          type: 'add-edge',
          edge: {
            id: 'e-state-ledger',
            source: 'state-machine',
            target: 'ledger-db',
            type: 'archEdge',
            data: { label: 'Record transactions' },
          },
        },
      ],
      nextCondition: 'click-next',
    },

    {
      id: 'step-14-conclusion',
      title: 'Conclusion & Key Takeaways',
      phase: 'deep-dive',
      estimatedMinutes: 12,
      content: `
# You've Mastered Payment Processing! 🎉

## What You Learned

Over the past ~105 minutes, you've explored:

✅ **Payment processing challenges**: Money, networks, compliance
✅ **Idempotency keys**: Exactly-once semantics for safe retries
✅ **Exponential backoff**: Retry logic that scales
✅ **State machines**: Payment lifecycle (auth → capture → settle)
✅ **Webhooks**: Asynchronous event delivery with retries
✅ **Ledger systems**: Double-entry bookkeeping for financial accuracy
✅ **PCI-DSS compliance**: Security and tokenization
✅ **Fraud detection**: ML-based risk scoring

## The Complete Architecture

You now understand Stripe's payment processing system:
- **API Gateway**: Rate limiting, authentication, routing
- **Idempotency Layer**: Redis cache for safe retries
- **State Machine**: Payment lifecycle management
- **Fraud Detection**: Stripe Radar ML models
- **Webhook Workers**: Reliable event delivery with exponential backoff
- **Ledger System**: Double-entry bookkeeping, balance tracking
- **Compliance**: PCI-DSS, KYC/AML, GDPR

## Key Engineering Principles

**1. Idempotency is Non-Negotiable**
- Every mutating operation must be idempotent
- Use unique keys, cache results, check before processing

**2. Networks Are Unreliable**
- Always assume requests fail, timeout, or duplicate
- Exponential backoff with jitter for retries
- Design for eventual consistency

**3. Money Requires Special Care**
- Exactly-once semantics (never double-charge)
- Immutable ledger (append-only)
- Audit trails for compliance

**4. State Machines Prevent Bugs**
- Explicit states and transitions
- Invalid transitions rejected
- Easier to reason about edge cases

**5. Async > Sync for Reliability**
- Webhooks + retries > polling
- Background jobs > synchronous processing
- Eventual consistency > distributed transactions

## Real-World Impact

Stripe processes **$1 trillion annually** using these patterns:
- **Idempotency**: Handles millions of duplicate requests/day
- **Webhooks**: 99.95% delivery rate
- **State machines**: Prevents invalid payment transitions
- **Ledger**: $0.00 discrepancy in reconciliation

## Next Steps

**Want to learn more?**

1. **Read Stripe's docs**: https://stripe.com/docs/api
2. **Explore other walkthroughs**:
   - Netflix Recommendation System
   - Instagram System Design
   - Uber Dispatch System
   - Twitter/X Feed Ranking

3. **Build your own**: Try implementing a mini payment processor with idempotency!

4. **Advanced topics**:
   - Multi-currency and FX hedging
   - Payment method routing (3D Secure, ACH, SEPA)
   - Dispute management and representment
   - PSD2 and Strong Customer Authentication (SCA)

**Share this walkthrough**:
- Tell colleagues about this platform
- Contribute improvements or new examples

Thank you for learning with us! 🚀

## Further Reading

- **Stripe Engineering Blog**: https://stripe.com/blog/engineering
- **Designing Data-Intensive Applications** (Martin Kleppmann) - Chapter on Transactions
- **Patrick McKenzie (patio11) on payments**: https://www.kalzumeus.com/
- **PCI-DSS v4.0**: https://www.pcisecuritystandards.org/
      `,
      canvasOperations: [],
      widgets: [
        {
          type: 'comparison-table',
          title: 'Your Learning Journey',
          columns: ['Phase', 'Topics', 'Duration', 'Status'],
          rows: [
            {
              label: 'Phase 1: Problem',
              values: ['Payment challenges, money, compliance', '10 min', '✅ Complete'],
            },
            {
              label: 'Phase 2: Naive',
              values: ['Simple API, exactly-once problem', '15 min', '✅ Complete'],
            },
            {
              label: 'Phase 3: Idempotency',
              values: ['Idempotency keys, retry logic, state machines', '20 min', '✅ Complete'],
            },
            {
              label: 'Phase 4: Real',
              values: ['Auth/capture/settle, webhooks, reliability', '25 min', '✅ Complete'],
            },
            {
              label: 'Phase 5: Exercise',
              values: ['Build webhook delivery system', '20 min', '✅ Complete'],
            },
            {
              label: 'Phase 6: Deep Dive',
              values: ['Ledger systems, fraud detection', '20 min', '✅ Complete'],
            },
          ],
        },
      ],
      nextCondition: 'click-next',
    },
  ],
};
