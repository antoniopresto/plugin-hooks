// === Waterfall hooks ===
// returns an object with two functions `payload.exec` and` payload.register`

// the register function accepts as second parameter a middleware function that
// will be executed whenever the `payload.exec` function is executed
// if the callback returns something other than undefined, this value will be passed to the next registered middleware

// Parallel Hooks =====
// as waterfall hook, but all the callbacks provided by payload.register are executed in parallel
// and the return of each callback will be ignored by the next registered callback

import { parallel, CreateParallelHook } from './parallelHook';
import { waterfall, CreateWaterfallHook } from './waterfallHook';

export * from './parallelHook';
export * from './waterfallHook';
export * from './createHooks';

export * from './PluginHook';

export const pluginHooks = {
  parallel,
  waterfall,
};

export const hooks = pluginHooks;
export const Hooks = pluginHooks;
export const PluginHooks = pluginHooks;

export interface pluginHooks {
  parallel: CreateParallelHook;
  waterfall: CreateWaterfallHook;
}

export type hooks = pluginHooks;
export type Hooks = pluginHooks;
export type PluginHooks = pluginHooks;
