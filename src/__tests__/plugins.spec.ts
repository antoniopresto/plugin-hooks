import { createAsyncPlugin } from '../asyncPlugin';
import { createSyncPlugin } from '../syncPlugin';

describe('plugins', () => {
  describe('async', () => {
    test('async', async () => {
      const plugin = createAsyncPlugin<number, {}>();

      plugin.pushMiddleware(async function times2(val) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(val * 2);
          }, 100);
        });
      });

      plugin.pushMiddleware(async function times3(val) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(val * 3);
          }, 100);
        });
      });

      const r1 = await plugin.dispatch(Promise.resolve(1) as any, {});
      expect(r1).toBe(6);
    });

    test('returnOnFirstResult', async () => {
      const plugin = createAsyncPlugin<number, {}>({ returnOnFirst: true });

      plugin.pushMiddleware(function a1() {});
      plugin.pushMiddleware(async function a3() {
        return 3333;
      });

      plugin.pushMiddleware(async function times3(val) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(val * 3);
          }, 100);
        });
      });

      const r1 = await plugin.dispatch(Promise.resolve(1) as any, {});
      expect(r1).toBe(3333);
    });

    test('handle finish', async () => {
      const plugin = createAsyncPlugin<number>();

      plugin(function times2(val, _, self) {
        setTimeout(() => {
          expect(this).toMatchObject({
            finishedValue: 555,
            finished: true,
            finishedError: null,
            handledCount: 1,
            ignoredCount: 2,
          });
        }, 200);

        return this.finish(555);
      });

      let calledNext = false;
      plugin(async function times3(val) {
        calledNext = true;
        return val * 3;
      });

      plugin(async function times4(val) {
        calledNext = true;
        return val * 4;
      });

      const r1 = await plugin.dispatch(1);
      expect(r1).toBe(555);
      expect(calledNext).toBe(false);

      await new Promise((resolve) => {
        setTimeout(() => {
          resolve(1);
        }, 300);
      });
    });

    test('throw early result', async () => {
      const plugin = createAsyncPlugin<number>();

      plugin.pushMiddleware(function times2(val, _, info) {
        expect(info.index).toBe(0);

        throw {
          fulfilled: true,
          value: 7777,
        };
      });

      let calledNext = false;
      plugin.pushMiddleware(async function times3(val) {
        calledNext = true;
        return val * 3;
      });

      const r1 = await plugin.dispatch(1);
      expect(r1).toBe(7777);
      expect(calledNext).toBe(false);
    });

    test('return initial value when without plugins', async () => {
      const plugin = createAsyncPlugin<number>();

      const r1 = await plugin.dispatch(1);
      expect(r1).toBe(1);
    });
  });

  describe('sync', () => {
    test('sync', () => {
      const plugin = createSyncPlugin<any>();

      const mutable: any = {};

      plugin(function times2(val) {
        val.foo = 123;
      });

      plugin(function times2(val) {
        val.bar = 456;
      });

      const r1 = plugin.dispatch(mutable);

      expect(r1).toBe(undefined);
      expect(mutable.foo).toBe(123);
      expect(mutable.bar).toBe(456);
    });

    test('handle finish', async () => {
      const plugin = createSyncPlugin<number>();

      plugin(function times1(val, _a, context) {
        return context.finish(555);
      });

      let calledNext = false;
      plugin(async function times3(val) {
        calledNext = true;
        return val * 3;
      });

      expect(calledNext).toBe(false);
    });

    test('throw errors', async () => {
      const plugin = createSyncPlugin<any>();

      const mutable: any = {};

      plugin(function times2(val) {
        throw 'foo';
      });

      plugin(function times2(val) {
        return (val.bar = 456);
      });

      expect(() => plugin.dispatch(mutable)).toThrow('foo');
    });
  });
});
