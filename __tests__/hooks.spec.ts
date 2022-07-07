import { createHooks } from '../createHooks';
import { waterfall } from '../waterfallHook';
import { parallel } from '../parallelHook';

describe('hooks', () => {
  test('create right context', async () => {
    const hooks = createHooks({});
    const p = hooks.parallel();
    const w = hooks.waterfall();

    expect(p.context).toBe(hooks.context);
    expect(w.pluginContext).toBe(hooks.context);
    expect(hooks.context._id).toMatch(/\d{5,}/);
  });

  test('getHandlerIndex', async () => {
    const hooks = createHooks({});
    const p = hooks.parallel();

    function p1() {}
    function p2() {}

    p.register(p1);
    p.register(p1);
    p.register(p2);
    p.register(p1);

    expect(p.context.getHandlerIndex(p2)).toBe(2);
  });

  test('__onRegister', async () => {
    const hooks = createHooks({});

    expect(() => hooks.waterfall().register({} as any)).toThrow(
      `"object" is not a valid middleware type`
    );

    expect(() => hooks.waterfall().register(() => undefined)).toThrow(
      `hook middleware must be named function.`
    );

    expect(() => hooks.parallel().register({} as any)).toThrow(
      `"object" is not a valid middleware type`
    );

    expect(() => hooks.parallel().register(() => undefined)).toThrow(
      `hook middleware must be named function.`
    );
  });

  test('executionsCountLimit', async () => {
    const hooks = createHooks({ executionsCountLimit: 1 });

    const pa = hooks.parallel();
    const wa = hooks.parallel();

    pa.register(function foo() {});
    pa.register(function foo() {});
    wa.register(function bar() {});
    wa.register(function bar2() {});

    await wa.exec(1);

    expect(() => pa.exec(1)).toThrow(
      'This plugin has a executions count limit of 1.\n' +
        'The next run count would be 2.'
    );

    await expect(async () => wa.exec(1)).rejects.toThrow(
      'This plugin has a executions count limit of 1.\n' +
        'The next run count would be 2.'
    );
  });

  describe('waterfall', () => {
    test('waterfall', async () => {
      const hook = waterfall<number>();

      hook.register(function times2(val) {
        return val * 2;
      });

      hook.register(async function times3(val) {
        return val * 3;
      });

      const r1 = await hook.exec(1);
      expect(r1).toBe(6);
    });
  });

  describe('parallel', () => {
    test('parallel', () => {
      const hook = parallel<any>();

      const mutable: any = {};

      hook.register(function times2(val) {
        return (val.foo = 123);
      });

      hook.register(function times2(val) {
        return (val.bar = 456);
      });

      const r1 = hook.exec(mutable);

      expect(r1).toBe(undefined);
      expect(mutable.foo).toBe(123);
      expect(mutable.bar).toBe(456);
    });
  });
});
