export declare type WaterfallMiddleware<T, C> = {
    (val: T, context: C): Promise<T | void> | T | void;
};
export interface TWaterfallRegister<T, C> {
    (pluginName: string, middleware: WaterfallMiddleware<T, C>): void;
    timeout?: number;
}
export declare type WaterfallExec<T, C = never> = C extends {} ? (initialValue: T, context: C) => Promise<T> : (initialValue: T) => Promise<T>;
export declare type Waterfall<T, C> = {
    exec: WaterfallExec<T, C>;
    register: TWaterfallRegister<T, C>;
};
export declare type CreateWaterfallHook = {
    <T, C = undefined>(hookName: string, paramName: string): Waterfall<T, C>;
};
export declare const waterfall: CreateWaterfallHook;
