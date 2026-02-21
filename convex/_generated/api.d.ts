/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aiGeneration from "../aiGeneration.js";
import type * as auth from "../auth.js";
import type * as blocks from "../blocks.js";
import type * as designBlocks from "../designBlocks.js";
import type * as designCanvases from "../designCanvases.js";
import type * as designs from "../designs.js";
import type * as folders from "../folders.js";
import type * as http from "../http.js";
import type * as migrate from "../migrate.js";
import type * as newDesigns from "../newDesigns.js";
import type * as seedData from "../seedData.js";
import type * as seedExamples from "../seedExamples.js";
import type * as sharing from "../sharing.js";
import type * as users from "../users.js";
import type * as validators from "../validators.js";
import type * as walkthroughs from "../walkthroughs.js";
import type * as workspaces from "../workspaces.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aiGeneration: typeof aiGeneration;
  auth: typeof auth;
  blocks: typeof blocks;
  designBlocks: typeof designBlocks;
  designCanvases: typeof designCanvases;
  designs: typeof designs;
  folders: typeof folders;
  http: typeof http;
  migrate: typeof migrate;
  newDesigns: typeof newDesigns;
  seedData: typeof seedData;
  seedExamples: typeof seedExamples;
  sharing: typeof sharing;
  users: typeof users;
  validators: typeof validators;
  walkthroughs: typeof walkthroughs;
  workspaces: typeof workspaces;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
