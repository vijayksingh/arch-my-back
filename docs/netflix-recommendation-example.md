# Netflix Recommendation System - Real-World Example

A comprehensive walkthrough of Netflix's recommendation architecture showcasing how multiple widgets work together to explain a complex real-world system.

## Overview

This example demonstrates Netflix's recommendation system using:
- **Canvas Architecture Diagram** - Microservices topology with data flows
- **Timeline Widget** - User request lifecycle
- **Comparison Table Widget** - ML algorithm evaluation
- **Trade-offs Card Widget** - Architectural decision documentation
- **Annotation Layer** - Educational context and explanations

## Architecture Summary

Netflix's recommendation system processes over **700 billion events per day** through a sophisticated microservices architecture that combines:

1. **Real-time data processing** using Apache Kafka (Keystone platform)
2. **Stream processing** with Apache Flink
3. **Real-Time Distributed Graph** (RDG) for personalization
4. **Multi-task AI foundation models** (2025-2026 architecture)
5. **Hybrid ML approaches** (collaborative filtering + content-based + deep learning)

## Template Canvas Structure

The template creates a multi-layer architecture diagram showing:

### Client Layer
- Web, Mobile, and Smart TV clients
- All connected through a central API Gateway

### Microservices Layer
- **User Profile Service** - Manages user preferences and viewing history
- **Content Catalog Service** - Metadata about shows and movies
- **Recommendation Service** - Generates candidate recommendations
- **Ranking Service** - Scores and ranks candidates
- **Personalization Service** - Applies user-specific personalization

### Data Streaming Layer
- **Apache Kafka (Keystone)** - Processes 700B+ events/day
- **Apache Flink** - Real-time stream processing
- **RDG Ingestion Layer** - Updates distributed graph in real-time

### Storage Layer
- **Apache Cassandra (KVDAL)** - Stores graph nodes and edges (5M+ writes/sec)
- **S3 Feature Store** - ML features and training data
- **PostgreSQL** - Metadata and catalog information
- **Redis** - Edge caching for pre-computed recommendations

### ML Model Layer
- **Collaborative Filtering** - User similarity patterns
- **Content-Based Model** - Content similarity matching
- **Deep Neural Networks** - Complex pattern recognition
- **Multi-Task Foundation Model** - Unified 2025-2026 architecture
- **LanceDB Media Data Lake** - Multimodal embeddings for video/audio

### Analytics Layer
- **Apache Spark** - Batch processing and model retraining

## Adding Widgets to the Design

After loading the Netflix Recommendation template, add these widgets to create a comprehensive educational experience:

### 1. Timeline Widget: Request Lifecycle

Shows the journey from user action to personalized recommendations.

```typescript
{
  widgetId: "timeline",
  config: {
    name: "Netflix Recommendation Request Flow",
    showSwimlanes: true,
    animate: true
  },
  input: {
    events: [
      {
        id: "e1",
        timestamp: 0,
        title: "User Opens Netflix",
        description: "User launches app on Smart TV",
        type: "start",
        swimlaneId: "client"
      },
      {
        id: "e2",
        timestamp: 50,
        title: "API Gateway Request",
        description: "GET /recommendations?userId=12345",
        type: "event",
        swimlaneId: "gateway"
      },
      {
        id: "e3",
        timestamp: 75,
        title: "Check Redis Cache",
        description: "Look for pre-computed recommendations",
        type: "decision",
        swimlaneId: "cache"
      },
      {
        id: "e4",
        timestamp: 100,
        title: "Cache Miss - Query RDG",
        description: "Fetch user graph from Cassandra KVDAL",
        type: "event",
        swimlaneId: "graph"
      },
      {
        id: "e5",
        timestamp: 150,
        title: "Generate Candidates",
        description: "Recommendation Service creates candidate list using ML models",
        type: "event",
        swimlaneId: "ml"
      },
      {
        id: "e6",
        timestamp: 200,
        title: "Rank & Score",
        description: "Deep Learning model ranks candidates",
        type: "event",
        swimlaneId: "ml"
      },
      {
        id: "e7",
        timestamp: 250,
        title: "Personalize Results",
        description: "Multi-task foundation model applies user preferences",
        type: "event",
        swimlaneId: "personalization"
      },
      {
        id: "e8",
        timestamp: 275,
        title: "Cache Results",
        description: "Store in Redis for next request",
        type: "event",
        swimlaneId: "cache"
      },
      {
        id: "e9",
        timestamp: 300,
        title: "Return Recommendations",
        description: "API returns personalized homepage rows",
        type: "end",
        swimlaneId: "gateway"
      },
      {
        id: "e10",
        timestamp: 350,
        title: "User Sees Recommendations",
        description: "Personalized rows displayed < 100ms latency",
        type: "end",
        swimlaneId: "client"
      }
    ],
    swimlanes: [
      { id: "client", label: "Client" },
      { id: "gateway", label: "API Gateway" },
      { id: "cache", label: "Caching" },
      { id: "graph", label: "Real-Time Graph" },
      { id: "ml", label: "ML Models" },
      { id: "personalization", label: "Personalization" }
    ]
  }
}
```

**Key Insight**: Total latency < 100ms despite complex ML pipeline, achieved through edge caching and pre-computation.

### 2. Comparison Table Widget: ML Algorithms

Compares different machine learning approaches used by Netflix.

```typescript
{
  widgetId: "comparison-table",
  config: {
    name: "Netflix ML Approaches Comparison",
    striped: true,
    highlightOnHover: true
  },
  input: {
    columns: [
      {
        id: "collaborative",
        title: "Collaborative Filtering",
        description: "User-based similarity"
      },
      {
        id: "content",
        title: "Content-Based",
        description: "Item metadata matching"
      },
      {
        id: "deep",
        title: "Deep Neural Networks",
        description: "Complex pattern recognition"
      },
      {
        id: "foundation",
        title: "Multi-Task Foundation (2025)",
        description: "Unified multi-domain model"
      }
    ],
    rows: [
      {
        id: "approach",
        label: "Core Approach",
        cells: {
          collaborative: "Find similar users, recommend what they watched",
          content: "Match content metadata (genre, actors, themes)",
          deep: "Learn latent patterns from billions of interactions",
          foundation: "Single model learns shared representations across domains"
        }
      },
      {
        id: "strengths",
        label: "Strengths",
        cells: {
          collaborative: {
            type: "pros-cons",
            content: "Collaborative Filtering Strengths",
            pros: [
              "Discovers unexpected connections",
              "No content metadata needed",
              "Leverages wisdom of the crowd"
            ],
            cons: []
          },
          content: {
            type: "pros-cons",
            content: "Content-Based Strengths",
            pros: [
              "Works for new content (no cold start)",
              "Explainable recommendations",
              "User-specific taste profiles"
            ],
            cons: []
          },
          deep: {
            type: "pros-cons",
            content: "Deep Learning Strengths",
            pros: [
              "Captures non-linear relationships",
              "Handles high-dimensional data",
              "Continuous learning from interactions"
            ],
            cons: []
          },
          foundation: {
            type: "pros-cons",
            content: "Foundation Model Strengths",
            pros: [
              "Learns shared user preferences",
              "Reduces model proliferation",
              "Better generalization across use cases"
            ],
            cons: []
          }
        }
      },
      {
        id: "weaknesses",
        label: "Weaknesses",
        cells: {
          collaborative: {
            type: "pros-cons",
            content: "Collaborative Filtering Weaknesses",
            pros: [],
            cons: [
              "Cold start problem for new users",
              "Sparsity in user-item matrix",
              "Popularity bias"
            ]
          },
          content: {
            type: "pros-cons",
            content: "Content-Based Weaknesses",
            pros: [],
            cons: [
              "Limited serendipity",
              "Over-specialization risk",
              "Requires rich metadata"
            ]
          },
          deep: {
            type: "pros-cons",
            content: "Deep Learning Weaknesses",
            pros: [],
            cons: [
              "High computational cost",
              "Black box (hard to debug)",
              "Requires massive training data"
            ]
          },
          foundation: {
            type: "pros-cons",
            content: "Foundation Model Weaknesses",
            pros: [],
            cons: [
              "Complex to train and serve",
              "Harder to debug individual predictions",
              "Requires significant infrastructure"
            ]
          }
        }
      },
      {
        id: "latency",
        label: "Inference Latency",
        cells: {
          collaborative: "~10-20ms (pre-computed)",
          content: "~5-10ms (cached embeddings)",
          deep: "~50-100ms (GPU inference)",
          foundation: "~30-50ms (optimized serving)"
        }
      },
      {
        id: "scale",
        label: "Scale Requirements",
        cells: {
          collaborative: "Moderate - User similarity matrix",
          content: "Low - Content embeddings only",
          deep: "High - Large model + GPU clusters",
          foundation: "Very High - Multi-domain unified training"
        }
      },
      {
        id: "adoption",
        label: "Netflix Usage",
        cells: {
          collaborative: "Core algorithm since early days",
          content: "Metadata-rich catalog matching",
          deep: "Ranking and personalization layers",
          foundation: "2025-2026 consolidation effort"
        }
      }
    ]
  }
}
```

**Key Insight**: Netflix uses a **hybrid ensemble** combining all approaches, not a single algorithm. Over 80% of viewing comes from recommendations.

### 3. Trade-offs Card Widget: Architectural Decisions

Documents key architectural decisions and trade-offs.

```typescript
{
  widgetId: "tradeoffs-card",
  config: {
    name: "Netflix Architecture Trade-offs",
    showAlternatives: true,
    exportAsADR: true
  },
  input: {
    title: "Real-Time vs Batch Processing for Recommendations",
    context: "Netflix needs to balance recommendation freshness with computational cost. User behavior changes continuously, but recomputing recommendations for 300M+ users on every action is prohibitively expensive.",
    pros: [
      "Real-time updates capture immediate user behavior changes",
      "Enables live event recommendations (sports, breaking news)",
      "Better user experience with <100ms latency",
      "Handles trending content spikes automatically"
    ],
    cons: [
      "Higher infrastructure cost (Kafka + Flink at massive scale)",
      "Increased complexity in stream processing pipelines",
      "More difficult to debug compared to batch jobs",
      "Requires sophisticated caching strategy to manage cost"
    ],
    decision: "Hybrid approach: Pre-compute recommendations in batch (Apache Spark nightly), update in real-time for active users (Kafka + Flink), cache at edge (Redis). This balances cost (~10x cheaper than pure real-time) while maintaining sub-100ms latency for active users.",
    alternatives: [
      {
        id: "pure-batch",
        name: "Pure Batch Processing",
        description: "Nightly Spark jobs only, no real-time updates",
        pros: [
          "Simplest implementation",
          "Lowest infrastructure cost",
          "Easier debugging and monitoring",
          "Proven at scale (many companies use this)"
        ],
        cons: [
          "Stale recommendations (24-hour lag)",
          "Can't handle trending content",
          "Poor experience for new users",
          "Misses session-based behavior"
        ]
      },
      {
        id: "pure-realtime",
        name: "Pure Real-Time Processing",
        description: "All recommendations computed on-demand",
        pros: [
          "Freshest possible recommendations",
          "Immediate adaptation to user behavior",
          "No cache invalidation complexity",
          "Best user experience"
        ],
        cons: [
          "Extremely high cost (10x+ infrastructure)",
          "Complex failure modes under load spikes",
          "Difficult to achieve <100ms latency at 300M scale",
          "Wasteful for inactive users"
        ]
      },
      {
        id: "lambda-architecture",
        name: "Lambda Architecture",
        description: "Separate batch and speed layers merged at query time",
        pros: [
          "Balances batch efficiency with real-time updates",
          "Can recompute batch layer if speed layer fails",
          "Well-documented pattern"
        ],
        cons: [
          "Two codebases to maintain",
          "Merge logic adds latency and complexity",
          "Eventual consistency can confuse users",
          "Higher operational burden"
        ]
      }
    ]
  }
}
```

**Additional Trade-offs to Document**:

1. **Microservices vs Monolith**
   - Decision: Microservices for independent scaling and deployment
   - Trade-off: Higher operational complexity vs team autonomy

2. **Cassandra vs PostgreSQL for Graph Storage**
   - Decision: Cassandra KVDAL for 5M+ writes/sec at low latency
   - Trade-off: Eventual consistency vs strong consistency

3. **Multi-Task Model Consolidation (2025-2026)**
   - Decision: Merge separate models into unified foundation model
   - Trade-off: Simplifies architecture but harder to debug individual predictions

### 4. Annotation Layer Widget: Educational Context

Add annotations to explain key concepts directly on the canvas.

```typescript
{
  widgetId: "annotation-layer",
  config: {
    name: "Netflix Architecture Annotations"
  },
  input: {
    annotations: [
      {
        id: "kafka-scale",
        targetNodeId: "kafka-events",
        title: "Keystone Platform Scale",
        content: "Processes 700+ billion events per day across 36 Kafka clusters. Events include: user views, clicks, pauses, searches, ratings, and device telemetry.",
        position: "right",
        type: "info"
      },
      {
        id: "rdg-innovation",
        targetNodeId: "rdg-ingestion",
        title: "Real-Time Distributed Graph",
        content: "Converts events into graph primitives (nodes = entities, edges = relationships). Enables sub-second graph updates for 300M+ users. Replaces older batch graph systems.",
        position: "bottom",
        type: "highlight"
      },
      {
        id: "cassandra-perf",
        targetNodeId: "cassandra-kvdal",
        title: "KVDAL Performance",
        content: "Key-Value Data Abstraction Layer built on Cassandra. Handles 5M+ writes/sec with tunable consistency. Provides high availability without direct Cassandra management.",
        position: "bottom",
        type: "info"
      },
      {
        id: "foundation-model",
        targetNodeId: "ml-foundation",
        title: "2025-2026 Architecture Shift",
        content: "Multi-task foundation model learns shared user preferences across domains (homepage, search, notifications). Consolidates multiple specialized models into one, improving performance and reducing complexity.",
        position: "right",
        type: "highlight"
      },
      {
        id: "hybrid-caching",
        targetNodeId: "redis-cache",
        title: "Hybrid Caching Strategy",
        content: "Pre-computed recommendations cached at edge nodes. Real-time re-ranking based on immediate context. Separates heavy computation from low-latency serving.",
        position: "left",
        type: "info"
      },
      {
        id: "media-lake",
        targetNodeId: "lancedb-media",
        title: "ML-First Media Data Lake",
        content: "LanceDB stores multimodal AI embeddings for video, audio, and subtitles. Enables similarity search, HDR restoration, and automated quality checks.",
        position: "bottom",
        type: "highlight"
      }
    ]
  }
}
```

## Key Metrics & Performance

| Metric | Value | Source |
|--------|-------|--------|
| Daily Events Processed | 700+ billion | Keystone Platform |
| Graph Writes/Second | 5+ million | Cassandra KVDAL |
| Recommendation Latency | < 100ms | End-to-end SLA |
| Viewing from Recommendations | 80%+ | Product Impact |
| Active Users | 300+ million | Global Scale |

## Data Flow Walkthrough

1. **User Action** → Client sends event to API Gateway
2. **Event Ingestion** → API Gateway publishes to Kafka
3. **Stream Processing** → Flink processes events in real-time
4. **Graph Update** → RDG Ingestion writes to Cassandra (5M writes/sec)
5. **Feature Update** → Flink updates S3 Feature Store
6. **ML Inference** → Models generate candidate recommendations
7. **Ranking** → Deep learning ranks and scores candidates
8. **Personalization** → Foundation model applies user preferences
9. **Caching** → Results cached in Redis at edge
10. **Response** → Recommendations returned to client (<100ms)

## Educational Value

This example demonstrates:

✅ **Real-world complexity** - Not a toy example, based on actual Netflix architecture
✅ **Modern patterns** - Microservices, event streaming, real-time processing
✅ **Scale challenges** - 300M users, 700B events/day, <100ms latency
✅ **Evolution over time** - Shows 2025-2026 foundation model shift
✅ **Trade-off thinking** - Documents why decisions were made
✅ **Multi-widget composition** - Timeline + Comparison + Trade-offs + Annotations work together

## Sources & Further Reading

### Netflix Tech Blog
- [Real-Time Distributed Graph - Part 1](https://netflixtechblog.com/how-and-why-netflix-built-a-real-time-distributed-graph-part-1-ingesting-and-processing-data-80113e124acc)
- [Lessons from Consolidating ML Models](https://netflixtechblog.medium.com/lessons-learnt-from-consolidating-ml-models-in-a-large-scale-recommendation-system-870c5ea5eb4a)
- [RecSysOps Best Practices](https://netflixtechblog.medium.com/recsysops-best-practices-for-operating-a-large-scale-recommender-system-95bbe195a841)

### System Design Resources
- [Netflix Architecture 2026](https://www.clickittech.com/software-development/netflix-architecture/)
- [How Netflix Uses Machine Learning](https://www.brainforge.ai/blog/how-netflix-uses-machine-learning-ml-to-create-perfect-recommendations)
- [Inside Netflix's Architecture](https://rockybhatia.substack.com/p/inside-netflixs-architecture-how)

### Research Papers
- Netflix Research: [Recommendations](https://research.netflix.com/research-area/recommendations)
- Netflix Research: [Machine Learning](https://research.netflix.com/research-area/machine-learning)

## Implementation Notes

### Template Limitations
The current `DesignTemplate` type only supports canvas nodes and edges. Widgets must be added manually through the UI after loading the template. Future enhancement could extend `DesignTemplate` to include:

```typescript
export interface DesignTemplate {
  slug: string;
  title: string;
  description: string;
  nodes: CanvasNode[];
  edges: ArchEdge[];
  widgets?: WidgetInstance[]; // ← Enhancement needed
  widgetConnections?: WidgetConnection[]; // ← For widget composition
}
```

### Widget Data Preparation
All widget input data above is formatted according to each widget's JSON schema. To add widgets:

1. Load the Netflix Recommendation template
2. Open the Widget Sidebar
3. Drag each widget type onto the canvas
4. Configure using the JSON data provided above
5. Position widgets around the architecture diagram

### Verification Steps
After adding all widgets:
- ✅ Timeline animation plays smoothly
- ✅ Comparison table columns are sortable/filterable
- ✅ Trade-offs card alternatives expand/collapse
- ✅ Annotations appear next to correct nodes
- ✅ All widgets render without errors
- ✅ Export to PNG/SVG includes widgets

## Next Steps

To make this example even more comprehensive:

1. **Add Code Block Widget** - Show actual Netflix ML inference code snippets
2. **Add Code Diff Widget** - Demonstrate before/after foundation model migration
3. **Add Breadcrumb Widget** - Navigation for multi-page architecture docs
4. **Create Follow-up Examples**:
   - Spotify Recommendation System (music domain)
   - Amazon Product Recommendations (e-commerce)
   - YouTube Video Recommendations (video platform)
   - LinkedIn Job Recommendations (professional network)

Each follow-up would highlight different architectural patterns and trade-offs unique to their domain.
