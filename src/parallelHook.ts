import {
  createFactoryContext,
  PluginOptions,
  PluginExecutionInfo,
  PluginContext,
  PluginRegisterInfo,
  OnPluginExecArgument,
} from './createHooks';

export type ParallelMiddleware<T, C> = {
  (param: T, context: C, info: PluginExecutionInfo<T, C>): void;
};

// returns a promise with the first middleware return
export type TParallelRegister<T, C> = {
  (middleware: ParallelMiddleware<T, C>): PluginRegisterInfo<T, C>;
};

export type ParallelExec<T, C = never> = C extends {}
  ? (initialValue: T, context: C) => void
  : (initialValue: T) => void;

export type Parallel<T, C> = {
  exec: ParallelExec<T, C>;
  register: TParallelRegister<T, C>;
  listeners: ParallelMiddleware<T, C>[];
  context: PluginContext<T, C>;
};

export type CreateParallelHook = {
  <T, C = undefined>(options?: PluginOptions<T, C>): Parallel<T, C>;
};

export interface parallel extends CreateParallelHook {}
export interface parallelHook extends CreateParallelHook {}

export const parallel: CreateParallelHook = function (options = {}) {
  const { pluginContext = createFactoryContext(options) } = options;
  const { executionsCountLimit } = pluginContext;

  const listeners: ParallelMiddleware<any, any>[] = [];

  const register: TParallelRegister<any, any> = (middleware) => {
    if (typeof middleware !== 'function') {
      throw new Error(`"${typeof middleware}" is not a valid middleware type`);
    }
    pluginContext.__onRegister(middleware);
    listeners.push(middleware);

    return {
      index: pluginContext.getHandlerIndex(middleware),
      existing: pluginContext.middlewareList,
    };
  };

  const exec: ParallelExec<any, any> = (value, context) => {
    const nextCount = pluginContext.lastExecutionStartCount + 1;
    if (nextCount > executionsCountLimit) {
      throw new Error(
        `This plugin has a executions count limit of ${executionsCountLimit}.\n` +
          `The next run count would be ${nextCount}.\n`
      );
    }
    pluginContext.lastExecutionStartCount = nextCount;

    const symbol = '__FORCE:FINISHED:VALUE__';
    let forceFinishedValue = symbol;

    try {
      listeners.forEach((middleware, index) => {
        function closeWithResult(result: any) {
          forceFinishedValue = result;
          throw symbol;
        }

        const info: PluginExecutionInfo<any, any> = Object.assign(
          closeWithResult,
          {
            index: pluginContext.getHandlerIndex(middleware),
            existing: pluginContext.middlewareList,
            closeWithResult,
          }
        );

        type P = OnPluginExecArgument<any, any, 'parallel'>;

        let payload: P = {
          kind: 'parallel',
          context: pluginContext,
          middleware,
          current: value,
        };

        payload = pluginContext.__onPluginExecStart(payload) as P;

        middleware(payload.current, context, info);

        pluginContext.__onPluginExecEnd(payload);
      });
    } catch (e) {
      if (e !== symbol) {
        throw e;
      }
    }
  };

  return { register, exec, listeners, context: pluginContext } as Parallel<
    any,
    any
  >;
};
