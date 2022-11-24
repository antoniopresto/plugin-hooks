import {
  isEarlyHookResult,
  MaybeDraft,
  PluginExecutionContext,
  PluginOptions,
  PluginRegisterInfo,
} from './createHooks';
import { IsKnown } from './type-utils';
import { current, enablePatches, isDraft, Patch, produce } from 'immer';
enablePatches();

export const EmptySymbol = Symbol('EmptySymbol');
export type EmptySymbol = typeof EmptySymbol & {};

export type WaterfallMiddleware<T, C> = {
  (
    this: PluginExecutionContext<T, C>,
    currentValue: T,
    context: C,
    pluginExecutionContext: PluginExecutionContext<T, C>
  ): Promise<T | EmptySymbol | void> | T | EmptySymbol | void;
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
};

export type CreateWaterfallHook = {
  <T, C = undefined>(options?: PluginOptions<T, C>): Waterfall<T, C>;
};

export interface waterfall extends CreateWaterfallHook {}
export interface waterfallHook extends CreateWaterfallHook {}

export const waterfall: CreateWaterfallHook = function <T, C>(
  options: PluginOptions<T, C> = {}
) {
  const listeners: WaterfallMiddleware<T, C>[] = [];

  const { returnOnFirst } = options;

  let canAddNew = true;

  const register: TWaterfallRegister<T, C> = (
    middleware: WaterfallMiddleware<T, C>
  ) => {
    if (typeof middleware !== 'function') {
      throw new Error(`"${typeof middleware}" is not a valid middleware type`);
    }

    listeners.push(middleware);

    return {
      index: listeners.length - 1,
      existing: listeners,
    };
  };

  const exec: WaterfallExec<any, any> = async (
    initial: T,
    context: C
  ): Promise<T> => {
    initial = await initial;

    if (canAddNew) {
      canAddNew = false;
      Object.freeze(listeners);
    }

    const ForceFinishSymbol = Symbol('FORCE_FINISH');
    const ExitMiddlewareSymbol = Symbol('ExitMiddlewareSymbol');

    let forceFinishedValue: typeof ForceFinishSymbol | T = ForceFinishSymbol;

    let ignoredCount = listeners.length;
    let handledCount = 0;
    let finished = false;
    let lastValue: T | EmptySymbol = initial;
    const patches: Patch[] = [];

    const allMiddlewareContext: PluginExecutionContext<T, C>[] = [];

    function onFinish(error: Error | null, result: T | EmptySymbol) {
      if (finished) return;
      finished = true;
      lastValue = isDraft(result) ? current(result) : result;

      allMiddlewareContext.forEach((item) => {
        item.finished = true;
        item.finishedValue = lastValue;
        item.finishedError = error;
        item.ignoredCount = ignoredCount;
        item.handledCount = handledCount;
      });
    }

    try {
      lastValue = await listeners.reduce(async (_value, middleware, index) => {
        const awaited = await _value;

        let registeredCount = false;
        function count() {
          if (registeredCount) return;
          registeredCount = true;
          handledCount += 1;
          ignoredCount -= 1;
        }

        const middlewarePatches: Patch[] = [];

        let replacedValue: T | EmptySymbol = EmptySymbol;
        const ReplaceSymbol = Symbol('REPLACE');

        const self: PluginExecutionContext<T, C> = {
          IgnoredSymbol: EmptySymbol as EmptySymbol,
          ignoredCount,
          handledCount,
          index,
          existing: listeners,
          finish,
          error: null,
          finished,
          finishedValue: awaited,
          finishedError: null,
          accumulatedPatches: patches,
          exit() {
            throw ExitMiddlewareSymbol;
          },
          replace(value: MaybeDraft<T>) {
            count();

            replacedValue = isDraft(value)
              ? (current(value) as T)
              : (value as T);

            if (returnOnFirst) {
              finish(replacedValue);
            } else {
              throw ReplaceSymbol;
            }
          },
        };

        allMiddlewareContext.push(self);

        function finish(value: MaybeDraft<T>) {
          forceFinishedValue = isDraft(value)
            ? (current(value) as T)
            : (value as T);
          count();
          onFinish(null, forceFinishedValue);
          throw ForceFinishSymbol;
        }

        try {
          lastValue = await produce(
            awaited,
            async (draft) => {
              const returnedValue = await middleware.call(
                self,
                draft as any,
                context,
                self
              );

              if (
                returnedValue !== undefined &&
                returnedValue !== EmptySymbol
              ) {
                self.replace(returnedValue);
                return draft;
              } else {
                return draft;
              }
            },
            (_patches) => {
              _patches = _patches.filter(
                (el) =>
                  typeof el.value?.then !== 'function' &&
                  typeof el.value?.catch !== 'function'
              );

              if (!_patches.length) return;
              count();
              middlewarePatches.push(..._patches);
              patches.push(..._patches);
            }
          );

          if (middlewarePatches.length || replacedValue !== EmptySymbol) {
            if (returnOnFirst) {
              finish(lastValue);
            }
          }

          return lastValue;
        } catch (e: any) {
          if (e === ExitMiddlewareSymbol) {
            return lastValue === EmptySymbol ? awaited : lastValue;
          }

          //
          if (e === ReplaceSymbol) {
            const value = (isDraft(replacedValue)!
              ? current(replacedValue)
              : replacedValue) as unknown as T;
            count();
            return (lastValue = value);
          }

          if (e === ForceFinishSymbol) {
            count();
            throw ForceFinishSymbol;
          }

          onFinish(e, EmptySymbol);
          throw e;
        }
      }, Promise.resolve(initial));
    } catch (e: any) {
      if (e === ForceFinishSymbol) {
        const value = (isDraft(forceFinishedValue)!
          ? current(forceFinishedValue)
          : forceFinishedValue) as unknown as T;

        onFinish(null, value);
        return value;
      }

      if (isEarlyHookResult(e)) {
        const value = (isDraft(e.value)!
          ? current(e.value)
          : e.value) as unknown as T;

        onFinish(null, value);
        return value;
      }

      onFinish(e, EmptySymbol);
      throw e;
    }

    onFinish(null, lastValue);

    return lastValue;
  };

  return { register, exec, listeners };
};
