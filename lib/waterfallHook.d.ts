export declare type WaterfallMiddleware<T, C> = {
    (val: T, context: C): Promise<T | void> | T | void;
};
export interface TWaterfallRegister<T, C> {
    (middleware: WaterfallMiddleware<T, C>): void;
}
export declare type WaterfallExec<T, C = never> = C extends {} ? (initialValue: T, context: C) => Promise<T> : (initialValue: T) => Promise<T>;
export declare type Waterfall<T, C> = {
    exec: WaterfallExec<T, C>;
    register: TWaterfallRegister<T, C>;
    listeners: WaterfallMiddleware<T, C>[];
};
export declare type CreateWaterfallHook = {
    <T, C = undefined>(): Waterfall<T, C>;
};
export declare const waterfall: CreateWaterfallHook;
