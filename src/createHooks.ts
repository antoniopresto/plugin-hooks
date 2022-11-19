import { Draft, Patch } from 'immer';
import { parallel, Parallel, ParallelMiddleware } from './parallelHook';
import {
  EmptySymbol,
  Waterfall,
  waterfall,
  WaterfallMiddleware,
} from './waterfallHook';

export interface PluginOptions<T, C> {
  executionsCountLimit?: number;
  returnOnFirst?: boolean;
}

export interface PluginRegisterInfo<T, C> {
  index: number;
  existing: (ParallelMiddleware<T, C> | WaterfallMiddleware<T, C>)[];
}

export type MaybeDraft<T> = Draft<T> | T;

export interface PluginExecutionContext<T, C> {
  index: number;
  ignoredCount: number; // how many listeners called ignore()
  handledCount: number; // how many listeners updated values
  accumulatedPatches: Patch[];
  existing: (ParallelMiddleware<T, C> | WaterfallMiddleware<T, C>)[];

  /**
   * True if any middleware called finish() or all middlewares have executed
   */
  finished: boolean;
  finishedValue: T | EmptySymbol;
  finishedError: Error | null;

  error: Error | null;

  /**
   * Stop queue execution and return the informed value in the parent execution
   * @param result
   */
  finish: (result: T) => void;

  IgnoredSymbol: EmptySymbol;

  /**
   * Exit current middleware execution and go to the next
   */
  exit(): EmptySymbol;

  /**
   * Exit current middleware execution and go to the next
   */
  replace(value: MaybeDraft<T>): void;
}

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
