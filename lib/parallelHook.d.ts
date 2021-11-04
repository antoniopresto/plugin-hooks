export declare type ParallelMiddleware<T, C> = {
    (param: T, context: C): void;
};
export declare type TParallelRegister<T, C> = {
    (pluginName: string, middleware: ParallelMiddleware<T, C>): void;
};
export declare type ParallelExec<T, C = never> = C extends {} ? (initialValue: T, context: C) => void : (initialValue: T) => void;
export declare type Parallel<T, C> = {
    exec: ParallelExec<T, C>;
    register: TParallelRegister<T, C>;
    listeners: ParallelMiddleware<T, C>;
};
export declare type CreateParallelHook = {
    <T, C = undefined>(hookName: string, paramName: string): Parallel<T, C>;
};
export declare const parallel: CreateParallelHook;
