import { CreateParallelHook } from './parallelHook';
import { CreateWaterfallHook } from './waterfallHook';
export * from './parallelHook';
export * from './waterfallHook';
export * from './createPluginFactory';
export declare const pluginHooks: {
    parallel: CreateParallelHook;
    waterfall: CreateWaterfallHook;
};
export declare const hooks: {
    parallel: CreateParallelHook;
    waterfall: CreateWaterfallHook;
};
export declare const Hooks: {
    parallel: CreateParallelHook;
    waterfall: CreateWaterfallHook;
};
export declare const PluginHooks: {
    parallel: CreateParallelHook;
    waterfall: CreateWaterfallHook;
};
export interface pluginHooks {
    parallel: CreateParallelHook;
    waterfall: CreateWaterfallHook;
}
export declare type hooks = pluginHooks;
export declare type Hooks = pluginHooks;
export declare type PluginHooks = pluginHooks;
