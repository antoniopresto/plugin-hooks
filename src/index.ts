// === Async plugins ===
// returns an object with two functions `payload.exec` and` payload.register`

// the register function accepts as second parameter a middleware function that
// will be executed whenever the `payload.exec` function is executed
// if the callback returns something other than undefined, this value will be passed to the next registered middleware

// Sync Plugins =====
// as async plugin, but all the callbacks provided by payload.register are executed in sync
// and the return of each callback will be ignored by the next registered callback

import { createSyncPlugin, CreateSyncPlugin } from './syncPlugin';
import { createAsyncPlugin, CreateAsyncPlugin } from './asyncPlugin';

export * from './syncPlugin';
export * from './asyncPlugin';
export * from './createPlugins';

export class PluginHooks {
  static sync: CreateSyncPlugin = createSyncPlugin;
  static async: CreateAsyncPlugin = createAsyncPlugin;
}

export interface PluginHooks {
  sync: CreateSyncPlugin;
  async: CreateAsyncPlugin;
}
