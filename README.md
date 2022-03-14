# plugin-hooks

Create plugin hooks in the [webpack plugin hooks style](https://github.com/webpack/tapable).

```ts
    const hook = hooks.waterfall<string>();

    hook.register(async (n) => `${n}_1`); // registers a callback to transforms the input, adding the `_1` suffix
    hook.register(async (n) => `${n}_2`); // adds the `_2` suffix

    expect(await hook.exec('A')).toBe('A_1_2');
    expect(await hook.exec('B')).toBe('B_1_2');
```
