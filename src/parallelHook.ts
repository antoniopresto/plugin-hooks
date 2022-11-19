import {
  MaybeDraft,
  PluginExecutionContext,
  PluginOptions,
  PluginRegisterInfo,
} from './createHooks';
import { IsKnown } from './type-utils';
import { EmptySymbol } from './waterfallHook';
import { applyPatches, current, Draft, isDraft, Patch, produce } from 'immer';

export type ParallelMiddleware<T, C> = {
  (
    this: PluginExecutionContext<T, C>,
    param: Draft<T>,
    context: C,
    pluginExecutionContext: PluginExecutionContext<T, C>
  ): void;
};

// returns a promise with the first middleware return
export type TParallelRegister<T, C> = {
  (middleware: ParallelMiddleware<T, C>): PluginRegisterInfo<T, C>;
};

export type ParallelExec<T, C = never> = IsKnown<C> extends 1
  ? [C] extends [undefined]
    ? (initialValue: T, context?: C) => void
    : (initialValue: T, context: C) => void
  : (initialValue: T, context?: C) => void;

export type Parallel<T, C> = {
  exec: ParallelExec<T, C>;
  register: TParallelRegister<T, C>;
  listeners: ParallelMiddleware<T, C>[];
};

export type CreateParallelHook = {
  <T, C = undefined>(options?: PluginOptions<T, C>): Parallel<T, C>;
};

export interface parallel extends CreateParallelHook {}
export interface parallelHook extends CreateParallelHook {}

export const parallel: CreateParallelHook = function <T, C>(
  options: PluginOptions<T, C> = {}
) {
  const { returnOnFirst } = options;

  const listeners: ParallelMiddleware<T, C>[] = [];

  const register: TParallelRegister<T, C> = (middleware) => {
    if (typeof middleware !== 'function') {
      throw new Error(`"${typeof middleware}" is not a valid middleware type`);
    }

    listeners.push(middleware);

    return {
      index: listeners.length - 1,
      existing: listeners,
    };
  };

  const exec: ParallelExec<any, any> = (value: T, context: C) => {
    const ForceFinishSymbol = Symbol('FORCE_FINISH');
    const ReplaceSymbol = Symbol('ReplaceSymbol');
    const ExitMiddlewareSymbol = Symbol('ExitMiddlewareSymbol');

    type ForceFinishSymbol = typeof ForceFinishSymbol;

    let forceFinishedValue: T | ForceFinishSymbol = ForceFinishSymbol;

    let lastValue: T | EmptySymbol = value;
    let ignoredCount = listeners.length;
    let handledCount = 0;

    const patches: Patch[] = [];

    const allMiddlewareContext: PluginExecutionContext<T, C>[] = [];

    let finished = false;
    function onFinish(error: Error | null, result: T | EmptySymbol) {
      if (finished) return;
      finished = true;

      if (!error && patches.length && value && typeof value === 'object') {
        const clone = applyPatches(value, patches);
        // @ts-ignore
        Object.keys(value).forEach((k) => delete value[k]);
        lastValue = Object.assign(value, clone);
      }

      allMiddlewareContext.forEach((item) => {
        item.finished = true;
        item.finishedValue = result;
        item.finishedError = error;
        item.ignoredCount = ignoredCount;
        item.handledCount = handledCount;
      });
    }

    try {
      listeners.forEach((middleware, index) => {
        let registeredCount = false;
        function count() {
          if (registeredCount) return;
          registeredCount = true;
          handledCount += 1;
          ignoredCount -= 1;
        }

        function finish(result: MaybeDraft<T>) {
          forceFinishedValue = isDraft(result)
            ? (current(result) as T)
            : (result as T);

          onFinish(null, forceFinishedValue);
          throw ForceFinishSymbol;
        }

        const self: PluginExecutionContext<any, any> = {
          IgnoredSymbol: EmptySymbol as EmptySymbol,
          handledCount: 0,
          ignoredCount: 0,
          index,
          existing: listeners,
          accumulatedPatches: patches,
          finish,
          finished: false,
          finishedError: null,
          finishedValue: value,
          error: null,
          exit() {
            throw ExitMiddlewareSymbol;
          },
          replace(value) {
            lastValue = value;
            throw ReplaceSymbol;
          },
        };

        allMiddlewareContext.push(self);

        const middlewarePatches: Patch[] = [];

        try {
          lastValue = produce(
            value,
            (draft) => {
              middleware.call(self, draft, context, self);
              return draft;
            },
            (_patches) => {
              if (!_patches.length) return;
              count();
              middlewarePatches.push(..._patches);
              patches.push(..._patches);
            }
          );
        } catch (e: any) {
          if (e === ExitMiddlewareSymbol) {
            return lastValue === EmptySymbol ? value : lastValue;
          }

          if (e === ReplaceSymbol) {
            const value = (isDraft(lastValue)!
              ? current(lastValue)
              : lastValue) as unknown as T;
            return (lastValue = value);
          }

          if (e === ForceFinishSymbol) {
            throw ForceFinishSymbol;
          }

          onFinish(e, EmptySymbol);
          throw e;
        }

        if (middlewarePatches.length) {
          if (returnOnFirst) {
            finish(lastValue);
          }
        }
      });
    } catch (e) {
      if (e === ForceFinishSymbol) {
        const value = (isDraft(forceFinishedValue)!
          ? current(forceFinishedValue)
          : forceFinishedValue) as unknown as T;

        lastValue = value;
        onFinish(null, value);
      } else {
        onFinish(e as Error, EmptySymbol);
        throw e;
      }
    }

    onFinish(null, lastValue);
  };

  return { register, exec, listeners };
};
