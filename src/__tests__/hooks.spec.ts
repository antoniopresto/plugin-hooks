import { waterfall } from '../waterfallHook';
import { parallel } from '../parallelHook';

describe('hooks', () => {
  describe('waterfall', () => {
    test('waterfall', async () => {
      const hook = waterfall<number, {}>();

      hook.register(async function times2(val) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(val * 2);
          }, 100);
        });
      });

      hook.register(async function times3(val) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(val * 3);
          }, 100);
        });
      });

      const r1 = await hook.exec(Promise.resolve(1) as any, {});
      expect(r1).toBe(6);
    });

    test('returnOnFirstResult', async () => {
      const hook = waterfall<number, {}>({ returnOnFirst: true });

      hook.register(function a1() {});
      hook.register(async function a3() {
        return 3333;
      });

      hook.register(async function times3(val) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(val * 3);
          }, 100);
        });
      });

      const r1 = await hook.exec(Promise.resolve(1) as any, {});
      expect(r1).toBe(3333);
    });

    test('handle finish', async () => {
      const hook = waterfall<number>();

      hook.register(function times2(val, _, self) {
        setTimeout(() => {
          expect(this).toMatchObject({
            finishedValue: 555,
            finished: true,
            finishedError: null,
            handledCount: 1,
            ignoredCount: 2,
          });
        }, 200);

        return self.finish(555);
      });

      let calledNext = false;
      hook.register(async function times3(val) {
        calledNext = true;
        return val * 3;
      });

      hook.register(async function times4(val) {
        calledNext = true;
        return val * 4;
      });

      const r1 = await hook.exec(1);
      expect(r1).toBe(555);
      expect(calledNext).toBe(false);

      await new Promise((resolve) => {
        setTimeout(() => {
          resolve(1);
        }, 300);
      });
    });

    test('throw early result', async () => {
      const hook = waterfall<number>();

      hook.register(function times2(val, _, info) {
        expect(info.index).toBe(0);

        throw {
          fulfilled: true,
          value: 7777,
        };
      });

      let calledNext = false;
      hook.register(async function times3(val) {
        calledNext = true;
        return val * 3;
      });

      const r1 = await hook.exec(1);
      expect(r1).toBe(7777);
      expect(calledNext).toBe(false);
    });

    test('return initial value when without plugins', async () => {
      const hook = waterfall<number>();

      const r1 = await hook.exec(1);
      expect(r1).toBe(1);
    });
  });

  describe('parallel', () => {
    test('parallel', () => {
      const hook = parallel<any>();

      const mutable: any = {};

      hook.register(function times2(val) {
        val.foo = 123;
      });

      hook.register(function times2(val) {
        val.bar = 456;
      });

      const r1 = hook.exec(mutable);

      expect(r1).toBe(undefined);
      expect(mutable.foo).toBe(123);
      expect(mutable.bar).toBe(456);
    });

    test('handle finish', async () => {
      const hook = parallel<number>();

      hook.register(function times1(val, _a, context) {
        return context.finish(555);
      });

      let calledNext = false;
      hook.register(async function times3(val) {
        calledNext = true;
        return val * 3;
      });

      expect(calledNext).toBe(false);
    });

    test('throw errors', async () => {
      const hook = parallel<any>();

      const mutable: any = {};

      hook.register(function times2(val) {
        throw 'foo';
      });

      hook.register(function times2(val) {
        return (val.bar = 456);
      });

      expect(() => hook.exec(mutable)).toThrow('foo');
    });
  });
});
