import {
  isEarlyPluginResult,
  PluginExecutionContext,
  PluginOptions,
  PluginRegisterInfo,
} from './createPlugins';
import { IsKnown } from './type-utils';

export const EmptySymbol = Symbol('EmptySymbol');
export type EmptySymbol = typeof EmptySymbol & {};

export type AsyncPluginMiddleware<T, C> = {
  (
    this: PluginExecutionContext<T, C>,
    currentValue: T,
    context: C,
    pluginExecutionContext: PluginExecutionContext<T, C>
  ): Promise<T | EmptySymbol | void> | T | EmptySymbol | void;
};

export interface AsyncPluginRegister<T, C> {
  (name: string, middleware: AsyncPluginMiddleware<T, C>): PluginRegisterInfo<T, C>;
  (middleware: AsyncPluginMiddleware<T, C>): PluginRegisterInfo<T, C>;
}

export type AsyncExec<T, C = never> = IsKnown<C> extends 1
  ? [C] extends [undefined]
    ? (initialValue: T, context?: C) => Promise<T>
    : (initialValue: T, context: C) => Promise<T>
  : (initialValue: T, context?: C) => Promise<T>;

export interface AsyncPlugin<T, C> extends AsyncPluginRegister<T, C> {
  dispatch: AsyncExec<T, C>;
  pushMiddleware: AsyncPluginRegister<T, C>;
  unshiftMiddleware: AsyncPluginRegister<T, C>;
  middlewares: AsyncPluginMiddleware<T, C>[];
}

export type CreateAsyncPlugin = {
  <T, C = undefined>(options?: PluginOptions<T, C>): AsyncPlugin<T, C>;
};

export const createAsyncPlugin: CreateAsyncPlugin = function <T, C>(
  options: PluginOptions<T, C> = {}
) {
  const middlewares: AsyncPluginMiddleware<T, C>[] = [];

  const { returnOnFirst } = options;

  let canAddNew = true;

  function addMiddleware(position: 'push' | 'unshift'): AsyncPluginRegister<T, C> {
    return function addMiddleware(...args: any) {
      const { middleware, name } = (() => {
        if (typeof args[0] === 'string') {
          const customName = args[0];

          const mid = args[1] as AsyncPluginMiddleware<T, C>;
          if (typeof mid !== 'function') throw new TypeError('Expected args[1] to be a function.');

          try {
            Object.defineProperty(mid, 'name', { value: customName });
          } catch (e) {}

          return { name: customName, middleware: mid };
        }

        const mid = args[0];
        if (typeof mid !== 'function') throw new TypeError('Expected args[0] to be a function.');
        return { name: 'unnamed_middleware', middleware: mid as AsyncPluginMiddleware<T, C> };
      })();

      middlewares[position](middleware);

      return {
        name,
        existing: middlewares,
      };
    };
  }

  const dispatch: AsyncExec<any, any> = async function dispatchAsync(
    initial: T,
    context: C
  ): Promise<T> {
    initial = await initial;

    if (canAddNew) {
      canAddNew = false;
      Object.freeze(middlewares);
    }

    const ForceFinishSymbol = Symbol('FORCE_FINISH');
    const ExitMiddlewareSymbol = Symbol('ExitMiddlewareSymbol');

    let forceFinishedValue: typeof ForceFinishSymbol | T = ForceFinishSymbol;

    let ignoredCount = middlewares.length;
    let handledCount = 0;
    let finished = false;
    let lastValue: T | EmptySymbol = initial;

    const allMiddlewareContext: PluginExecutionContext<T, C>[] = [];

    function onFinish(error: Error | null, result: T | EmptySymbol) {
      if (finished) return;
      finished = true;
      lastValue = result;

      allMiddlewareContext.forEach((item) => {
        item.finished = true;
        item.finishedValue = lastValue;
        item.finishedError = error;
        item.ignoredCount = ignoredCount;
        item.handledCount = handledCount;
      });
    }

    try {
      lastValue = await middlewares.reduce(async (_value, middleware, index) => {
        const awaited = await _value;

        let registeredGlobalCount = false;

        function count() {
          if (registeredGlobalCount) return;
          registeredGlobalCount = true;
          handledCount += 1;
          ignoredCount -= 1;
        }

        let replacedValue: T | EmptySymbol = EmptySymbol;
        const ReplaceSymbol = Symbol('REPLACE');

        const self: PluginExecutionContext<T, C> = {
          IgnoredSymbol: EmptySymbol as EmptySymbol,
          ignoredCount,
          handledCount,
          index,
          existing: middlewares,
          finish,
          error: null,
          finished,
          finishedValue: awaited,
          finishedError: null,
          exit() {
            throw ExitMiddlewareSymbol;
          },
          replace(value: T) {
            count();

            replacedValue = value as T;

            if (returnOnFirst) {
              finish(replacedValue);
            } else {
              throw ReplaceSymbol;
            }
          },
        };

        allMiddlewareContext.push(self);

        function finish(value: T) {
          forceFinishedValue = value as T;
          throw ForceFinishSymbol;
        }

        try {
          lastValue = await (async (current): Promise<T> => {
            const returnedValue = await middleware.call(self, current, context, self);

            if (returnedValue !== undefined && returnedValue !== EmptySymbol) {
              self.replace(returnedValue);
              count();
              return returnedValue;
            } else {
              return current;
            }
          })(awaited);

          if (replacedValue !== EmptySymbol) {
            if (returnOnFirst) {
              finish(lastValue);
            }
          }

          return lastValue;
        } catch (e: any) {
          if (e === ExitMiddlewareSymbol) {
            count();
            return lastValue === EmptySymbol ? awaited : lastValue;
          }

          //
          if (e === ReplaceSymbol) {
            const value = replacedValue as unknown as T;
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
        const value = forceFinishedValue as unknown as T;
        onFinish(null, value);
        return value;
      }

      if (isEarlyPluginResult(e)) {
        const value = e.value as unknown as T;

        onFinish(null, value);
        return value;
      }

      onFinish(e, EmptySymbol);
      throw e;
    }

    onFinish(null, lastValue);

    return lastValue;
  };

  const push = addMiddleware('push');
  const unshift = addMiddleware('unshift');

  const plugin = function asyncPlugin(this: any, ...args: any) {
    return push.apply(this, args);
  } as AsyncPlugin<T, C>;

  plugin.dispatch = dispatch;
  plugin.middlewares = middlewares;
  plugin.pushMiddleware = push;
  plugin.unshiftMiddleware = unshift;

  return plugin;
};
