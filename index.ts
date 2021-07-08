// === Waterfall hooks ===
// returns an object with two functions `payload.exec` and` payload.register`

// the register function accepts as second parameter a middleware function that
// will be executed whenever the `payload.exec` function is executed
// if the callback returns something other than undefined, this value will be passed to the next registered middleware

// Parallel Hooks =====
// as waterfall hook, but all the callbacks provided by payload.register are executed in parallel
// and the return of each callback will be ignored by the next registered callback

export * from './parallelHook';
export * from './waterfallHook';
