import type { Walkthrough } from '@/types/walkthrough';

export const uberWalkthrough: Walkthrough = {
  id: "uber-dispatch",
  slug: "uber-dispatch",
  title: "Uber Real-Time Dispatch System",
  description: "Build Uber's geo-spatial matching engine that connects millions of riders with drivers in seconds",
  learningGoals: [
    "Master geo-spatial indexing: H3, Geohash, Quadtree",
    "Build real-time dispatch algorithms with ETA prediction",
    "Implement surge pricing and supply-demand forecasting",
    "Design shared ride (Pool) matching logic",
    "Handle 10M+ GPS updates per second at scale"
  ],
  estimatedMinutes: 105,
  difficulty: "advanced",
  tags: [
    "distributed-systems",
    "geo-spatial",
    "real-time",
    "matching-algorithms",
    "surge-pricing"
  ],
  sources: [
    {
      title: "Uber Engineering Blog",
      url: "https://www.uber.com/blog/engineering/"
    },
    {
      title: "H3: Uber's Hexagonal Hierarchical Spatial Index",
      url: "https://www.uber.com/blog/h3/"
    }
  ],

  steps: [
    // ==================== PHASE 1: PROBLEM INTRODUCTION ====================
    {
      id: "uber-intro",
      phase: "intro",
      title: "The Uber Matching Problem",
      estimatedMinutes: 5,
      canvasOperations: [],
      content: `# The Real-Time Dispatch Challenge

When you request an Uber, the app finds you a driver in **under 2 seconds**. This seems simple, but at scale it's one of the most complex geo-spatial problems in tech.

## The Scale Challenge

**Uber's Real-Time Problem:**
- **10 million** active GPS points updating every 4 seconds
- **40 million** location updates per second globally
- Riders expect matches in **< 2 seconds**
- Driver locations change constantly (moving at 30+ mph)
- Multiple riders requesting in the same area simultaneously

## What Makes This Hard?

**Naive Approach:** Check every driver
- 10M drivers in a city → 10M distance calculations per request
- O(n) complexity → **too slow** at scale
- By the time you finish calculating, locations have changed!

**Uber's Solution:**
- Geo-spatial indexing (H3 hexagonal grids)
- Predictive ETA models (ML-based)
- Supply-demand forecasting
- Dynamic surge pricing

In this walkthrough, you'll build Uber's dispatch system from first principles, starting with the naive approach and evolving to the production architecture.`,

      widgets: [
        {
          type: 'quiz',
          question: "What's the PRIMARY constraint for Uber's dispatch system?",
          options: [
            {
              id: 'opt-1',
              text: "Finding the absolute closest driver",
              correct: false,
              explanation: ""
            },
            {
              id: 'opt-2',
              text: "Matching in under 2 seconds while handling 10M drivers",
              correct: true,
              explanation: "Speed at scale is critical. Users abandon if matching takes >3s. Uber prioritizes 'good enough fast' over 'perfect slow' - finding a nearby driver in <2s beats finding the absolute closest in 10s."
            },
            {
              id: 'opt-3',
              text: "Minimizing server costs",
              correct: false,
              explanation: ""
            },
            {
              id: 'opt-4',
              text: "Ensuring drivers accept rides",
              correct: false,
              explanation: ""
            }
          ]
        }
      ],
      nextCondition: 'click-next'
    },

    {
      id: "uber-naive",
      phase: "naive",
      title: "Naive Approach: Linear Search",
      estimatedMinutes: 8,
      canvasOperations: [],
      content: `# Attempt 1: Check Every Driver

Let's start with the obvious solution and see why it fails at scale.

## Simple Nearest-Driver Algorithm

The naive approach: when a rider requests, calculate distance to every active driver and pick the closest.

## Why This Fails at Scale

**Performance Analysis:**
- **Time Complexity:** O(n) where n = number of active drivers
- **San Francisco:** 5,000 drivers → 5,000 calculations
- **New York:** 20,000 drivers → 20,000 calculations
- **Entire US:** 1,000,000 drivers → **disaster**

**Real Numbers:**
- Each haversine calculation: ~500 nanoseconds
- 1M drivers × 500ns = **500ms just for distance calculations**
- Add database queries, network latency → **>1 second per request**
- With 1000 concurrent requests → **server overload**

**The Stale Data Problem:**
- Drivers move at 30-60 mph
- By the time you finish calculating (1s), locations are **50-100 feet off**
- The "nearest" driver might no longer be nearest!

We need a fundamentally different approach: **geo-spatial indexing**.`,

      widgets: [
        {
          type: 'code-block',
          title: "Naive Dispatch Implementation",
          language: "typescript",
          code: `// Naive dispatch: O(n) time complexity
function findNearestDriver(
  riderLat: number,
  riderLon: number,
  drivers: Driver[]
): Driver | null {
  let nearest: Driver | null = null;
  let minDistance = Infinity;

  // Check EVERY driver - this is the problem!
  for (const driver of drivers) {
    const distance = haversineDistance(
      riderLat, riderLon,
      driver.lat, driver.lon
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearest = driver;
    }
  }

  return nearest;
}

// Haversine formula: distance between two GPS points
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}`,
          highlights: [3, 9]
        },
        {
          type: 'quiz',
          question: "If Uber has 10M active drivers and gets 100K simultaneous requests, how many distance calculations occur with naive search?",
          options: [
            {
              id: 'opt-1',
              text: "100K calculations",
              correct: false,
              explanation: ""
            },
            {
              id: 'opt-2',
              text: "10M calculations",
              correct: false,
              explanation: ""
            },
            {
              id: 'opt-3',
              text: "1 Trillion (10M × 100K) calculations",
              correct: true,
              explanation: "Each of 100K requests must check all 10M drivers: 100K × 10M = 1 trillion calculations. Even at 500ns each, that's 500 seconds of CPU time - completely infeasible!"
            },
            {
              id: 'opt-4',
              text: "100B calculations",
              correct: false,
              explanation: ""
            }
          ]
        }
      ],
      userAction: {
        type: 'answer-quiz',
        correctAnswerIds: ['opt-3']
      },
      nextCondition: 'quiz-correct'
    },

    // ==================== PHASE 2: GEO-SPATIAL INDEXING ====================
    {
      id: "uber-quadtree",
      phase: "complexity",
      title: "Geo-Spatial Indexing: Quadtree",
      estimatedMinutes: 10,
      canvasOperations: [],
      content: `# Breaking Up the Map: Quadtree

Instead of checking every driver, what if we **only check drivers in the same area**?

## Quadtree: Recursive Grid Subdivision

A **quadtree** recursively divides a 2D space into four quadrants until each region has few enough points.

**How it works:**
1. Start with entire map as one region
2. If region has >N points (e.g., 100), split into 4 sub-regions
3. Recursively split sub-regions until each has ≤N points
4. To find nearest driver: search only the rider's region (+ nearby regions)

**Example:**
\`\`\`
[Entire San Francisco]
    ├─ NW (Golden Gate)
    │   ├─ NW (Marina)
    │   ├─ NE (Fisherman's Wharf) ← Only search here!
    │   ├─ SW (Presidio)
    │   └─ SE (Pacific Heights)
    ├─ NE (Embarcadero)
    ├─ SW (Sunset District)
    └─ SE (Mission District)
\`\`\`

**Performance:**
- **Time Complexity:** O(log n) to find region + O(k) to check drivers in region
- If k=100 drivers per leaf region: **100 calculations instead of 1M!**
- **10,000x speedup**`,

      widgets: [
        {
          type: 'tradeoffs',
          title: "Quadtree Trade-offs",
          decision: "Quadtree improves query speed but adds complexity",
          options: [
            {
              label: "Use Quadtree",
              pros: [
                "10,000x faster queries (O(log n) vs O(n))",
                "Scales to millions of drivers",
                "Easy to implement and visualize"
              ],
              cons: [
                "Uneven driver distribution → unbalanced tree",
                "Drivers crossing boundaries → frequent updates",
                "Doesn't handle Earth's curvature well",
                "Complex rebalancing logic"
              ]
            },
            {
              label: "Stick with Linear Search",
              pros: [
                "Dead simple - no indexing overhead",
                "Always finds absolute closest driver",
                "No stale index issues"
              ],
              cons: [
                "O(n) query time - unacceptable at scale",
                "Can't handle 10M drivers",
                "Doesn't scale horizontally"
              ]
            }
          ]
        },
        {
          type: 'quiz',
          question: "Why are quadtrees problematic for global ride-sharing?",
          options: [
            {
              id: 'opt-1',
              text: "They're too slow for real-time queries",
              correct: false,
              explanation: "Quadtrees are actually fast! The problem isn't speed."
            },
            {
              id: 'opt-2',
              text: "They don't handle Earth's spherical geometry well",
              correct: true,
              explanation: "Quadtrees assume flat 2D space. On a sphere (Earth), rectangular regions distort near poles. A 1km × 1km square in San Francisco is very different from a 1km × 1km square near the Arctic Circle!"
            },
            {
              id: 'opt-3',
              text: "They can't index more than 1M points",
              correct: false,
              explanation: "Quadtrees can handle millions of points. That's not the issue."
            },
            {
              id: 'opt-4',
              text: "They require too much memory",
              correct: false,
              explanation: "Memory isn't the primary concern for quadtrees."
            }
          ]
        }
      ],
      nextCondition: 'click-next'
    },

    {
      id: "uber-geohash",
      phase: "complexity",
      title: "Geohash: String-Based Indexing",
      estimatedMinutes: 12,
      canvasOperations: [],
      content: `# Geohash: Encoding Location as Strings

**Geohash** converts lat/lon coordinates into short strings. Nearby locations share common prefixes.

## How Geohash Works

**Encoding Process:**
1. Repeatedly divide world into halves (lat & lon)
2. Encode each division as a bit (0 or 1)
3. Interleave lat/lon bits and convert to base32 string

**Example:**
- **San Francisco:** \`9q8yy\` (6-char precision ≈ ±610m)
- **Golden Gate Bridge:** \`9q8zn\` (shares prefix \`9q8\`)
- **Los Angeles:** \`9q5c\` (different prefix)

**Nearby locations share prefixes:**
\`\`\`
9q8yy    ← SF Downtown
9q8yz    ← Just north
9q8yw    ← Just south
9q8zn    ← Golden Gate (shares 9q8)
9q5      ← LA (different region entirely)
\`\`\`

## Geohash Advantages

**1. Database-Friendly:**
- Store as indexed string column
- Use prefix queries: \`WHERE geohash LIKE '9q8yy%'\`
- Works with any database (MongoDB, Postgres, Redis)

**2. Precision Control:**
| Characters | Cell Size | Use Case |
|-----------|-----------|----------|
| 4 | ±20km | City-level |
| 5 | ±2.4km | Neighborhood |
| 6 | ±610m | **Uber default** |
| 7 | ±76m | Precise matching |
| 8 | ±19m | Building-level |

**3. Simple API:**
- Encode: lat/lon → string
- Decode: string → lat/lon
- Neighbors: get 8 surrounding cells

**The Gotcha: Boundary Issues**
- Drivers at geohash boundaries might be missed
- **Solution:** Always check neighboring cells (8 extra queries)`,

      widgets: [
        {
          type: 'code-block',
          title: "Geohash Implementation",
          language: "typescript",
          code: `// Geohash-based driver search
import geohash from 'ngeohash';

function findNearbyDrivers(
  riderLat: number,
  riderLon: number,
  precision: number = 6  // ±610m accuracy
): Driver[] {
  // Encode rider location as geohash
  const riderHash = geohash.encode(riderLat, riderLon, precision);

  // Get drivers in same geohash cell
  let candidates = db.drivers.find({
    geohash: { $regex: \`^\${riderHash}\` }  // Prefix match!
  });

  // Also check neighboring cells (8 surrounding cells)
  const neighbors = geohash.neighbors(riderHash);
  for (const neighborHash of Object.values(neighbors)) {
    candidates.push(...db.drivers.find({
      geohash: { $regex: \`^\${neighborHash}\` }
    }));
  }

  return candidates;
}

// Update driver location (called every 4 seconds)
function updateDriverLocation(
  driverId: string,
  lat: number,
  lon: number
) {
  const hash = geohash.encode(lat, lon, 6);

  db.drivers.update(
    { id: driverId },
    { lat, lon, geohash: hash, updatedAt: Date.now() }
  );
}`,
          highlights: [11, 16, 17]
        },
        {
          type: 'quiz',
          question: "A driver is at geohash '9q8yy9'. The rider is at '9q8yy8' (literally next door). Why might naive geohash search miss this driver?",
          options: [
            {
              id: 'opt-1',
              text: "The precision is too high",
              correct: false,
              explanation: "Precision isn't the problem here."
            },
            {
              id: 'opt-2',
              text: "Geohash cells have hard boundaries - neighboring cells have different prefixes",
              correct: true,
              explanation: "Even though the driver and rider are neighbors, their geohashes differ ('9q8yy9' vs '9q8yy8'). You MUST check neighboring cells (8 surrounding) to avoid missing nearby drivers at boundaries."
            },
            {
              id: 'opt-3',
              text: "The driver is moving too fast",
              correct: false,
              explanation: "Speed isn't the issue - it's about cell boundaries."
            },
            {
              id: 'opt-4',
              text: "Database indexes don't work with strings",
              correct: false,
              explanation: "Database string indexes work fine. The issue is cell boundaries."
            }
          ]
        }
      ],
      nextCondition: 'click-next'
    },

    {
      id: "uber-h3",
      phase: "real",
      title: "H3: Uber's Hexagonal Grid",
      estimatedMinutes: 15,
      canvasOperations: [],
      content: `# H3: Uber's Production Solution

Uber uses **H3**, a hexagonal grid system developed in-house and open-sourced.

## Why Hexagons Beat Squares

**The Neighbor Problem:**
- **Squares:** corner neighbors are √2 farther than edge neighbors
- **Hexagons:** all 6 neighbors are equidistant from center!

**Visual:**
\`\`\`
Squares (4 edge + 4 corner neighbors):
  [X] [N] [X]      Corner distance: √2 × edge
  [N] [C] [N]      Uneven coverage!
  [X] [N] [X]

Hexagons (6 equal neighbors):
      [N]
  [N] [C] [N]      All neighbors same distance
      [N] [N]      Perfect coverage!
        [N]
\`\`\`

## H3 Resolution Levels

H3 uses **16 resolution levels** (0-15), each ~7× more precise than previous:

| Resolution | Hexagon Edge | Use Case |
|-----------|--------------|----------|
| 5 | ~23 km | Metropolitan area |
| 6 | ~3.3 km | City district |
| 7 | ~470 m | Neighborhood |
| **8** | **~70 m** | **Uber default** |
| 9 | ~10 m | Building-level |
| 10 | ~1.4 m | Precise positioning |`,

      widgets: [
        {
          type: 'code-block',
          title: "H3-Based Dispatch Implementation",
          language: "typescript",
          code: `import { latLngToCell, gridDisk, cellToBoundary } from 'h3-js';

// Uber's H3-based dispatch
function findDriversH3(
  riderLat: number,
  riderLon: number,
  resolution: number = 8  // ~70m hexagons
): Driver[] {
  // Convert rider location to H3 cell
  const riderCell = latLngToCell(riderLat, riderLon, resolution);

  // Get K-ring of cells (rider's cell + 1 ring of neighbors)
  // gridDisk(cell, 1) returns 1 + 6 = 7 cells
  const searchCells = gridDisk(riderCell, 1);

  // Query drivers in these cells (indexed by h3Cell)
  const drivers = db.drivers.find({
    h3Cell: { $in: searchCells },
    status: 'available'
  });

  return drivers;
}

// Update driver location (every 4s)
function updateDriverH3(
  driverId: string,
  lat: number,
  lon: number
) {
  const h3Cell = latLngToCell(lat, lon, 8);

  db.drivers.update(
    { id: driverId },
    {
      lat, lon,
      h3Cell,  // Index this field!
      updatedAt: Date.now()
    }
  );
}

// Example: San Francisco ride request
const sfDrivers = findDriversH3(37.7749, -122.4194, 8);
// Searches ~7 hexagons (rider cell + 6 neighbors)
// Each hex ~70m edge → total search area ~0.15 km²
// In dense SF: ~50-200 candidate drivers instead of 5000!`,
          highlights: [10, 14, 15]
        },
        {
          type: 'comparison-table',
          title: "Geo-Spatial Index Comparison",
          columns: ["Feature", "Quadtree", "Geohash", "H3 (Uber)"],
          rows: [
            {
              label: "Cell Shape",
              values: ["Rectangles", "Rectangles", "Hexagons"]
            },
            {
              label: "Neighbor Distance",
              values: ["Uneven (√2 variance)", "Uneven (√2 variance)", "Uniform (all equal)"]
            },
            {
              label: "Query Complexity",
              values: ["O(log n)", "O(1) prefix search", "O(1) index lookup"]
            },
            {
              label: "Update Overhead",
              values: ["High (rebalance)", "Low (just update string)", "Low (update cell ID)"]
            },
            {
              label: "Boundary Handling",
              values: ["Complex", "Check 8 neighbors", "Check 6 neighbors"]
            },
            {
              label: "Database Integration",
              values: ["Custom", "String index", "String/Number index"]
            },
            {
              label: "Spherical Earth",
              values: ["Poor", "Okay", "Excellent"]
            }
          ]
        },
        {
          type: 'quiz',
          question: "Why do hexagons provide better coverage than squares for driver search?",
          options: [
            {
              id: 'opt-1',
              text: "Hexagons are easier to compute",
              correct: false,
              explanation: "Computation complexity isn't the main advantage."
            },
            {
              id: 'opt-2',
              text: "Hexagons look nicer on maps",
              correct: false,
              explanation: "Aesthetics aren't the reason!"
            },
            {
              id: 'opt-3',
              text: "All hexagon neighbors are equidistant, eliminating coverage gaps",
              correct: true,
              explanation: "In a square grid, corner neighbors are 41% farther than edge neighbors (√2 ≈ 1.41). Hexagons have 6 neighbors all at the same distance, ensuring uniform search radius and no coverage gaps."
            },
            {
              id: 'opt-4',
              text: "Hexagons use less memory",
              correct: false,
              explanation: "Memory usage is similar between square and hexagonal grids."
            }
          ]
        }
      ],
      nextCondition: 'click-next'
    },

    // ==================== PHASE 3: REAL UBER ARCHITECTURE ====================
    {
      id: "uber-dispatch-service",
      phase: "real",
      title: "Uber's Dispatch Service Architecture",
      estimatedMinutes: 12,
      canvasOperations: [],
      content: `# Production Dispatch System

Now that we understand H3 indexing, let's build Uber's real dispatch architecture.

## High-Level Architecture

**Core Services:**
1. **DISCO (Dispatch Optimization)** - Core matching engine
2. **Supply Service** - Tracks driver locations (10M GPS updates/sec)
3. **Demand Service** - Handles ride requests
4. **ETA Service** - ML-based arrival time prediction
5. **Pricing Service** - Dynamic surge pricing

**Data Flow:**

## Key Optimizations

**1. Parallel Offer Strategy**
- Don't offer to just 1 driver (they might reject!)
- Send to top 3-5 drivers **simultaneously**
- First to accept wins
- Cancel other offers immediately

**2. H3 Ring Expansion**
- Start with k=1 ring (7 hexagons)
- If <5 drivers found, expand to k=2 ring (19 hexagons)
- Keep expanding until sufficient candidates or max radius

**3. Predictive Pre-fetching**
- High-demand areas: cache driver lists in Redis
- Update cache every 2 seconds (stale but fast)
- Fallback to real-time query if cache miss

**4. Sharding by Geography**
- Partition drivers by city/region
- SF drivers on shard 1, NYC on shard 2
- Reduces query scope, enables horizontal scaling`,

      widgets: [
        {
          type: 'timeline',
          title: "Uber Ride Request Flow (2 seconds)",
          events: [
            {
              label: "T+0ms - Rider",
              description: "Taps 'Request Ride' in app - Sends GPS coordinates (37.7749, -122.4194)"
            },
            {
              label: "T+50ms - Demand Service",
              description: "Converts location to H3 cell - H3 resolution 8: 88283082e3fffff"
            },
            {
              label: "T+100ms - Supply Service",
              description: "Queries available drivers in H3 cell + 2 rings - Finds 47 available drivers within 500m"
            },
            {
              label: "T+200ms - ETA Service",
              description: "Predicts ETA for each driver - ML model considers traffic, driver route, historical data"
            },
            {
              label: "T+300ms - DISCO",
              description: "Ranks drivers by composite score - Score = f(ETA, acceptance rate, rating, surge multiplier)"
            },
            {
              label: "T+400ms - DISCO",
              description: "Sends offer to top 3 drivers - Parallel offers (hedge against rejections)"
            },
            {
              label: "T+1200ms - Driver",
              description: "Accepts ride (first to respond wins) - Driver 15s away, 4.9⭐ rating"
            },
            {
              label: "T+1800ms - Rider App",
              description: "Shows driver details + live ETA - Match complete in <2 seconds!"
            }
          ]
        },
        {
          type: 'quiz',
          question: "Why does Uber send ride offers to multiple drivers simultaneously instead of one at a time?",
          options: [
            {
              id: 'opt-1',
              text: "To let drivers compete on price",
              correct: false,
              explanation: "Uber doesn't have drivers compete on price."
            },
            {
              id: 'opt-2',
              text: "To reduce latency when first driver rejects",
              correct: true,
              explanation: "Sequential offers waste time. If you offer to driver A, wait 15s, they reject, then offer to driver B - you've already lost 15s. Parallel offers mean first acceptance wins, minimizing rider wait time."
            },
            {
              id: 'opt-3',
              text: "To increase surge pricing",
              correct: false,
              explanation: "Parallel offers don't affect surge pricing."
            },
            {
              id: 'opt-4',
              text: "To comply with regulations",
              correct: false,
              explanation: "This isn't a regulatory requirement."
            }
          ]
        }
      ],
      nextCondition: 'click-next'
    },

    {
      id: "uber-eta-prediction",
      phase: "real",
      title: "ETA Prediction with ML",
      estimatedMinutes: 10,
      canvasOperations: [],
      content: `# Estimating Arrival Time

ETA prediction is **critical** to matching. A driver 1km away in heavy traffic might arrive slower than a driver 2km away on a highway!

## Naive ETA: Straight-Line Distance

**Simple formula:**
\`\`\`
ETA = (distance × 1.3) / average_speed
\`\`\`

**Problems:**
- Ignores traffic conditions
- Ignores road network (can't drive through buildings!)
- Doesn't account for driver behavior
- Average speed varies by time of day

**Accuracy:** ~60% (terrible!)

## Uber's ML-Based ETA

Uber uses **gradient-boosted decision trees** (XGBoost) trained on billions of historical trips.

**Input Features:**
- **Geo:** H3 cell, distance, bearing
- **Time:** Hour, day of week, holiday
- **Traffic:** Real-time congestion scores from API
- **Driver:** Historical acceptance rate, avg speed, experience
- **Demand:** Current requests in area (proxy for congestion)

**Output:** Predicted pickup time in seconds

**Accuracy:** ~90% (within 1 minute of actual)`,

      widgets: [
        {
          type: 'code-block',
          title: "ETA Prediction Service",
          language: "typescript",
          code: `// Simplified ETA prediction service
interface ETAFeatures {
  distance_km: number;
  h3_cell: string;
  hour_of_day: number;
  day_of_week: number;
  traffic_score: number;  // 0-1 (0=free flow, 1=gridlock)
  driver_avg_speed: number;
  surge_multiplier: number;
}

async function predictETA(
  driverLat: number,
  driverLon: number,
  riderLat: number,
  riderLon: number,
  driver: Driver
): Promise<number> {
  // Extract features
  const features: ETAFeatures = {
    distance_km: haversineDistance(driverLat, driverLon, riderLat, riderLon),
    h3_cell: latLngToCell(riderLat, riderLon, 8),
    hour_of_day: new Date().getHours(),
    day_of_week: new Date().getDay(),
    traffic_score: await getTrafficScore(driverLat, driverLon, riderLat, riderLon),
    driver_avg_speed: driver.avgSpeed || 25, // km/h
    surge_multiplier: await getSurgeMultiplier(h3_cell)
  };

  // Call ML model (hosted on separate service)
  const etaSeconds = await mlService.predict('eta-v2', features);

  return etaSeconds;
}

// Real-time traffic scoring
async function getTrafficScore(
  fromLat: number, fromLon: number,
  toLat: number, toLon: number
): Promise<number> {
  // Query traffic API (Google Maps, TomTom, etc.)
  const route = await trafficAPI.getRoute(fromLat, fromLon, toLat, toLon);

  // traffic_score = actual_time / free_flow_time
  // 1.0 = normal, 2.0 = 2x slower (heavy traffic)
  return route.duration / route.durationWithoutTraffic;
}`,
          highlights: [11, 24, 29]
        },
        {
          type: 'tradeoffs',
          title: "ETA Prediction: ML vs Simple Heuristics",
          decision: "Should we use ML models or simple distance/speed calculations?",
          options: [
            {
              label: "ML-Based ETA (Uber's choice)",
              pros: [
                "90%+ accuracy (within 1 min of actual)",
                "Adapts to traffic, weather, events",
                "Continuously improves with new data",
                "Personalized to driver behavior"
              ],
              cons: [
                "Requires ML infrastructure (training, serving)",
                "100ms+ latency per prediction",
                "Needs billions of training examples",
                "Can drift if not retrained regularly"
              ]
            },
            {
              label: "Simple Distance/Speed Heuristic",
              pros: [
                "<1ms latency (instant calculation)",
                "No ML infrastructure needed",
                "Easy to debug and explain",
                "Works offline"
              ],
              cons: [
                "~60% accuracy (unacceptable for UX)",
                "Ignores traffic completely",
                "Can't learn from data",
                "Poor rider experience (wrong ETAs)"
              ]
            }
          ]
        },
        {
          type: 'quiz',
          question: "Why can't Uber just use Google Maps API for ETA predictions?",
          options: [
            {
              id: 'opt-1',
              text: "Google Maps is too expensive at scale",
              correct: false,
              explanation: "Cost is a factor but not the primary reason."
            },
            {
              id: 'opt-2',
              text: "Uber needs predictions for millions of driver-rider pairs per second, and must incorporate driver-specific behavior",
              correct: true,
              explanation: "At Uber's scale (millions of ETA predictions/sec), external API calls are too slow and expensive. Uber also needs to factor in driver-specific data (acceptance patterns, driving style) that Google doesn't have."
            },
            {
              id: 'opt-3',
              text: "Google Maps doesn't work in all cities",
              correct: false,
              explanation: "Google Maps works in most cities globally."
            },
            {
              id: 'opt-4',
              text: "Uber's predictions are less accurate",
              correct: false,
              explanation: "Actually, Uber's predictions are more accurate because they're customized."
            }
          ]
        }
      ],
      nextCondition: 'click-next'
    },

    {
      id: "uber-surge-pricing",
      phase: "real",
      title: "Dynamic Surge Pricing",
      estimatedMinutes: 12,
      canvasOperations: [],
      content: `# Balancing Supply and Demand

When demand > supply, Uber uses **surge pricing** to incentivize more drivers to come online.

## The Supply-Demand Problem

**Friday 11pm in San Francisco:**
- 500 ride requests per minute
- Only 200 available drivers
- **Imbalance:** 300 riders left waiting

**Traditional Solution:** First-come-first-served queue
- Problem: Riders wait 20+ minutes
- Many give up → poor experience

**Uber's Solution:** Dynamic pricing
- Increase price by 1.5x-2x
- Higher fares attract more drivers
- Some riders cancel (price-sensitive)
- Balance achieved in 5-10 minutes

## Surge Pricing Algorithm

**Step 1: Calculate Supply/Demand Ratio**
\`\`\`
surge_score = requests_per_minute / available_drivers
\`\`\`

**Step 2: Map Score to Multiplier**
| Surge Score | Multiplier | Effect |
|------------|-----------|---------|
| 0-1.0 | 1.0x | Normal pricing |
| 1.0-1.5 | 1.2x | Slight surge |
| 1.5-2.5 | 1.5x | Moderate surge |
| 2.5-4.0 | 2.0x | High surge |
| 4.0+ | 2.5x+ | Extreme surge |

**Step 3: Apply Smoothing**
- Don't change prices every second (confusing!)
- Update surge every 2-5 minutes
- Smooth transitions: 1.0x → 1.2x → 1.5x (not 1.0x → 2.0x)

## Behavioral Economics

Surge pricing isn't just math - it's psychology!

**Key Insights:**
1. **Transparency matters:** Show riders why surge is active ("High demand in your area")
2. **Predictability:** Riders accept surge at 11pm Friday (expected) but not 3pm Tuesday (unexpected)
3. **Caps:** Uber caps surge at 2.5-3x to avoid "price gouging" perception
4. **Notifications:** Alert nearby drivers of surge zones to attract supply

**Controversial but Effective:**
- Criticized as "exploitative" during emergencies
- Defended as "market-clearing mechanism"
- Alternative: queue system (but riders hate waiting)`,

      widgets: [
        {
          type: 'code-block',
          title: "Surge Pricing Implementation",
          language: "typescript",
          code: `// Surge pricing calculation (runs every 2 minutes per H3 cell)
interface SurgeData {
  h3Cell: string;
  requestsPerMinute: number;
  availableDrivers: number;
  currentSurge: number;
}

function calculateSurge(cell: string): number {
  // Get recent request rate (last 5 minutes)
  const recentRequests = db.requests.count({
    h3Cell: cell,
    timestamp: { $gte: Date.now() - 5 * 60 * 1000 }
  });
  const requestsPerMinute = recentRequests / 5;

  // Get available driver count
  const availableDrivers = db.drivers.count({
    h3Cell: { $in: gridDisk(cell, 2) },  // Include nearby cells
    status: 'available'
  });

  // Prevent division by zero
  if (availableDrivers === 0) return 2.5;  // Max surge

  // Calculate raw surge score
  const surgeScore = requestsPerMinute / availableDrivers;

  // Map to multiplier (piecewise function)
  let multiplier: number;
  if (surgeScore < 1.0) multiplier = 1.0;
  else if (surgeScore < 1.5) multiplier = 1.2;
  else if (surgeScore < 2.5) multiplier = 1.5;
  else if (surgeScore < 4.0) multiplier = 2.0;
  else multiplier = 2.5;

  // Smooth transition (don't jump from 1.0 to 2.0 instantly)
  const prevSurge = cache.get(\`surge:\${cell}\`) || 1.0;
  const smoothed = prevSurge + (multiplier - prevSurge) * 0.3;  // 30% adjustment

  // Cache for next iteration
  cache.set(\`surge:\${cell}\`, smoothed, 120);  // 2-min TTL

  return Math.round(smoothed * 10) / 10;  // Round to 1 decimal
}

// Background job: update surge for all active cells
setInterval(() => {
  const activeCells = getActiveCells();  // Cells with recent requests

  for (const cell of activeCells) {
    const surge = calculateSurge(cell);
    db.surge.upsert({ h3Cell: cell }, { multiplier: surge, updatedAt: Date.now() });
  }
}, 2 * 60 * 1000);  // Every 2 minutes`,
          highlights: [26, 38, 39]
        },
        {
          type: 'quiz',
          question: "What's the PRIMARY goal of surge pricing?",
          options: [
            {
              id: 'opt-1',
              text: "Maximize Uber's profit",
              correct: false,
              explanation: "While surge does increase revenue, that's not the primary goal."
            },
            {
              id: 'opt-2',
              text: "Punish riders during peak times",
              correct: false,
              explanation: "Surge pricing isn't punitive."
            },
            {
              id: 'opt-3',
              text: "Balance supply and demand by attracting more drivers",
              correct: true,
              explanation: "Surge pricing is a market-clearing mechanism. Higher fares incentivize off-duty drivers to come online AND cause price-sensitive riders to wait, bringing supply and demand back into balance."
            },
            {
              id: 'opt-4',
              text: "Reduce rider complaints",
              correct: false,
              explanation: "Surge pricing actually generates more complaints!"
            }
          ]
        }
      ],
      nextCondition: 'click-next'
    },

    // ==================== PHASE 4: HANDS-ON EXERCISE ====================
    {
      id: "uber-pool-exercise",
      phase: "exercise",
      title: "Exercise: Implement Uber Pool (Shared Rides)",
      estimatedMinutes: 20,
      canvasOperations: [],
      content: `# Build Shared Ride Matching

**Your Challenge:** Implement Uber Pool - matching multiple riders heading in similar directions into one vehicle.

## The Pool Matching Problem

**Constraints:**
- Max 2 riders per vehicle (for simplicity)
- Riders going in same direction (±30° bearing)
- Max 5-minute detour for existing rider
- Max 10-minute wait for new rider

**Example Scenario:**
\`\`\`
Rider A: (37.7749, -122.4194) → (37.7849, -122.4094)  [North-East]
Rider B: (37.7759, -122.4184) → (37.7859, -122.4084)  [North-East]
Driver:  (37.7739, -122.4204) [Available]

Can we match both riders to this driver?
\`\`\`

## Your Task

Implement \`findPoolMatch()\` that:

1. **Finds eligible drivers** (available OR already has 1 rider)
2. **Checks direction compatibility** (bearings within 30°)
3. **Calculates detour time** for existing rider
4. **Returns best match** or null if no good option

## Hints

**Bearing Calculation:**
- North = 0°, East = 90°, South = 180°, West = 270°
- Trip from (37.7749, -122.4194) to (37.7849, -122.4094) is North-East ≈ 45°

**Detour Estimation:**
- Use ETA prediction service to estimate time for each route segment
- Original route: ETA(driver→pickup A) + ETA(pickup A→dropoff A)
- Pool route: ETA(driver→pickup A) + ETA(A→pickup B) + ETA(B→dropoff A) + ETA(dropoff A→dropoff B)

**Test Cases:**
1. **Compatible match:** Both riders going north (bearings 10° and 30°)
2. **Incompatible:** One north, one south (bearings 10° and 180°)
3. **Excessive detour:** Pickup B is 15 min out of the way

## Solution Validation

Your implementation should handle:
- ✅ Finding available drivers (no riders)
- ✅ Finding drivers with 1 existing rider
- ✅ Rejecting drivers with 2 riders already
- ✅ Checking direction compatibility (±30°)
- ✅ Calculating and validating detour time (<5 min)
- ✅ Returning best match by ETA`,

      widgets: [
        {
          type: 'code-block',
          title: "Pool Matching Exercise",
          language: "typescript",
          code: `interface PoolRider {
  id: string;
  pickupLat: number;
  pickupLon: number;
  dropoffLat: number;
  dropoffLon: number;
}

interface PoolDriver extends Driver {
  currentRider?: PoolRider;  // If already has a rider
  route?: GpsPoint[];        // Current planned route
}

// TODO: Implement this function!
function findPoolMatch(
  newRider: PoolRider,
  drivers: PoolDriver[]
): PoolDriver | null {
  // Step 1: Filter eligible drivers
  //   - Available with no riders, OR
  //   - Currently have 1 rider (not 2+)

  // Step 2: For each eligible driver:
  //   - Calculate bearing of new rider's trip
  //   - If driver has existing rider, calculate their bearing
  //   - Check if bearings are within 30° (compatible direction)

  // Step 3: Calculate detour time
  //   - If driver has existing rider:
  //     - Original route: pickup A → dropoff A
  //     - New route: pickup A → pickup B → dropoff A → dropoff B
  //     - Detour = new route time - original route time
  //     - Reject if detour > 5 minutes

  // Step 4: Return best match
  //   - Prioritize drivers with no riders (faster pickup)
  //   - If multiple candidates, choose closest by ETA

  return null;  // Replace with your implementation
}

// Helper: Calculate bearing between two points
function calculateBearing(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
            Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  const bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;  // Normalize to 0-360
}

// Helper: Check if two bearings are compatible
function isDirectionCompatible(
  bearing1: number,
  bearing2: number,
  threshold: number = 30
): boolean {
  // Handle wrap-around (e.g., 350° and 10° are close)
  const diff = Math.abs(bearing1 - bearing2);
  return Math.min(diff, 360 - diff) <= threshold;
}`,
          highlights: [16, 17, 18, 19]
        },
        {
          type: 'quiz',
          question: "Why is direction compatibility critical for Pool matching?",
          options: [
            {
              id: 'opt-1',
              text: "It reduces fuel costs",
              correct: false,
              explanation: "Fuel cost reduction is a side benefit, not the primary reason."
            },
            {
              id: 'opt-2',
              text: "It ensures riders don't backtrack (poor UX) and minimizes detour time",
              correct: true,
              explanation: "If Rider A is going north and Rider B is going south, the driver would have to complete A's trip, then backtrack for B - massive detour! Checking bearing compatibility (±30°) ensures riders share a similar direction, minimizing total trip time."
            },
            {
              id: 'opt-3',
              text: "It's legally required",
              correct: false,
              explanation: "There's no legal requirement for direction compatibility."
            },
            {
              id: 'opt-4',
              text: "It helps with surge pricing",
              correct: false,
              explanation: "Direction compatibility doesn't affect surge pricing."
            }
          ]
        }
      ],
      nextCondition: 'click-next'
    },

    // ==================== PHASE 5: DEEP DIVE TOPICS ====================
    {
      id: "uber-realtime-tracking",
      phase: "deep-dive",
      title: "Real-Time Location Tracking",
      estimatedMinutes: 15,
      canvasOperations: [],
      content: `# Streaming 10M GPS Updates Per Second

Uber drivers send location updates **every 4 seconds**. With 10M active drivers globally, that's **2.5M updates/second**!

## The Challenge

**Naive Approach:**
- Each driver sends HTTP POST request every 4s
- Server writes to database
- **Problem:** 2.5M database writes/sec → massive bottleneck

**Uber's Solution: Event Streaming**

## Architecture: MQTT + Kafka

**1. Drivers → MQTT Broker**
- **MQTT:** Lightweight pub/sub protocol designed for IoT
- Drivers maintain persistent connection (not HTTP polling)
- Send small payloads: \`{lat, lon, timestamp, heading, speed}\`
- Uber runs massive MQTT cluster (100K+ connections per broker)

**2. MQTT → Kafka**
- MQTT brokers publish to Kafka topics
- Kafka provides durable, partitioned event log
- Topic: \`driver-locations\` (partitioned by driver ID)

**3. Kafka → Consumers**
- Supply Service reads stream, updates Redis cache (not database!)
- Database gets batch updates every 30s (not every 4s)
- Real-time queries hit Redis, not DB`,

      widgets: [
        {
          type: 'code-block',
          title: "Real-Time Location Streaming",
          language: "typescript",
        code: `// Driver app: Send location via MQTT
import mqtt from 'mqtt';

const client = mqtt.connect('mqtt://uber-broker.com:1883');

setInterval(() => {
  const location = getCurrentGPSLocation();  // Device GPS

  client.publish(\`drivers/\${driverId}/location\`, JSON.stringify({
    lat: location.latitude,
    lon: location.longitude,
    heading: location.bearing,
    speed: location.speed,
    timestamp: Date.now()
  }));
}, 4000);  // Every 4 seconds

// Server: Consume location stream from Kafka
import { Kafka } from 'kafkajs';

const kafka = new Kafka({ brokers: ['kafka-1:9092', 'kafka-2:9092'] });
const consumer = kafka.consumer({ groupId: 'supply-service' });

await consumer.subscribe({ topic: 'driver-locations', fromBeginning: false });

await consumer.run({
  eachMessage: async ({ message }) => {
    const location = JSON.parse(message.value.toString());

    // Update Redis cache (fast, in-memory)
    const h3Cell = latLngToCell(location.lat, location.lon, 8);
    await redis.hset(\`driver:\${location.driverId}\`, {
      lat: location.lat,
      lon: location.lon,
      h3Cell,
      updatedAt: location.timestamp
    });

    // Add to H3 cell index (for spatial queries)
    await redis.sadd(\`cell:\${h3Cell}:drivers\`, location.driverId);

    // Remove from old cell if changed
    const oldCell = await redis.hget(\`driver:\${location.driverId}\`, 'h3Cell');
    if (oldCell && oldCell !== h3Cell) {
      await redis.srem(\`cell:\${oldCell}:drivers\`, location.driverId);
    }
  }
});

// Batch write to database every 30 seconds (persistence)
setInterval(async () => {
  const driverKeys = await redis.keys('driver:*');
  const batch = [];

  for (const key of driverKeys) {
    const data = await redis.hgetall(key);
    batch.push({
      updateOne: {
        filter: { id: data.driverId },
        update: { $set: data }
      }
    });
  }

  await db.drivers.bulkWrite(batch);
}, 30000);`,
        highlights: [8, 30, 37, 38]
        },
        {
          type: 'timeline',
          title: "Location Update Flow (4-second interval)",
          events: [
            {
              label: "T+0ms - Driver App",
              description: "Reads GPS from device - Lat/lon accuracy ±5m, heading, speed"
            },
            {
              label: "T+20ms - Driver App",
              description: "Publishes to MQTT broker - Persistent connection, QoS 1 (at least once delivery)"
            },
            {
              label: "T+50ms - MQTT Broker",
              description: "Forwards to Kafka topic - Topic: driver-locations, partition by driver ID"
            },
            {
              label: "T+100ms - Kafka Consumer",
              description: "Supply Service processes event - Updates Redis cache with new H3 cell"
            },
            {
              label: "T+120ms - Redis",
              description: "Driver location updated in cache - Available for instant queries (no DB hit)"
            },
            {
              label: "T+30000ms - Background Job",
              description: "Batch write to PostgreSQL - Persist locations for analytics (not real-time queries)"
            }
          ]
        },
        {
          type: 'tradeoffs',
          title: "Real-Time Location Storage: Redis vs Database",
          decision: "Where should we store live driver locations for sub-second queries?",
          options: [
            {
              label: "Redis Cache (Uber's choice)",
              pros: [
                "Sub-millisecond reads (in-memory)",
                "Handles 2.5M writes/sec easily",
                "Geo-spatial queries (GEORADIUS) built-in",
                "Horizontal scaling with cluster mode"
              ],
              cons: [
                "Data loss if Redis crashes (use replication)",
                "Limited storage (expensive RAM)",
                "Need separate DB for persistence",
                "Cache invalidation complexity"
              ]
            },
            {
              label: "PostgreSQL Database",
              pros: [
                "Durable storage (no data loss)",
                "ACID transactions",
                "PostGIS extension for geo queries",
                "Simpler architecture (no cache layer)"
              ],
              cons: [
                "Too slow for 2.5M writes/sec",
                "Queries take 10-50ms (vs <1ms Redis)",
                "Scaling writes is hard (vertical only)",
                "Database becomes bottleneck"
              ]
            }
          ]
        },
        {
          type: 'quiz',
          question: "Why does Uber use MQTT instead of HTTP for location updates?",
          options: [
            {
              id: 'opt-1',
              text: "MQTT is more secure",
              correct: false,
              explanation: "Security isn't the primary reason."
            },
            {
              id: 'opt-2',
              text: "HTTP doesn't support GPS coordinates",
              correct: false,
              explanation: "HTTP can transmit any data including GPS coordinates."
            },
            {
              id: 'opt-3',
              text: "MQTT uses persistent connections (no overhead of repeated HTTP handshakes) and is optimized for high-frequency, low-bandwidth updates",
              correct: true,
              explanation: "HTTP requires a new connection for each update (TCP handshake, TLS negotiation). At 4-second intervals, this overhead is massive. MQTT maintains a persistent connection and sends tiny payloads, reducing bandwidth by ~90%."
            },
            {
              id: 'opt-4',
              text: "MQTT is cheaper",
              correct: false,
              explanation: "Cost isn't the primary technical reason."
            }
          ]
        }
      ],
      nextCondition: 'click-next'
    },

    {
      id: "uber-incentives",
      phase: "deep-dive",
      title: "Driver Incentive Systems",
      estimatedMinutes: 12,
      canvasOperations: [],
      content: `# Optimizing Driver Supply

Uber doesn't just match supply and demand - it **actively shapes** supply through incentives.

## The Supply Problem

**Peak hours (Friday 8-10pm):**
- High demand → surge pricing
- But drivers still insufficient

**Off-peak hours (Tuesday 2pm):**
- Low demand → no incentives
- Too many idle drivers

**Uber's Goal:** Smooth out supply to match demand curves

## Incentive Mechanisms

**1. Quest Bonuses**
- Complete N rides in timeframe → earn bonus
- Example: "Complete 10 rides this week, earn $50"
- Encourages consistent driving

**2. Consecutive Trip Bonuses**
- Back-to-back rides without going offline
- Example: "+$3 per trip if you accept next ride within 2 min"
- Keeps drivers active during peak

**3. Surge Notifications**
- Push notification: "Surge pricing active 2 miles north"
- Directs drivers to high-demand areas
- Market-driven repositioning

**4. Guaranteed Earnings**
- "Earn at least $30/hour during 6-9pm or we'll make up the difference"
- Reduces driver risk during uncertain hours
- Encourages driving during predicted peaks

## Behavioral Insights

**What Works:**
- ✅ **Scarcity messaging:** "Only 2 spots left for guaranteed $30/hour"
- ✅ **Progress tracking:** "7/10 rides complete - $50 bonus!"
- ✅ **Immediate rewards:** "+$3 added to your earnings"

**What Doesn't:**
- ❌ Complex formulas (drivers don't trust opaque math)
- ❌ Delayed rewards (bonus paid next week)
- ❌ Bait-and-switch (surge disappears when they arrive)

**Ethical Concerns:**
- Gamification can feel manipulative
- Drivers may feel pressured to work unsustainable hours
- Transparency is key to maintaining trust`,

      widgets: [
        {
          type: 'code-block',
          title: "Incentive System Implementation",
          language: "typescript",
          code: `// Incentive calculation engine
interface Quest {
  id: string;
  targetTrips: number;
  bonusAmount: number;
  startTime: number;
  endTime: number;
}

// Check if driver qualifies for bonus
async function checkQuestCompletion(
  driverId: string,
  quest: Quest
): Promise<boolean> {
  const completedTrips = await db.trips.count({
    driverId,
    status: 'completed',
    completedAt: {
      $gte: quest.startTime,
      $lte: quest.endTime
    }
  });

  if (completedTrips >= quest.targetTrips) {
    // Award bonus
    await db.earnings.insert({
      driverId,
      amount: quest.bonusAmount,
      type: 'quest_bonus',
      questId: quest.id,
      timestamp: Date.now()
    });
    return true;
  }

  return false;
}

// Send surge notification to nearby drivers
async function notifyDriversOfSurge(
  h3Cell: string,
  surgeMultiplier: number
) {
  // Find offline drivers within 5km
  const nearbyCells = gridDisk(h3Cell, 5);  // ~5km radius at res 8

  const offlineDrivers = await db.drivers.find({
    h3CellLastKnown: { $in: nearbyCells },
    status: 'offline',
    lastActiveAt: { $gte: Date.now() - 60 * 60 * 1000 }  // Active in last hour
  });

  for (const driver of offlineDrivers) {
    await pushNotification(driver.id, {
      title: \`\${surgeMultiplier}x surge nearby!\`,
      body: "High demand in your area. Go online to earn more.",
      action: "GO_ONLINE",
      data: { h3Cell, surgeMultiplier }
    });
  }
}`,
          highlights: [38, 53]
        },
        {
          type: 'quiz',
          question: "Why does Uber notify offline drivers about surge pricing in their area?",
          options: [
            {
              id: 'opt-1',
              text: "To annoy them into working",
              correct: false,
              explanation: "Notifications aren't meant to annoy drivers."
            },
            {
              id: 'opt-2',
              text: "To comply with labor laws",
              correct: false,
              explanation: "This isn't a legal requirement."
            },
            {
              id: 'opt-3',
              text: "To attract more supply to high-demand areas, balancing the market faster",
              correct: true,
              explanation: "Surge pricing alone takes time to attract drivers. Proactive notifications accelerate supply response - offline drivers nearby can go online in minutes, reducing surge duration and improving rider wait times."
            },
            {
              id: 'opt-4',
              text: "To increase Uber's revenue",
              correct: false,
              explanation: "While this may increase revenue, the primary goal is market balance."
            }
          ]
        }
      ],
      nextCondition: 'click-next'
    },

    {
      id: "uber-fraud-detection",
      phase: "deep-dive",
      title: "Fraud Detection and Prevention",
      estimatedMinutes: 15,
      canvasOperations: [],
      content: `# Detecting Fake Rides and GPS Spoofing

**The Fraud Problem:**
- Drivers fake rides to collect surge bonuses
- GPS spoofing to appear in high-surge areas
- Riders cancel repeatedly to game ETA estimates
- Colluding driver-rider pairs split fare refunds

## Common Fraud Patterns

**1. GPS Spoofing**
- Driver's phone reports location in surge area
- But movement patterns don't match (teleporting, impossible speeds)

**2. Fake Rides**
- Driver and rider are same person
- Short trips repeatedly in same area
- No meaningful movement (GPS path is circular)

**3. Trip Manipulation**
- Driver extends route unnecessarily
- "Accidental" wrong destination
- Rider claims ride never happened (after completion)

## Detection Algorithms

**Rule-Based Detection:**

## Machine Learning Fraud Detection

Rule-based detection catches obvious fraud, but sophisticated attackers adapt. Uber uses **ML models** trained on labeled fraud cases.

**Features:**
- Historical fraud rate for driver/rider
- Trip pattern anomalies (time, distance, route)
- Device fingerprinting (rooted phones often used for GPS spoofing)
- Network analysis (colluding driver-rider clusters)

**Model Output:**
- Fraud probability score (0-1)
- If >0.8: Flag for manual review
- If >0.95: Auto-reject and suspend account

**Challenge:** False positives hurt legitimate users
- Legitimate reasons for weird patterns (traffic detours, phone GPS glitches)
- Must balance fraud prevention with UX

## Response Actions

**Low confidence (0.5-0.8):**
- Silent monitoring
- Collect more data

**Medium confidence (0.8-0.95):**
- Manual review by fraud team
- Temporary hold on payouts

**High confidence (>0.95):**
- Immediate account suspension
- Refund riders, no pay for driver
- Report to law enforcement if necessary`,

      widgets: [
        {
          type: 'code-block',
          title: "Fraud Detection Rules",
          language: "typescript",
          code: `// Fraud detection rules
interface TripData {
  driverId: string;
  riderId: string;
  gpsPath: GpsPoint[];
  requestedPickup: GpsPoint;
  requestedDropoff: GpsPoint;
  actualDistance: number;
  estimatedDistance: number;
  duration: number;
}

async function detectFraud(trip: TripData): Promise<string[]> {
  const flags: string[] = [];

  // 1. GPS Spoofing: Check for impossible speeds
  for (let i = 1; i < trip.gpsPath.length; i++) {
    const prev = trip.gpsPath[i - 1];
    const curr = trip.gpsPath[i];
    const distance = haversineDistance(prev.lat, prev.lon, curr.lat, curr.lon);
    const timeDiff = (curr.timestamp - prev.timestamp) / 1000;  // seconds
    const speed = (distance / timeDiff) * 3600;  // km/h

    if (speed > 200) {  // Faster than any car can legally drive
      flags.push(\`IMPOSSIBLE_SPEED: \${speed.toFixed(0)} km/h detected\`);
    }
  }

  // 2. Teleporting: Large jump in location
  const maxJumpDistance = 5;  // km - max plausible in 4 seconds
  for (let i = 1; i < trip.gpsPath.length; i++) {
    const prev = trip.gpsPath[i - 1];
    const curr = trip.gpsPath[i];
    const jump = haversineDistance(prev.lat, prev.lon, curr.lat, curr.lon);

    if (jump > maxJumpDistance) {
      flags.push(\`TELEPORT: \${jump.toFixed(1)}km jump detected\`);
    }
  }

  // 3. Route deviation: Actual path very different from expected
  const routeDeviation = trip.actualDistance / trip.estimatedDistance;
  if (routeDeviation > 1.5) {  // 50% longer than expected
    flags.push(\`ROUTE_DEVIATION: \${((routeDeviation - 1) * 100).toFixed(0)}% longer than optimal\`);
  }

  // 4. Fake ride: Circular path (returns to start)
  const start = trip.gpsPath[0];
  const end = trip.gpsPath[trip.gpsPath.length - 1];
  const returnDistance = haversineDistance(start.lat, start.lon, end.lat, end.lon);
  if (returnDistance < 0.1 && trip.actualDistance > 2) {
    flags.push('CIRCULAR_ROUTE: Returns to start point');
  }

  // 5. Pattern analysis: Driver-rider relationship
  const sharedTrips = await db.trips.count({
    driverId: trip.driverId,
    riderId: trip.riderId,
    status: 'completed'
  });

  if (sharedTrips > 10) {  // Same driver-rider pair repeatedly
    flags.push(\`COLLUSION_RISK: \${sharedTrips} trips with same rider\`);
  }

  return flags;
}`,
          highlights: [23, 37, 44, 52, 59]
        },
        {
          type: 'quiz',
          question: "Why can't Uber just ban all accounts showing anomalies like teleporting GPS?",
          options: [
            {
              id: 'opt-1',
              text: "It would ban too many users",
              correct: false,
              explanation: "While this is partially true, it's not the primary reason."
            },
            {
              id: 'opt-2',
              text: "GPS glitches and tunnels can cause legitimate teleporting - need to distinguish real fraud from technical issues",
              correct: true,
              explanation: "GPS can legitimately 'jump' when exiting tunnels, in urban canyons, or due to phone issues. Auto-banning on single anomalies would hurt innocent users. Uber combines multiple signals and uses ML to distinguish real fraud from technical glitches."
            },
            {
              id: 'opt-3',
              text: "It's illegal to ban users",
              correct: false,
              explanation: "Companies can ban users for violating terms of service."
            },
            {
              id: 'opt-4',
              text: "Fraud is rare enough to ignore",
              correct: false,
              explanation: "Fraud is definitely not ignored at Uber's scale."
            }
          ]
        }
      ],
      nextCondition: 'click-next'
    },

    {
      id: "uber-global-scale",
      phase: "deep-dive",
      title: "Global Scale and Multi-Region Failover",
      estimatedMinutes: 15,
      canvasOperations: [],
      content: `## Scaling to 10,000 Cities Across 70 Countries

Uber operates in vastly different environments:
- Dense cities (NYC, Tokyo) vs sparse suburbs
- Left-hand drive vs right-hand drive countries
- Different regulations, currencies, languages

## Multi-Region Architecture

**Regional Isolation:**
- **US-East:** NYC, Boston, DC
- **US-West:** SF, LA, Seattle
- **EU:** London, Paris, Amsterdam
- **APAC:** Singapore, Tokyo, Sydney

**Each region has:**
- Dedicated DISCO (dispatch) cluster
- Regional database (driver locations, trip history)
- Regional ML models (trained on local data)

**Global Services (shared):**
- User accounts (single sign-on across regions)
- Payment processing (centralized)
- Fraud detection (global patterns)

## Disaster Recovery

**Scenario:** AWS US-East region goes down (Uber's NYC cluster)

**Immediate Response (T+0):**
1. **Health checks fail:** Load balancer detects US-East unavailable
2. **Failover to US-West:** Route NYC traffic to SF cluster
3. **Data replication:** US-West has 5-minute-delayed replica of US-East DB

**Trade-offs:**
- ✅ Service continues (riders can still request rides)
- ⚠️ Slightly stale data (driver locations up to 5 min old)
- ⚠️ Higher latency (SF servers for NYC users: ~60ms → 150ms)
- ❌ Regional surge pricing incorrect (using SF's supply/demand)

**Recovery (T+2 hours):**
1. AWS US-East comes back online
2. Sync databases (replay 2 hours of writes from US-West)
3. Gradually shift traffic back to US-East
4. Validate data consistency

**Lessons:**
- Accept degraded service over no service
- Cross-region replication is critical
- Practice failovers regularly (chaos engineering)`,

      widgets: [
        {
          type: 'comparison-table',
          title: "Single Global Cluster vs Multi-Region",
          columns: ["Aspect", "Single Global Cluster", "Multi-Region (Uber)"],
          rows: [
            {
              label: "Latency",
              values: ["High (cross-continent)", "Low (<50ms local)"]
            },
            {
              label: "Fault Tolerance",
              values: ["Single point of failure", "Regional isolation (1 region down ≠ global outage)"]
            },
            {
              label: "Data Sovereignty",
              values: ["Violates GDPR, local laws", "Compliant (EU data stays in EU)"]
            },
            {
              label: "Operational Complexity",
              values: ["Simple (1 cluster)", "High (N clusters to manage)"]
            },
            {
              label: "Scalability",
              values: ["Vertical (limited)", "Horizontal (add regions)"]
            }
          ]
        },
        {
          type: 'timeline',
          title: "Regional Failover Scenario",
          events: [
            {
              label: "T+0s - AWS US-East",
              description: "Region outage begins - All servers in Virginia data center unreachable"
            },
            {
              label: "T+10s - Load Balancer",
              description: "Health checks fail for US-East - 3 consecutive failed pings → mark region as down"
            },
            {
              label: "T+15s - Route53 DNS",
              description: "Failover to US-West - Update DNS: uber.com → US-West IPs"
            },
            {
              label: "T+30s - NYC Riders",
              description: "Requests routed to SF cluster - Latency increases from 50ms → 150ms"
            },
            {
              label: "T+60s - Engineering Team",
              description: "Incident declared, war room activated - Begin investigating AWS outage"
            },
            {
              label: "T+2h - AWS",
              description: "US-East region restored - Root cause: Fiber cut in Virginia"
            },
            {
              label: "T+2h 15m - Uber Ops",
              description: "Begin traffic migration back to US-East - Gradual 10% → 50% → 100% over 30 minutes"
            },
            {
              label: "T+3h - System",
              description: "Full recovery complete - All traffic back on US-East, latency normal"
            }
          ]
        },
        {
          type: 'quiz',
          question: "During a regional failover, Uber accepts degraded service (stale data, higher latency) instead of full downtime. Why?",
          options: [
            {
              id: 'opt-1',
              text: "It's cheaper than maintaining perfect consistency",
              correct: false,
              explanation: "Cost isn't the primary reason."
            },
            {
              id: 'opt-2',
              text: "Users prefer slow service over no service - availability trumps consistency in ride-sharing",
              correct: true,
              explanation: "This is the classic CAP theorem trade-off. In a network partition (regional outage), you must choose: Consistency (reject requests until data is synced) or Availability (serve potentially stale data). For ride-sharing, a 5-minute-stale driver location is acceptable; no service at all is not."
            },
            {
              id: 'opt-3',
              text: "It's technically impossible to have perfect consistency",
              correct: false,
              explanation: "Perfect consistency is possible, but not desirable in this context."
            },
            {
              id: 'opt-4',
              text: "Regulations require 99% uptime",
              correct: false,
              explanation: "While SLAs matter, this isn't a regulatory requirement."
            }
          ]
        }
      ],
      nextCondition: 'click-next'
    },

    {
      id: "uber-conclusion",
      phase: "deep-dive",
      title: "Key Takeaways and Real-World Impact",
      estimatedMinutes: 5,
      canvasOperations: [],
      nextCondition: 'click-next',
      content: `# What You've Learned

Congratulations! You've built Uber's real-time dispatch system from scratch.

## Core Concepts Mastered

**1. Geo-Spatial Indexing**
- ✅ Quadtree, Geohash, and H3 hexagonal grids
- ✅ Trade-offs: query speed vs update overhead vs coverage uniformity
- ✅ H3's advantages for spherical Earth and neighbor queries

**2. Real-Time Systems**
- ✅ Handling 2.5M location updates per second
- ✅ MQTT + Kafka for event streaming
- ✅ Redis caching for sub-millisecond queries
- ✅ Batch database writes for persistence

**3. Matching Algorithms**
- ✅ ETA prediction with ML (90% accuracy)
- ✅ Parallel offer strategy (hedge against rejections)
- ✅ Pool matching (shared rides with direction compatibility)

**4. Economic Mechanisms**
- ✅ Surge pricing for supply-demand balance
- ✅ Driver incentives (quests, bonuses, surge notifications)
- ✅ Behavioral psychology in UX

**5. Fraud and Trust**
- ✅ GPS spoofing detection (impossible speeds, teleporting)
- ✅ Pattern analysis (collusion, fake rides)
- ✅ ML-based fraud scoring

**6. Global Scale**
- ✅ Multi-region architecture (low latency, data sovereignty)
- ✅ Disaster recovery and failover strategies
- ✅ CAP theorem trade-offs (availability > consistency)

## Real-World Impact

**Uber's Numbers:**
- **131 million** monthly active users (2023)
- **10 billion** trips per year
- **5.4 million** drivers worldwide
- **93%** of requests matched in <2 seconds

**What You Can Build Now:**
- Real-time delivery systems (DoorDash, Instacart)
- Fleet management (logistics, taxis)
- Location-based social apps (Find My Friends)
- Emergency dispatch (ambulances, police)
- Drone delivery routing

## Further Reading

**Uber Engineering Blog:**
- "H3: Uber's Hexagonal Hierarchical Spatial Index"
- "DISCO: Real-Time Matching at Scale"
- "Michelangelo: Uber's ML Platform"

**Academic Papers:**
- "Geo-Spatial Indexing at Scale" (VLDB 2019)
- "Dynamic Pricing in Ride-Sharing" (KDD 2018)

**Open Source:**
- **H3:** [https://h3geo.org](https://h3geo.org)
- **Kafka:** [https://kafka.apache.org](https://kafka.apache.org)
- **Redis:** [https://redis.io](https://redis.io)

## Final Challenge

**Build Your Own:**
Take the concepts from this walkthrough and build a simplified dispatch system:
1. Use H3 to index mock driver locations
2. Implement findNearestDriver() with k-ring search
3. Add basic surge pricing (supply/demand ratio)
4. Deploy with Redis caching for real-time queries

**Hint:** Start with 100 mock drivers in a single city, then scale to 10K+.

---

**You've completed the Uber Real-Time Dispatch walkthrough!** 🚗💨

You now understand one of the most complex geo-spatial systems in production. Go build something amazing!`
    }
  ]
};
