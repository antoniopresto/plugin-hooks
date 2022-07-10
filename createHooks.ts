import { parallel, Parallel, ParallelMiddleware } from './parallelHook';
import { Waterfall, waterfall, WaterfallMiddleware } from './waterfallHook';
import { createType, FieldDefinitionConfig } from '@darch/schema';

export interface PluginOptions<T, C> {
  onPluginExecStart?: OnMiddlewareExec<T, C>;
  onPluginExecEnd?: OnMiddlewareExec<T, C>;
  executionsCountLimit?: number;
  schema?: FieldDefinitionConfig;
  pluginContext?: PluginContext<T, C>;
}

export interface PluginRegisterInfo<T, C> {
  index: number;
  existing: (ParallelMiddleware<T, C> | WaterfallMiddleware<T, C>)[];
}

export interface PluginExecutionInfo<T, C> {
  index: number;
  existing: (ParallelMiddleware<T, C> | WaterfallMiddleware<T, C>)[];
  closeWithResult: (result: T) => any;
  (result: T): any;
}

export interface PluginContext<T, C> {
  _id: string;
  parse(value: any): any;
  middlewareList: (ParallelMiddleware<T, C> | WaterfallMiddleware<T, C>)[];
  getHandlerIndex(
    middleware: WaterfallMiddleware<T, C> | ParallelMiddleware<T, C>
  ): number;
  executionsCountLimit: number;
  lastExecutionStartCount: number;
  lastExecutionEndCount: number;
  __onRegister(
    middleware: WaterfallMiddleware<T, C> | ParallelMiddleware<T, C>
  ): void;
  __onPluginExecStart: OnMiddlewareExec<T, C>;
  __onPluginExecEnd: OnMiddlewareExec<T, C>;
}

export type OnPluginExecArgument<
  T,
  C,
  Kind extends 'waterfall' | 'parallel'
> = {
  kind: Kind;
  current: T | undefined;
  context: C;
  middleware: WaterfallMiddleware<T, C> | ParallelMiddleware<T, C>;
};

export type AnyPayload = OnPluginExecArgument<any, any, any>;

export type OnMiddlewareExec<T, C> = <Kind extends 'waterfall' | 'parallel'>(
  payload: OnPluginExecArgument<T, C, Kind>
) =>
  | OnPluginExecArgument<T, C, Kind>
  | Promise<OnPluginExecArgument<T, C, Kind>>;

export type PluginFactory<T, C> = {
  parallel(options?: Omit<PluginOptions<T, C>, 'context'>): Parallel<T, C>;
  waterfall(options?: Omit<PluginOptions<T, C>, 'context'>): Waterfall<T, C>;
  context: PluginContext<T, C>;
};

export type EarlyHookResult = {
  fulfilled: true;
  value: any;
};

export function isEarlyHookResult(input: any): input is EarlyHookResult {
  return (
    input &&
    typeof input === 'object' &&
    input.fulfilled === true &&
    input.hasOwnProperty?.('value')
  );
}

export function randomStringSimple() {
  return (Math.random() * 99999).toFixed() + (Math.random() * 99999).toFixed();
}

function isPromiseLike(t: any): t is Promise<any> {
  return typeof t?.then === 'function' && typeof t?.catch === 'function';
}

export function createFactoryContext<T, C>(
  options: PluginOptions<T, C>
): PluginContext<T, C> {
  const _id = randomStringSimple();

  const {
    schema,
    onPluginExecEnd,
    onPluginExecStart,
    executionsCountLimit = Infinity,
  } = options;

  const type = schema ? createType(_id, schema as any) : undefined;

  const parse = type ? type.parse : (..._args: any[]) => undefined;

  const context: PluginContext<any, any> = {
    _id,
    parse,
    executionsCountLimit,
    middlewareList: [],
    getHandlerIndex: undefined as any,
    lastExecutionStartCount: 0,
    lastExecutionEndCount: 0,
    __onRegister: undefined as any,
    __onPluginExecStart: undefined as any,
    __onPluginExecEnd: undefined as any,
  };

  function getResult(
    payload: AnyPayload,
    onStart?: OnMiddlewareExec<any, any>,
    onEnd?: OnMiddlewareExec<any, any>
  ): AnyPayload | Promise<AnyPayload> {
    //
    // Waterfall
    //
    if (isPromiseLike(payload.current)) {
      if (payload.kind !== 'waterfall') {
        throw new Error(
          `Expected ${payload.kind} hooks to return non Promise values.`
        );
      }

      return payload.current.then(async (resolvedCurrent) => {
        payload.current = resolvedCurrent;
        payload = await (onStart ? onStart(payload) : payload);

        const value = await payload.current;
        value !== undefined && parse(value);
        return onEnd ? onEnd(payload) : payload;
      });
    }

    const candidate = onStart ? onStart(payload) : payload;
    if (isPromiseLike(candidate)) {
      throw new Error(
        `Expected ${payload.kind} hooks to return non Promise values.`
      );
    }
    payload = candidate;

    const value = payload.current;
    value !== undefined && parse(value);

    const candidateResult = onEnd ? onEnd(payload) : payload;

    if (isPromiseLike(candidateResult)) {
      throw new Error(
        `Expected ${payload.kind} hooks to return non Promise values.`
      );
    }

    return candidateResult;
  }

  context.__onPluginExecStart = function __onPluginExecStart(payload): any {
    return getResult(payload, onPluginExecStart, undefined);
  };

  context.__onPluginExecEnd = function __onPluginExecEnd(payload): any {
    return getResult(payload, undefined, onPluginExecEnd);
  };

  context.__onRegister = function __onRegister(handler) {
    if (typeof handler !== 'function' || !handler.name) {
      console.error(`invalid handler:`, handler);
      throw new Error(`hook middleware must be named function.`);
    }
    context.middlewareList.push(handler);
  };

  context.getHandlerIndex = function getPluginIndex(handler) {
    return context.middlewareList.indexOf(handler);
  };

  return context;
}

export type PluginFactoryOptions<T, C> = Omit<PluginOptions<T, C>, 'context'>;

export function createHooks<T, C>(
  options: PluginFactoryOptions<T, C> = {}
): PluginFactory<T, C> {
  const context = createFactoryContext(options);

  return {
    context,
    parallel: (options) => parallel({ ...options, pluginContext: context }),
    waterfall: (options) => waterfall({ ...options, pluginContext: context }),
  };
}
