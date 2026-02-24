# Extensibility Design: Plugin Architecture for Behavior Models

**Version**: 1.0
**Date**: 2026-02-24

Design for extensible behavior modeling system that starts simple (MVP) and scales to complex models WITHOUT rewriting the core engine.

---

## Design Principles

### 1. Core Abstraction: BehaviorModel Interface

All behavior models implement a common interface, allowing the simulation engine to be **model-agnostic**.

**Key Insight**: The engine doesn't care *how* throughput is calculated, only that it can ask for it.

### 2. Progressive Enhancement

```
MVP:    SimpleBehaviorModel (throughput, latency, utilization)
  ↓
Stage 2: Add QueueTheoryModel (M/M/1, Little's Law)
  ↓
Stage 3: Add BackpressureModel + RetryModel
  ↓
Stage 4: Add component-specific models (LB, cache, DB, circuit breaker)
```

Each stage **extends**, not replaces, previous stages.

### 3. Plugin Registration System

Models register themselves with a central registry. The simulation engine queries the registry for available models.

---

## Architecture Overview

### System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                   Simulation Engine                         │
│  (Model-agnostic: uses BehaviorModel interface)            │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │ uses
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              BehaviorModelRegistry (Plugin System)          │
│  - Registers models by name                                 │
│  - Resolves model at runtime                                │
│  - Validates model compatibility                            │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │ registers
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Behavior Models                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Simple    │  │ Queue Theory │  │ Component    │     │
│  │    Model     │  │    Model     │  │  Specific    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## Part 1: Core Abstractions

### BehaviorModel Interface

```typescript
/**
 * Base interface for all behavior models.
 *
 * Design: Simulation engine depends on this interface, not concrete implementations.
 * This enables swapping models at runtime without engine changes.
 */
interface BehaviorModel {
  /** Model identifier for registry lookup */
  readonly id: string;

  /** Model type classification */
  readonly type: 'simple' | 'queue-theory' | 'advanced' | 'component';

  /** Semantic version (for compatibility checking) */
  readonly version: string;

  /** Human-readable description */
  readonly description: string;

  /**
   * Calculate node throughput
   *
   * @param params - Model-specific parameters
   * @returns Throughput result
   */
  calculateThroughput(params: ThroughputParams): ThroughputResult;

  /**
   * Calculate request latency
   *
   * @param params - Model-specific parameters
   * @returns Latency result
   */
  calculateLatency(params: LatencyParams): LatencyResult;

  /**
   * Calculate resource utilization
   *
   * @param params - Model-specific parameters
   * @returns Utilization result
   */
  calculateUtilization(params: UtilizationParams): UtilizationResult;

  /**
   * Validate if this model can handle the given node type
   *
   * Example: QueueTheoryModel requires Poisson arrivals, exponential service
   */
  canHandle(nodeType: NodeType): boolean;

  /**
   * Get model configuration schema
   *
   * Enables UI to dynamically generate configuration forms
   */
  getConfigSchema(): ConfigSchema;
}
```

### Parameter Types

```typescript
/**
 * Throughput calculation parameters
 *
 * Design: Flexible enough for simple and advanced models
 */
interface ThroughputParams {
  /** Sum of incoming edge flows [req/sec] */
  incomingLoad: number;

  /** Node maximum capacity [req/sec] */
  nodeCapacity: number;

  /** Current queue depth (optional, for queue-aware models) */
  queueDepth?: number;

  /** Node-specific configuration (optional) */
  nodeConfig?: Record<string, unknown>;

  /** Arrival pattern (optional, for queue theory models) */
  arrivalPattern?: 'poisson' | 'deterministic' | 'bursty';

  /** Service pattern (optional, for queue theory models) */
  servicePattern?: 'exponential' | 'deterministic' | 'general';
}

/**
 * Latency calculation parameters
 */
interface LatencyParams {
  /** Service time per request [ms] */
  baseLatency: number;

  /** Current queue depth */
  queueDepth: number;

  /** Processing throughput [req/sec] */
  serviceRate: number;

  /** Edge latencies in request path [ms] */
  networkDelays: number[];

  /** Queue discipline (optional) */
  queueDiscipline?: 'FIFO' | 'LIFO' | 'priority';
}

/**
 * Utilization calculation parameters
 */
interface UtilizationParams {
  /** Current processed throughput [req/sec] */
  currentThroughput: number;

  /** Maximum capacity [req/sec] */
  maxCapacity: number;

  /** Resource type (optional, for component-specific models) */
  resourceType?: 'cpu' | 'memory' | 'connections' | 'disk';
}
```

---

## Part 2: Plugin Registry System

### BehaviorModelRegistry

```typescript
/**
 * Central registry for behavior models.
 *
 * Design:
 * - Models register themselves on app startup
 * - Simulation engine queries registry for models
 * - Enables runtime model selection (user can choose)
 */
class BehaviorModelRegistry {
  private models = new Map<string, BehaviorModel>();
  private aliases = new Map<string, string>(); // Alias → Model ID

  /**
   * Register a behavior model
   *
   * @param model - The model to register
   * @throws Error if model.id already registered
   */
  register(model: BehaviorModel): void {
    if (this.models.has(model.id)) {
      throw new Error(`Model already registered: ${model.id}`);
    }

    this.models.set(model.id, model);
    console.log(`[Registry] Registered model: ${model.id} (${model.type})`);
  }

  /**
   * Register an alias for a model
   *
   * Example: registerAlias('default', 'simple-behavior-model')
   */
  registerAlias(alias: string, modelId: string): void {
    if (!this.models.has(modelId)) {
      throw new Error(`Cannot alias non-existent model: ${modelId}`);
    }
    this.aliases.set(alias, modelId);
  }

  /**
   * Get a model by ID or alias
   *
   * @param idOrAlias - Model ID or alias
   * @returns The model, or undefined if not found
   */
  get(idOrAlias: string): BehaviorModel | undefined {
    // Try direct lookup first
    let model = this.models.get(idOrAlias);
    if (model) return model;

    // Try alias lookup
    const modelId = this.aliases.get(idOrAlias);
    if (modelId) {
      return this.models.get(modelId);
    }

    return undefined;
  }

  /**
   * Get model or throw if not found
   */
  require(idOrAlias: string): BehaviorModel {
    const model = this.get(idOrAlias);
    if (!model) {
      throw new Error(`Model not found: ${idOrAlias}`);
    }
    return model;
  }

  /**
   * List all registered models
   */
  list(): ModelInfo[] {
    return Array.from(this.models.values()).map(model => ({
      id: model.id,
      type: model.type,
      version: model.version,
      description: model.description,
    }));
  }

  /**
   * Find models that can handle a node type
   */
  findCompatible(nodeType: NodeType): BehaviorModel[] {
    return Array.from(this.models.values())
      .filter(model => model.canHandle(nodeType));
  }

  /**
   * Check if a model is registered
   */
  has(idOrAlias: string): boolean {
    return this.get(idOrAlias) !== undefined;
  }

  /**
   * Unregister a model (useful for testing)
   */
  unregister(id: string): boolean {
    return this.models.delete(id);
  }

  /**
   * Clear all models (useful for testing)
   */
  clear(): void {
    this.models.clear();
    this.aliases.clear();
  }
}

interface ModelInfo {
  id: string;
  type: string;
  version: string;
  description: string;
}

// Global singleton registry
export const behaviorRegistry = new BehaviorModelRegistry();
```

### Registration on App Startup

```typescript
/**
 * Register all behavior models on app initialization
 */
export function initializeBehaviorModels(): void {
  // Register MVP models
  behaviorRegistry.register(new SimpleThroughputModel());
  behaviorRegistry.register(new SimpleLatencyModel());
  behaviorRegistry.register(new SimpleUtilizationModel());

  // Register composite simple model (combines above)
  behaviorRegistry.register(new SimpleBehaviorModel());
  behaviorRegistry.registerAlias('default', 'simple-behavior-model');

  // Future: Register advanced models when implemented
  // behaviorRegistry.register(new QueueTheoryModel());
  // behaviorRegistry.register(new BackpressureModel());

  console.log(`[Registry] Initialized ${behaviorRegistry.list().length} models`);
}
```

---

## Part 3: Model Selection Strategies

### Strategy 1: User-Configurable (Explicit)

```typescript
/**
 * User explicitly selects model via UI dropdown
 */
interface SimulationConfig {
  behaviorModel: string;  // Model ID or alias
  // ... other config
}

// In simulation engine:
const model = behaviorRegistry.require(config.behaviorModel);
const throughput = model.calculateThroughput(params);
```

**Pros**:
- User has full control
- Explicit and predictable
- Easy to understand

**Cons**:
- User must understand model differences
- May choose wrong model for use case

---

### Strategy 2: Auto-Select Based on Node Type

```typescript
/**
 * Automatically select best model for node type
 */
function selectModelForNode(nodeType: NodeType): BehaviorModel {
  const compatible = behaviorRegistry.findCompatible(nodeType);

  if (compatible.length === 0) {
    throw new Error(`No model can handle node type: ${nodeType}`);
  }

  // Preference order: advanced > queue-theory > simple
  const preferenceOrder = ['advanced', 'queue-theory', 'simple'];

  for (const type of preferenceOrder) {
    const model = compatible.find(m => m.type === type);
    if (model) return model;
  }

  // Fallback to first compatible
  return compatible[0];
}
```

**Pros**:
- No user configuration needed
- Always picks appropriate model
- Enables progressive enhancement (add models without config changes)

**Cons**:
- Less explicit
- User may not know which model is used

---

### Strategy 3: Fallback Chain

```typescript
/**
 * Try advanced model first, fall back to simpler on error
 */
function calculateWithFallback(
  preferredModelId: string,
  fallbackModelId: string,
  params: ThroughputParams
): ThroughputResult {
  try {
    const preferred = behaviorRegistry.get(preferredModelId);
    if (preferred && preferred.canHandle(params.nodeType)) {
      return preferred.calculateThroughput(params);
    }
  } catch (error) {
    console.warn(`[Fallback] ${preferredModelId} failed:`, error);
  }

  // Fallback to simpler model
  const fallback = behaviorRegistry.require(fallbackModelId);
  return fallback.calculateThroughput(params);
}

// Usage:
const result = calculateWithFallback(
  'queue-theory-model',  // Try this first
  'simple-model',        // Fall back to this
  params
);
```

**Pros**:
- Best of both worlds: advanced when possible, simple when needed
- Graceful degradation
- Robust to model errors

**Cons**:
- More complex logic
- May hide errors from advanced models

---

## Part 4: Progressive Enhancement Roadmap

### Stage 1: MVP (Simple Models)

**Deliverable**: Basic simulation with throughput/latency/utilization

**Models**:
- `SimpleThroughputModel`
- `SimpleLatencyModel`
- `SimpleUtilizationModel`
- `SimpleBehaviorModel` (composite)

**Registry Setup**:
```typescript
behaviorRegistry.register(new SimpleBehaviorModel());
behaviorRegistry.registerAlias('default', 'simple-behavior-model');
```

**User Impact**: Functional simulation, but simplistic

---

### Stage 2: Queue Theory

**Deliverable**: More accurate queueing behavior using M/M/1 formulas

**Models**:
- `QueueTheoryModel` (implements M/M/1, Little's Law)

**Registry Setup**:
```typescript
behaviorRegistry.register(new QueueTheoryModel());
// Keep 'default' as simple model for backward compatibility
```

**User Impact**: Can enable queue theory for more realistic queueing

**Migration**:
```typescript
// Before (Stage 1):
const result = model.calculateLatency(params);

// After (Stage 2): No code changes!
// Just swap model in config:
config.behaviorModel = 'queue-theory-model';
```

**Key Insight**: Core engine doesn't change! Only model implementation.

---

### Stage 3: Advanced Behaviors

**Deliverable**: Backpressure, retry logic, failure propagation

**Models**:
- `BackpressureModel`
- `RetryModel`
- `FailurePropagationModel`

**Registry Setup**:
```typescript
behaviorRegistry.register(new BackpressureModel());
behaviorRegistry.register(new RetryModel());
behaviorRegistry.register(new FailurePropagationModel());
```

**Composition Pattern**:
```typescript
/**
 * Compose multiple models for richer behavior
 */
class CompositeBehaviorModel implements BehaviorModel {
  constructor(
    private base: BehaviorModel,
    private enhancements: BehaviorModel[]
  ) {}

  calculateThroughput(params: ThroughputParams): ThroughputResult {
    // Start with base model
    let result = this.base.calculateThroughput(params);

    // Apply enhancements in order
    for (const enhancement of this.enhancements) {
      result = enhancement.adjustThroughput(result, params);
    }

    return result;
  }
}

// Usage:
const richModel = new CompositeBehaviorModel(
  new QueueTheoryModel(),
  [new BackpressureModel(), new RetryModel()]
);
```

---

### Stage 4: Component-Specific Models

**Deliverable**: Specialized behaviors for LB, cache, DB, circuit breaker

**Models**:
- `LoadBalancerBehavior`
- `CacheBehavior`
- `DatabaseBehavior`
- `CircuitBreakerBehavior`

**Registry Setup**:
```typescript
behaviorRegistry.register(new LoadBalancerBehavior());
behaviorRegistry.register(new CacheBehavior());
behaviorRegistry.register(new DatabaseBehavior());
behaviorRegistry.register(new CircuitBreakerBehavior());
```

**Node Type Mapping**:
```typescript
/**
 * Map node types to specialized models
 */
const nodeTypeModels = new Map<NodeType, string>([
  ['load_balancer', 'load-balancer-behavior'],
  ['cache', 'cache-behavior'],
  ['database', 'database-behavior'],
  ['circuit_breaker', 'circuit-breaker-behavior'],
  // Fallback to default for unknown types
]);

function getModelForNode(nodeType: NodeType): BehaviorModel {
  const modelId = nodeTypeModels.get(nodeType) || 'default';
  return behaviorRegistry.require(modelId);
}
```

---

## Part 5: Configuration Schema

### Dynamic UI Generation

```typescript
/**
 * Schema describes model configuration
 *
 * Enables UI to dynamically generate configuration forms
 */
interface ConfigSchema {
  fields: ConfigField[];
}

interface ConfigField {
  key: string;
  label: string;
  type: 'number' | 'boolean' | 'select' | 'text';
  default: unknown;
  min?: number;
  max?: number;
  options?: { value: unknown; label: string }[];
  description?: string;
  required?: boolean;
}

// Example: QueueTheoryModel schema
class QueueTheoryModel implements BehaviorModel {
  // ... (other methods)

  getConfigSchema(): ConfigSchema {
    return {
      fields: [
        {
          key: 'arrivalRate',
          label: 'Arrival Rate (λ)',
          type: 'number',
          default: 80,
          min: 0,
          description: 'Request arrival rate [req/sec]',
          required: true,
        },
        {
          key: 'serviceRate',
          label: 'Service Rate (μ)',
          type: 'number',
          default: 100,
          min: 0.1,
          description: 'Service rate [req/sec]',
          required: true,
        },
        {
          key: 'validateStability',
          label: 'Validate Queue Stability',
          type: 'boolean',
          default: true,
          description: 'Throw error if λ ≥ μ',
        },
      ],
    };
  }
}
```

### UI Component (React Example)

```tsx
/**
 * Dynamically render configuration form based on schema
 */
function ModelConfigForm({ modelId }: { modelId: string }) {
  const model = behaviorRegistry.require(modelId);
  const schema = model.getConfigSchema();

  return (
    <form>
      <h3>Configure {model.description}</h3>
      {schema.fields.map(field => (
        <div key={field.key}>
          <label>{field.label}</label>
          {field.type === 'number' && (
            <input
              type="number"
              min={field.min}
              max={field.max}
              defaultValue={field.default as number}
            />
          )}
          {field.type === 'boolean' && (
            <input
              type="checkbox"
              defaultChecked={field.default as boolean}
            />
          )}
          {field.type === 'select' && (
            <select defaultValue={field.default as string}>
              {field.options?.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
          {field.description && <p className="hint">{field.description}</p>}
        </div>
      ))}
    </form>
  );
}
```

---

## Part 6: Validation & Testing

### Model Validation on Registration

```typescript
/**
 * Validate model before registration
 */
function validateModel(model: BehaviorModel): void {
  // Check required methods exist
  if (typeof model.calculateThroughput !== 'function') {
    throw new Error(`Model ${model.id} missing calculateThroughput method`);
  }
  if (typeof model.calculateLatency !== 'function') {
    throw new Error(`Model ${model.id} missing calculateLatency method`);
  }
  if (typeof model.calculateUtilization !== 'function') {
    throw new Error(`Model ${model.id} missing calculateUtilization method`);
  }

  // Check version format (semver)
  if (!/^\d+\.\d+\.\d+$/.test(model.version)) {
    throw new Error(`Model ${model.id} has invalid version: ${model.version}`);
  }

  // Test basic functionality
  try {
    const schema = model.getConfigSchema();
    if (!schema || !Array.isArray(schema.fields)) {
      throw new Error('getConfigSchema must return valid schema');
    }
  } catch (error) {
    throw new Error(`Model ${model.id} getConfigSchema failed: ${error}`);
  }
}

// Enhanced register method:
class BehaviorModelRegistry {
  register(model: BehaviorModel): void {
    validateModel(model);  // Validate before adding
    // ... (rest of registration)
  }
}
```

### Model Testing Template

```typescript
/**
 * Standard test suite for all models
 */
describe('BehaviorModel: ${model.id}', () => {
  let model: BehaviorModel;

  beforeEach(() => {
    model = behaviorRegistry.require('model-id');
  });

  describe('Interface Compliance', () => {
    test('implements calculateThroughput', () => {
      expect(typeof model.calculateThroughput).toBe('function');
    });

    test('implements calculateLatency', () => {
      expect(typeof model.calculateLatency).toBe('function');
    });

    test('implements calculateUtilization', () => {
      expect(typeof model.calculateUtilization).toBe('function');
    });

    test('has valid version', () => {
      expect(model.version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('Behavior', () => {
    test('calculateThroughput returns valid result', () => {
      const result = model.calculateThroughput({
        incomingLoad: 100,
        nodeCapacity: 200,
      });

      expect(result.throughput).toBeGreaterThanOrEqual(0);
      expect(result.overflow).toBeGreaterThanOrEqual(0);
      expect(result.utilization).toBeGreaterThanOrEqual(0);
    });

    // ... (model-specific tests from validation-test-cases.md)
  });
});
```

---

## Part 7: Migration Guide

### Adding a New Model

**Step 1: Implement BehaviorModel interface**

```typescript
class MyCustomModel implements BehaviorModel {
  readonly id = 'my-custom-model';
  readonly type = 'advanced';
  readonly version = '1.0.0';
  readonly description = 'My custom behavior model';

  calculateThroughput(params: ThroughputParams): ThroughputResult {
    // Your implementation
  }

  calculateLatency(params: LatencyParams): LatencyResult {
    // Your implementation
  }

  calculateUtilization(params: UtilizationParams): UtilizationResult {
    // Your implementation
  }

  canHandle(nodeType: NodeType): boolean {
    return true; // Or your logic
  }

  getConfigSchema(): ConfigSchema {
    return { fields: [] }; // Your schema
  }
}
```

**Step 2: Register model**

```typescript
// In initializeBehaviorModels():
behaviorRegistry.register(new MyCustomModel());
```

**Step 3: Write tests**

```typescript
// tests/models/my-custom-model.test.ts
describe('MyCustomModel', () => {
  // Use template from Part 6
});
```

**Step 4: Update documentation**

Add entry to:
- `behavior-modeling-specification.md`
- `formula-reference-sheet.md`
- `validation-test-cases.md`

---

### Migrating from Simple to Queue Theory

**Before**:
```typescript
// User config:
{
  behaviorModel: 'simple-behavior-model'
}

// Result:
- Queue delay = (depth / rate) × 1000
- Simple formula, good approximation
```

**After**:
```typescript
// User config:
{
  behaviorModel: 'queue-theory-model',
  arrivalRate: 80,
  serviceRate: 100
}

// Result:
- Queue delay from M/M/1: W = 1/(μ-λ)
- More accurate for Poisson arrivals
- Validates stability (λ < μ)
```

**Code Changes**: NONE! Just config change.

---

## Part 8: Example Use Cases

### Use Case 1: Researcher Comparing Models

```typescript
/**
 * Compare simple vs queue theory models
 */
const simpleModel = behaviorRegistry.require('simple-behavior-model');
const queueModel = behaviorRegistry.require('queue-theory-model');

const params = {
  incomingLoad: 80,
  nodeCapacity: 100,
  queueDepth: 10,
  // ...
};

const simpleResult = simpleModel.calculateLatency(params);
const queueResult = queueModel.calculateLatency(params);

console.log('Simple model:', simpleResult.totalLatency, 'ms');
console.log('Queue theory:', queueResult.totalLatency, 'ms');
console.log('Difference:', Math.abs(simpleResult - queueResult), 'ms');
```

---

### Use Case 2: Plugin Developer Adding New Model

```typescript
/**
 * Third-party developer adds custom model
 */
class MyPluginModel implements BehaviorModel {
  // ... (implementation)
}

// In plugin initialization:
export function initializePlugin() {
  behaviorRegistry.register(new MyPluginModel());
  console.log('[Plugin] MyPluginModel registered');
}

// App loads plugin:
import { initializePlugin } from 'my-plugin';
initializePlugin();

// Now available to all users:
const model = behaviorRegistry.require('my-plugin-model');
```

---

### Use Case 3: A/B Testing Model Accuracy

```typescript
/**
 * Run simulation with different models, compare to real-world data
 */
const models = ['simple', 'queue-theory', 'advanced'];
const realWorldData = loadRealWorldMetrics();

for (const modelId of models) {
  const model = behaviorRegistry.require(modelId);
  const simulationResult = runSimulation(model);

  const accuracy = compareToRealWorld(simulationResult, realWorldData);
  console.log(`${modelId} accuracy:`, accuracy);
}

// Output:
// simple accuracy: 75%
// queue-theory accuracy: 92%
// advanced accuracy: 96%
```

---

## Summary

### What This Design Enables

1. **Start Simple**: Ship with MVP models, proven to work
2. **Progressive Enhancement**: Add advanced models without breaking changes
3. **User Choice**: Users select model based on accuracy needs
4. **Extensibility**: Third-party plugins can add models
5. **Testability**: Standardized testing for all models
6. **Maintainability**: Clear separation of concerns

### Key Takeaways

- **Interface Abstraction**: Engine doesn't know about specific models
- **Plugin Registry**: Central point for model discovery
- **Configuration Schema**: Dynamic UI generation
- **Fallback Strategy**: Graceful degradation to simpler models
- **Progressive Roadmap**: Clear path from MVP to advanced

### Next Steps

1. Implement `BehaviorModelRegistry`
2. Create `SimpleBehaviorModel` (MVP)
3. Validate against test cases
4. Integrate with simulation engine
5. Plan Stage 2: Queue Theory

---

**Last Updated**: 2026-02-24
**Maintainer**: Keep synchronized with behavior-modeling-specification.md
