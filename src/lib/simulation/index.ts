/**
 * Simulation Engine — Public API
 *
 * Import everything simulation-related from here:
 *   import { SimulationEngine, createBehaviorRegistry } from '@/lib/simulation';
 */

export { SimulationEngine } from './simulationEngine';
export { EventBusImpl } from './eventBus';
export {
  createBehaviorRegistry,
  defaultBehavior,
  databaseBehavior,
  loadBalancerBehavior,
  cacheBehavior,
  apiServerBehavior,
} from './behaviorRegistry';
export { SCENARIO_LIBRARY, type ScenarioDefinition } from './failureScenarioLibrary';
