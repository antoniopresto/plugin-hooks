import { parallel, Parallel, ParallelMiddleware } from './parallelHook';
import { Waterfall, waterfall, WaterfallMiddleware } from './waterfallHook';

export interface PluginRegisterInfo<T, C> {
  index: number;
  existing: (ParallelMiddleware<T, C> | WaterfallMiddleware<T, C>)[];
}

export interface PluginExecutionInfo<T, C> {
  index: number;
  existing: (ParallelMiddleware<T, C> | WaterfallMiddleware<T, C>)[];
}

export interface PluginFactoryContext {
  middlewareList: (
    | ParallelMiddleware<any, any>
    | WaterfallMiddleware<any, any>
  )[];

  getHandlerIndex(
    middleware: WaterfallMiddleware<any, any> | ParallelMiddleware<any, any>
  ): number;

  lastExecutionStartCount: number;
  lastExecutionEndCount: number;

  __onRegister(
    middleware: WaterfallMiddleware<any, any> | ParallelMiddleware<any, any>
  ): void;

  __onExecStart: FactoryOnMiddlewareExec<any, any>;
  __onExecEnd: FactoryOnMiddlewareExec<any, any>;
}

export type FactoryOnMiddlewareExec<T, C> = <
  Kind extends 'waterfall' | 'parallel'
>(payload: {
  kind: Kind;
  value: T;
  context: C;
  middleware: WaterfallMiddleware<T, C> | ParallelMiddleware<T, C>;
}) => Kind extends 'waterfall' ? T | Promise<T> : T;

export type PluginFactory<T, C> = {
  parallel(): Parallel<T, C>;
  waterfall(): Waterfall<T, C>;
};

export interface PluginFactoryOptions<T, C> {
  onExecStart?: FactoryOnMiddlewareExec<T, C>;
  onExecEnd?: FactoryOnMiddlewareExec<T, C>;
}

export function createFactoryContext(
  options: PluginFactoryOptions<any, any> = {}
): PluginFactoryContext {
  //
  const context: PluginFactoryContext = {
    middlewareList: [],
    getHandlerIndex: () => NaN,
    lastExecutionStartCount: 0,
    lastExecutionEndCount: 0,
    __onRegister: () => undefined,
    __onExecStart: () => undefined,
    __onExecEnd: () => undefined,
  };

  context.__onExecStart = function (payload) {
    context.lastExecutionStartCount += 1;
    if (options.onExecStart) {
      options.onExecStart(payload);
    }
  };

  context.__onExecEnd = function (payload) {
    context.lastExecutionEndCount += 1;
    if (options.onExecEnd) {
      options.onExecEnd(payload);
    }
  };

  context.__onRegister = function __onRegister(handler) {
    if (typeof handler !== 'function' || !handler.name) {
      console.error(`invalid handler:`, handler);
      throw new Error(`hook middleware must be named function.`);
    }
    context.middlewareList.push(handler);
  };

  context.getHandlerIndex = function getPluginIndex(handler) {
    return context.middlewareList.indexOf(handler);
  };

  return context;
}

export function createPluginFactory<T, C>(
  options?: PluginFactoryOptions<T, C>
): PluginFactory<T, C> {
  const context = createFactoryContext(options);

  return {
    parallel: () => parallel(context),
    waterfall: () => waterfall(context),
  };
}

export const pluginFactory = createFactoryContext;
