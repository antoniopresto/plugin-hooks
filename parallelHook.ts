export type ParallelMiddleware<T, C> = { (param: T, context: C): void };

// returns a promise with the first middleware return
export type TParallelRegister<T, C> = {
  (middleware: ParallelMiddleware<T, C>): void;
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
  <T, C = undefined>(): Parallel<T, C>;
};

export const parallel: CreateParallelHook = function () {
  const listeners: ParallelMiddleware<any, any>[] = [];

  const register: TParallelRegister<any, any> = (handler) => {
    if (typeof handler !== 'function') {
      throw new Error(`"${typeof handler}" is not a valid handler type`);
    }

    listeners.push(handler);
  };

  const exec: ParallelExec<any, any> = (param, context) => {
    listeners.forEach((middleware) => {
      middleware(param, context);
    });
  };

  return { register, exec, listeners } as any;
};
