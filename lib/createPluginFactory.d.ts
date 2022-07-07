import { Parallel, ParallelMiddleware } from './parallelHook';
import { Waterfall, WaterfallMiddleware } from './waterfallHook';
export interface PluginRegisterInfo<T, C> {
    index: number;
    existing: (ParallelMiddleware<T, C> | WaterfallMiddleware<T, C>)[];
}
export interface PluginExecutionInfo<T, C> {
    index: number;
    existing: (ParallelMiddleware<T, C> | WaterfallMiddleware<T, C>)[];
}
export interface PluginFactoryContext {
    middlewareList: (ParallelMiddleware<any, any> | WaterfallMiddleware<any, any>)[];
    getHandlerIndex(middleware: WaterfallMiddleware<any, any> | ParallelMiddleware<any, any>): number;
    lastExecutionStartCount: number;
    lastExecutionEndCount: number;
    __onRegister(middleware: WaterfallMiddleware<any, any> | ParallelMiddleware<any, any>): void;
    __onExecStart: FactoryOnMiddlewareExec<any, any>;
    __onExecEnd: FactoryOnMiddlewareExec<any, any>;
}
export declare type FactoryOnMiddlewareExec<T, C> = <Kind extends 'waterfall' | 'parallel'>(payload: {
    kind: Kind;
    value: T;
    context: C;
    middleware: WaterfallMiddleware<T, C> | ParallelMiddleware<T, C>;
}) => Kind extends 'waterfall' ? T | Promise<T> : T;
export declare type PluginFactory<T, C> = {
    parallel(): Parallel<T, C>;
    waterfall(): Waterfall<T, C>;
};
export interface PluginFactoryOptions<T, C> {
    onExecStart?: FactoryOnMiddlewareExec<T, C>;
    onExecEnd?: FactoryOnMiddlewareExec<T, C>;
}
export declare function createFactoryContext(options?: PluginFactoryOptions<any, any>): PluginFactoryContext;
export declare function createPluginFactory<T, C>(options?: PluginFactoryOptions<T, C>): PluginFactory<T, C>;
export declare const pluginFactory: typeof createFactoryContext;
