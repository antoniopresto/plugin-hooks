import { PluginExecutionInfo, PluginFactoryContext, PluginRegisterInfo } from './createPluginFactory';
export declare type ParallelMiddleware<T, C> = {
    (param: T, context: C, info: PluginExecutionInfo<T, C>): void;
};
export declare type TParallelRegister<T, C> = {
    (middleware: ParallelMiddleware<T, C>): PluginRegisterInfo<T, C>;
};
export declare type ParallelExec<T, C = never> = C extends {} ? (initialValue: T, context: C) => void : (initialValue: T) => void;
export declare type Parallel<T, C> = {
    exec: ParallelExec<T, C>;
    register: TParallelRegister<T, C>;
    listeners: ParallelMiddleware<T, C>[];
};
export declare type CreateParallelHook = {
    <T, C = undefined>(factoryContext: PluginFactoryContext): Parallel<T, C>;
};
export interface parallel extends CreateParallelHook {
}
export interface parallelHook extends CreateParallelHook {
}
export declare const parallel: CreateParallelHook;
