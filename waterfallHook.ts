export type WaterfallMiddleware<T, C> = {
  (val: T, context: C): Promise<T | void> | T | void;
};

export interface TWaterfallRegister<T, C> {
  (pluginName: string, middleware: WaterfallMiddleware<T, C>): void;
  timeout?: number;
}

export type WaterfallExec<T, C = never> = C extends {}
  ? (initialValue: T, context: C) => Promise<T>
  : (initialValue: T) => Promise<T>;

export type Waterfall<T, C> = {
  exec: WaterfallExec<T, C>;
  register: TWaterfallRegister<T, C>;
};

export type CreateWaterfallHook = {
  <T, C = undefined>(hookName: string, paramName: string): Waterfall<T, C>;
};

export const waterfall: CreateWaterfallHook = function (
  hookName: string,
  paramName: string
) {
  const listeners: WaterfallMiddleware<any, any>[] = [];

  const register: TWaterfallRegister<any, any> = (
    pluginName: string,
    middleware: WaterfallMiddleware<any, any>
  ) => {
    if (typeof middleware !== 'function') {
      throw new Error(
        `${hookName}: "${typeof middleware}" is not a valid middleware type`
      );
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

  return { register, exec } as any;
};
