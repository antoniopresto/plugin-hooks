import { SyncPluginMiddleware } from './syncPlugin';
import { EmptySymbol, AsyncPluginMiddleware } from './asyncPlugin';

export interface PluginOptions<T, C> {
  executionsCountLimit?: number;
  returnOnFirst?: boolean;
}

export interface PluginRegisterInfo<T, C> {
  name: string;
  existing: (SyncPluginMiddleware<T, C> | AsyncPluginMiddleware<T, C>)[];
}

export interface PluginExecutionContext<T, C> {
  index: number;
  ignoredCount: number; // how many listeners called ignore()
  handledCount: number; // how many listeners updated values
  existing: (SyncPluginMiddleware<T, C> | AsyncPluginMiddleware<T, C>)[];

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
  replace(value: T): void;
}

export type EarlyPluginResult = {
  fulfilled: true;
  value: any;
};

export function isEarlyPluginResult(input: any): input is EarlyPluginResult {
  return (
    input &&
    typeof input === 'object' &&
    input.fulfilled === true &&
    input.hasOwnProperty?.('value')
  );
}
