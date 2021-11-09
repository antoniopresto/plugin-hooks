export type WaterfallMiddleware<T, C> = {
  (val: T, context: C): Promise<T | void> | T | void;
};

export interface TWaterfallRegister<T, C> {
  (middleware: WaterfallMiddleware<T, C>): void;
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
  <T, C = undefined>(): Waterfall<T, C>;
};

export const waterfall: CreateWaterfallHook = function () {
  const listeners: WaterfallMiddleware<any, any>[] = [];

  const register: TWaterfallRegister<any, any> = (
    middleware: WaterfallMiddleware<any, any>
  ) => {
    if (typeof middleware !== 'function') {
      throw new Error(`"${typeof middleware}" is not a valid middleware type`);
    }
    listeners.push(middleware);
  };

  const exec: WaterfallExec<any, any> = async (initial, context) => {
    return listeners.reduce(async (prev, next) => {
      const middlewareResult = await next(await prev, context);

      if (typeof middlewareResult === 'undefined') return prev;

      return middlewareResult;
    }, Promise.resolve(initial));
  };

  return { register, exec, listeners } as any;
};
