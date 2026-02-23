/**
 * Re-export ComponentTypeKey from the registry
 * This breaks the circular dependency between types/index.ts and registry/componentTypes.ts
 */
export type { ComponentTypeKey } from '@/registry/componentTypes';
