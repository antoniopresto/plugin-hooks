import {
  PluginExecutionInfo,
  PluginFactoryContext,
  PluginRegisterInfo,
} from './createPluginFactory';

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
};

export type CreateParallelHook = {
  <T, C = undefined>(factoryContext: PluginFactoryContext): Parallel<T, C>;
};

export interface parallel extends CreateParallelHook {}
export interface parallelHook extends CreateParallelHook {}

export const parallel: CreateParallelHook = function (factoryContext) {
  const listeners: ParallelMiddleware<any, any>[] = [];

  const register: TParallelRegister<any, any> = (handler) => {
    if (typeof handler !== 'function') {
      throw new Error(`"${typeof handler}" is not a valid handler type`);
    }
    factoryContext.__onRegister(handler);
    listeners.push(handler);

    return {
      index: factoryContext.getHandlerIndex(handler),
      existing: factoryContext.middlewareList,
    };
  };

  let frozen = false;
  const exec: ParallelExec<any, any> = (param, context) => {
    if (!frozen) {
      Object.freeze(listeners);
      frozen = true;
    }

    listeners.forEach((middleware, index) => {
      middleware(param, context, {
        index: factoryContext.getHandlerIndex(middleware) ?? index,
        existing: factoryContext.middlewareList,
      });
    });
  };

  return { register, exec, listeners } as any;
};
