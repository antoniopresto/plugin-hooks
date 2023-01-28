# `plugin-hooks`

`plugin-hooks` is a Typescript npm package that provides the ability to compose and execute functions as a chain of plugins. It supports both synchronous and asynchronous plugins.

## Installation

Install `plugin-hooks` using npm:

```
$ npm install plugin-hooks
```

## Create a Plugin

You can create a plugin using one of the following functions:

### Create an Asynchronous Plugin

To create an asynchronous plugin, use the `createAsyncPlugin` function. This function takes two optional parameters which are the `initialValue` and `options`.

```typescript
import { createAsyncPlugin } from 'plugin-hooks';

const plugin = createAsyncPlugin<number, {}>();
```

The parameters are:

- `initialValue` (optional): the initial value of the plugin.
- `options` (optional): an object that contains options for the plugin.

The options object supports the following option:

- `returnOnFirst` (optional): a boolean value that indicates whether the plugin should return the first fulfilled result instead of continuing

### Create a Synchronous Plugin

To create a synchronous plugin, use the `createSyncPlugin` function. This function takes one optional parameter which is the `initialValue`.

```typescript
import { createSyncPlugin } from 'plugin-hooks';

const plugin = createSyncPlugin<any>();
```

The parameters are:

- `initialValue`: the initial value of the plugin.

## Push Middleware

You can add middleware to the plugin using the `pushMiddleware` function. This function takes a function as its only parameter.

```typescript
plugin.pushMiddleware(function times2(val) {
  // do something with the value
});
```

## Dispatch

Once you have added all the middleware you need, you can dispatch the plugin with the `dispatch` function. This function takes the `initialValue` as its only parameter and returns the final value will be resolved with the final value.

```typescript
const r1 = await asyncPlugin.dispatch(1);
```

## Finish Plugin Early

For asynchronous plugins, you can finish the plugin early with the `finish` function. This function takes a value as its only parameter and immediately resolves the promise.

```typescript
plugin(function times2(val, _, self) {
  return self.finish(555);
});
```

For synchronous plugins, you can finish the plugin early with the `finish` function. This function takes a value as its only parameter.

```typescript
plugin(function times2(val, _, context) {
  return context.finish(555);
});
```

## Return Initial Value When Without Plugins

If there are no middleware added to the plugin, the initial value will be returned when the `dispatch` function is called.

```typescript
const r1 = await plugin.dispatch(1);
expect(r1).toBe(1);
```

## Throw Errors

If an error is thrown in a synchronous plugin, it will be propagated to the `dispatch` function.

```typescript
plugin(function times2(val) {
  throw 'foo';
});

expect(() => plugin.dispatch(mutable)).toThrow('foo');
```
