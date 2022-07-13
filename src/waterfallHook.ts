import {
  createFactoryContext,
  isEarlyHookResult,
  OnPluginExecArgument,
  PluginContext,
  PluginExecutionInfo,
  PluginOptions,
  PluginRegisterInfo,
} from './createHooks';

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
  pluginContext: PluginContext<T, C>;
};

export type CreateWaterfallHook = {
  <T, C = undefined>(options?: PluginOptions<T, C>): Waterfall<T, C>;
};

export interface waterfall extends CreateWaterfallHook {}
export interface waterfallHook extends CreateWaterfallHook {}

export const waterfall: CreateWaterfallHook = function (options = {}) {
  const listeners: WaterfallMiddleware<any, any>[] = [];

  const { pluginContext = createFactoryContext(options) } = options;

  let canAddNew = true;

  const register: TWaterfallRegister<any, any> = (
    middleware: WaterfallMiddleware<any, any>
  ) => {
    if (typeof middleware !== 'function') {
      throw new Error(`"${typeof middleware}" is not a valid middleware type`);
    }

    pluginContext.__onRegister(middleware);
    listeners.push(middleware);

    return {
      index: pluginContext?.getHandlerIndex(middleware) ?? listeners.length - 1,
      existing: pluginContext?.middlewareList || listeners,
    };
  };

  const exec: WaterfallExec<any, any> = async (initial, context) => {
    if (canAddNew) {
      canAddNew = false;
      Object.freeze(listeners);
    }

    const symbol = '__FORCE:FINISHED:VALUE__';
    let forceFinishedValue = symbol;

    try {
      return await listeners.reduce(async (_value, next) => {
        const value = await _value;

        function closeWithResult(result: any) {
          forceFinishedValue = result;
          throw symbol;
        }

        const info: PluginExecutionInfo<any, any> = Object.assign(
          closeWithResult,
          {
            index: pluginContext.getHandlerIndex(next),
            existing: pluginContext.middlewareList,
            closeWithResult,
          }
        );

        type P = OnPluginExecArgument<any, any, 'waterfall'>;

        let payload: P = {
          kind: 'waterfall',
          context: pluginContext,
          current: value,
          middleware: next,
        };

        payload = await pluginContext.__onPluginExecStart(payload);
        const candidate = await next(value, context, info);
        if (candidate !== undefined) {
          payload.current = candidate;
        }
        payload = await pluginContext.__onPluginExecEnd(payload);
        return payload.current;
      }, Promise.resolve(initial));
    } catch (e: any) {
      if (e === symbol) return forceFinishedValue;
      if (isEarlyHookResult(e)) return e.value;
      throw e;
    }
  };

  return { register, exec, listeners, pluginContext } as any;
};
