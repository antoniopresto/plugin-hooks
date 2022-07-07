import {
  PluginExecutionInfo,
  PluginFactoryContext,
  PluginRegisterInfo,
} from './createPluginFactory';

export type WaterfallMiddleware<T, C> = {
  (val: T, context: C, info: PluginExecutionInfo<T, C>):
    | Promise<T | void>
    | T
    | void;
};

export interface TWaterfallRegister<T, C> {
  (middleware: WaterfallMiddleware<T, C>): PluginRegisterInfo<T, C>;
}

export type WaterfallExec<T, C = never> = C extends {}
  ? (initialValue: T, context: C) => Promise<T>
  : (initialValue: T) => Promise<T>;

export type Waterfall<T, C> = {
  exec: WaterfallExec<T, C>;
  register: TWaterfallRegister<T, C>;
  listeners: WaterfallMiddleware<T, C>[];
};

export type CreateWaterfallHook = {
  <T, C = undefined>(factoryContext: PluginFactoryContext): Waterfall<T, C>;
};

export interface waterfall extends CreateWaterfallHook {}
export interface waterfallHook extends CreateWaterfallHook {}

export const waterfall: CreateWaterfallHook = function (factoryContext) {
  const listeners: WaterfallMiddleware<any, any>[] = [];

  const register: TWaterfallRegister<any, any> = (
    middleware: WaterfallMiddleware<any, any>
  ) => {
    if (typeof middleware !== 'function') {
      throw new Error(`"${typeof middleware}" is not a valid middleware type`);
    }

    factoryContext.__onRegister(middleware);
    listeners.push(middleware);

    return {
      index:
        factoryContext?.getHandlerIndex(middleware) ?? listeners.length - 1,
      existing: factoryContext?.middlewareList || listeners,
    };
  };

  let frozen = false;
  const exec: WaterfallExec<any, any> = async (initial, context) => {
    if (!frozen) {
      Object.freeze(listeners);
      frozen = true;
    }

    return await listeners.reduce(async (prev, next, index) => {
      const info = {
        index: factoryContext.getHandlerIndex(next),
        existing: factoryContext.middlewareList,
      };

      const middlewareResult = await next(await prev, context, info);

      if (typeof middlewareResult === 'undefined') return prev;

      return middlewareResult;
    }, Promise.resolve(initial));
  };

  return { register, exec, listeners } as any;
};
