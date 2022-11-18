import {
  createFactoryContext,
  isEarlyHookResult,
  OnPluginExecArgument,
  PluginContext,
  PluginExecutionContext,
  PluginExecutionInfo,
  PluginOptions,
  PluginRegisterInfo,
} from './createHooks';
import { IsKnown } from './type-utils';

export const Ignored = Symbol('IGNORED');
export type Ignored = typeof Ignored & {};

export type WaterfallMiddleware<T, C> = {
  (
    this: PluginExecutionContext<T, C>,
    currentValue: T,
    context: C,
    info: PluginExecutionInfo<T, C>
  ): Promise<T | Ignored | void> | T | Ignored | void;
};

export interface TWaterfallRegister<T, C> {
  (middleware: WaterfallMiddleware<T, C>): PluginRegisterInfo<T, C>;
}

export type WaterfallExec<T, C = never> = IsKnown<C> extends 1
  ? [C] extends [undefined]
    ? (initialValue: T, context?: C) => Promise<T>
    : (initialValue: T, context: C) => Promise<T>
  : (initialValue: T, context?: C) => Promise<T>;

export type Waterfall<T, C> = {
  exec: WaterfallExec<T, C>;
  register: TWaterfallRegister<T, C>;
  listeners: WaterfallMiddleware<T, C>[];
  pluginContext: PluginContext<T, C>;

  ignoredCount: number; // how many listeners returned undefined
  handledCount: number; // how many listeners returned values
};

export type CreateWaterfallHook = {
  <T, C = undefined>(options?: PluginOptions<T, C>): Waterfall<T, C>;
};

export interface waterfall extends CreateWaterfallHook {}
export interface waterfallHook extends CreateWaterfallHook {}

export const waterfall: CreateWaterfallHook = function (options = {}) {
  const listeners: WaterfallMiddleware<any, any>[] = [];

  const {
    //
    pluginContext = createFactoryContext(options),
    returnOnFirst,
  } = options;

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

    const ForceFinishSymbol = Symbol('FORCE_FINISH');
    let forceFinishedValue = ForceFinishSymbol;

    let ignoredCount = listeners.length;
    let handledCount = 0;

    try {
      return await listeners.reduce(async (_value, _next) => {
        const value = await _value;

        const self: PluginExecutionContext<any, any> = {
          IgnoredSymbol: Ignored as Ignored,
          ignoredCount,
          handledCount,
          index: pluginContext.getHandlerIndex(_next),
          existing: pluginContext.middlewareList,
          closeWithResult,
          ignore(): Ignored {
            throw Ignored;
          },
        };

        const next = _next.bind(self);

        function closeWithResult(result: any) {
          forceFinishedValue = result;
          throw ForceFinishSymbol;
        }

        const info: PluginExecutionInfo<any, any> = Object.assign(
          closeWithResult,
          self
        );

        type P = OnPluginExecArgument<any, any, 'waterfall'>;

        let payload: P = {
          kind: 'waterfall',
          context: pluginContext,
          current: value,
          middleware: next,
        };

        payload = await pluginContext.__onPluginExecStart(payload);

        let candidate;

        try {
          candidate = await next(value, context, info);
        } catch (e) {
          if (e === Ignored) {
            candidate = Ignored;
          } else {
            throw e;
          }
        }

        if (candidate !== undefined && candidate !== Ignored) {
          payload.current = candidate;
          if (returnOnFirst) {
            closeWithResult(candidate);
          }
        }

        payload = await pluginContext.__onPluginExecEnd(payload);
        return payload.current;
      }, Promise.resolve(initial));
    } catch (e: any) {
      if (e === ForceFinishSymbol) return forceFinishedValue;
      if (isEarlyHookResult(e)) return e.value;
      throw e;
    }
  };

  return { register, exec, listeners, pluginContext } as any;
};
