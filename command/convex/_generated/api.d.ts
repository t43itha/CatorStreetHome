/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as clients from "../clients.js";
import type * as commitments from "../commitments.js";
import type * as demo from "../demo.js";
import type * as emails from "../emails.js";
import type * as home from "../home.js";
import type * as imports from "../imports.js";
import type * as meetings from "../meetings.js";
import type * as model from "../model.js";
import type * as obligations from "../obligations.js";
import type * as onboarding from "../onboarding.js";
import type * as properties from "../properties.js";
import type * as reminders from "../reminders.js";
import type * as seed from "../seed.js";
import type * as settings from "../settings.js";
import type * as tenancies from "../tenancies.js";
import type * as views from "../views.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  clients: typeof clients;
  commitments: typeof commitments;
  demo: typeof demo;
  emails: typeof emails;
  home: typeof home;
  imports: typeof imports;
  meetings: typeof meetings;
  model: typeof model;
  obligations: typeof obligations;
  onboarding: typeof onboarding;
  properties: typeof properties;
  reminders: typeof reminders;
  seed: typeof seed;
  settings: typeof settings;
  tenancies: typeof tenancies;
  views: typeof views;
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
