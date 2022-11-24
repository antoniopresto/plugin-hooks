import { parallel, Parallel, TParallelRegister } from './parallelHook';
import { TWaterfallRegister, waterfall, Waterfall } from './waterfallHook';
import { PluginOptions } from './createHooks';

export class PluginHook<Value, Context> {
  static create = <Value, Context>(options?: PluginOptions<Value, Context>) => {
    return new PluginHook<Value, Context>(options);
  };

  constructor(options?: PluginOptions<Value, Context>) {
    this.hook = waterfall(options);
  }

  hook: Waterfall<Value, Context>;

  dispatch = (value: Value, context: Context) => {
    return this.hook.exec(value, context);
  };

  listen: TWaterfallRegister<Value, Context> = (...args) => {
    return this.hook.register(...args);
  };

  get listeners() {
    return this.hook.listeners;
  }
}

export class PluginHookSync<Value, Context> {
  static create = <Value, Context>(options?: PluginOptions<Value, Context>) => {
    return new PluginHookSync<Value, Context>(options);
  };

  constructor(options?: PluginOptions<Value, Context>) {
    this.hook = parallel(options);
  }

  hook: Parallel<Value, Context>;

  dispatch = (value: Value, context: Context) => {
    return this.hook.exec(value, context);
  };

  listen: TParallelRegister<Value, Context> = (...args) => {
    return this.hook.register(...args);
  };

  get listeners() {
    return this.hook.listeners;
  }
}
