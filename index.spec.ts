import * as hooks from './index';

describe('plugin-hooks', () => {
  it('waterfall', async () => {
    const hook = hooks.waterfall<string>('hook1', 'number');

    hook.register('1', async (n) => `${n}_1`);
    hook.register('2', async (n) => `${n}_2`);

    expect(await hook.exec('A')).toBe('A_1_2');
    expect(await hook.exec('B')).toBe('B_1_2');
  });

  it('parallel', async () => {
    const hook = hooks.parallel<string>('', 'number');

    const f1 = jest.fn();

    hook.register('1', f1);

    expect(hook.exec('A')).toBe(undefined);
    expect(hook.exec('B')).toBe(undefined);

    expect(f1).toBeCalledWith('A', undefined);
    expect(f1).toBeCalledWith('B', undefined);
  });
});
