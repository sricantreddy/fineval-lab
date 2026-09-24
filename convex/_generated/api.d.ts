/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agentPlayground from "../agentPlayground.js";
import type * as agentTraces from "../agentTraces.js";
import type * as agentVersions from "../agentVersions.js";
import type * as evaluationCases from "../evaluationCases.js";
import type * as evaluationRuns from "../evaluationRuns.js";
import type * as evaluationSuite from "../evaluationSuite.js";
import type * as goldenDataset from "../goldenDataset.js";
import type * as seed from "../seed.js";
import type * as supportMessages from "../supportMessages.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agentPlayground: typeof agentPlayground;
  agentTraces: typeof agentTraces;
  agentVersions: typeof agentVersions;
  evaluationCases: typeof evaluationCases;
  evaluationRuns: typeof evaluationRuns;
  evaluationSuite: typeof evaluationSuite;
  goldenDataset: typeof goldenDataset;
  seed: typeof seed;
  supportMessages: typeof supportMessages;
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
