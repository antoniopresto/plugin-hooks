import { PluginExecutionContext, PluginOptions, PluginRegisterInfo } from './createPlugins';
import { IsKnown } from './type-utils';
import { EmptySymbol } from './asyncPlugin';

export type SyncPluginMiddleware<T, C> = {
  (
    this: PluginExecutionContext<T, C>,
    param: T,
    context: C,
    pluginExecutionContext: PluginExecutionContext<T, C>
  ): void;
};

// returns a promise with the first middleware return
export interface SyncPluginRegister<T, C> {
  (middleware: SyncPluginMiddleware<T, C>): PluginRegisterInfo<T, C>;
  (name: string, middleware: SyncPluginMiddleware<T, C>): PluginRegisterInfo<T, C>;
}

export type SyncPluginExec<T, C = never> = IsKnown<C> extends 1
  ? [C] extends [undefined]
    ? (initialValue: T, context?: C) => void
    : (initialValue: T, context: C) => void
  : (initialValue: T, context?: C) => void;

export interface SyncPlugin<T, C> extends SyncPluginRegister<T, C> {
  dispatch: SyncPluginExec<T, C>;
  pushMiddleware: SyncPluginRegister<T, C>;
  unshiftMiddleware: SyncPluginRegister<T, C>;
  middlewares: SyncPluginMiddleware<T, C>[];
}

export type CreateSyncPlugin = {
  <T, C = undefined>(options?: PluginOptions<T, C>): SyncPlugin<T, C>;
};

export const createSyncPlugin: CreateSyncPlugin = function <T, C>(
  options: PluginOptions<T, C> = {}
) {
  const { returnOnFirst } = options;

  const middlewares: SyncPluginMiddleware<T, C>[] = [];

  const addMiddleware = function registerSyncPlugin(
    position: 'push' | 'unshift'
  ): SyncPluginRegister<T, C> {
    return function addMiddleware(...args: any[]) {
      const { middleware, name } = (() => {
        if (typeof args[0] === 'string') {
          const customName = args[0];

          const mid = args[1] as SyncPluginMiddleware<T, C>;
          if (typeof mid !== 'function') throw new TypeError('Expected args[1] to be a function.');

          try {
            Object.defineProperty(mid, 'name', { value: customName });
          } catch (e) {}

          return { name: customName, middleware: mid };
        }

        const mid = args[0];
        if (typeof mid !== 'function') throw new TypeError('Expected args[0] to be a function.');
        return { name: 'unnamed_middleware', middleware: mid as SyncPluginMiddleware<T, C> };
      })();

      middlewares[position](middleware);

      return {
        name,
        existing: middlewares,
      };
    };
  };

  const dispatch: SyncPluginExec<any, any> = function dispatchSync(value: T, context: C) {
    const ForceFinishSymbol = Symbol('FORCE_FINISH');
    const ReplaceSymbol = Symbol('ReplaceSymbol');
    const ExitMiddlewareSymbol = Symbol('ExitMiddlewareSymbol');

    type ForceFinishSymbol = typeof ForceFinishSymbol;

    let forceFinishedValue: T | ForceFinishSymbol = ForceFinishSymbol;

    let lastValue: T | EmptySymbol = value;
    let ignoredCount = middlewares.length;
    let handledCount = 0;

    const allMiddlewareContext: PluginExecutionContext<T, C>[] = [];

    let finished = false;
    function onFinish(error: Error | null, result: T | EmptySymbol) {
      if (finished) return;
      finished = true;

      allMiddlewareContext.forEach((item) => {
        item.finished = true;
        item.finishedValue = result;
        item.finishedError = error;
        item.ignoredCount = ignoredCount;
        item.handledCount = handledCount;
      });
    }

    try {
      middlewares.forEach((middleware, index) => {
        let registeredGlobalCount = false;

        function count() {
          if (registeredGlobalCount) return;
          registeredGlobalCount = true;
          handledCount += 1;
          ignoredCount -= 1;
        }

        function finish(result: T | EmptySymbol) {
          forceFinishedValue = result as T;
          throw ForceFinishSymbol;
        }

        const self: PluginExecutionContext<any, any> = {
          IgnoredSymbol: EmptySymbol as EmptySymbol,
          handledCount: 0,
          ignoredCount: 0,
          index,
          existing: middlewares,
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

        try {
          if (lastValue !== EmptySymbol && lastValue !== undefined) {
            middleware.call(self, lastValue, context, self);
            count();
          }
        } catch (e: any) {
          if (e === ExitMiddlewareSymbol) {
            count();
            return lastValue === EmptySymbol ? value : lastValue;
          }

          if (e === ReplaceSymbol) {
            const value = lastValue as unknown as T;
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

        if (returnOnFirst) {
          finish(lastValue);
        }
      });
    } catch (e) {
      if (e === ForceFinishSymbol) {
        lastValue = forceFinishedValue as unknown as T;
        onFinish(null, lastValue);
      } else {
        onFinish(e as Error, EmptySymbol);
        throw e;
      }
    }

    onFinish(null, lastValue);
  };

  const push = addMiddleware('push');
  const unshift = addMiddleware('unshift');

  const plugin = function syncPlugin(this: any, ...args: any) {
    return push.apply(this, args);
  } as SyncPlugin<T, C>;

  plugin.dispatch = dispatch;
  plugin.middlewares = middlewares;
  plugin.pushMiddleware = push;
  plugin.unshiftMiddleware = unshift;

  return plugin;
};
