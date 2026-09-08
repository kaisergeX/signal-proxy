# @kaiverse/signal-react

## 0.5.0

### Minor Changes

- 1e150da: `signalProxy`!: callback is now optional, 3rd args become an options object instead of comparision function.
- d75b87a: Add `useSyncSignalValue` & `useSignalValue` hooks. If just read from a single Signal without deriving, prefer these instead of computed hooks.

### Patch Changes

- Updated dependencies [26669db]
- Updated dependencies [1e150da]
  - @kaiverse/signal@0.5.0

## 0.4.0

### Minor Changes

- 8bb56c6: Fix a bug that causes `useSignal` & `useSyncSignal` trigger related effects on creation.
- 8438819: Add `useSyncComputed` that integrated with `useSyncExternalStore`.

### Patch Changes

- Updated dependencies [0c9e183]
- Updated dependencies [0c9e183]
  - @kaiverse/signal@0.4.0

## 0.3.1

### Patch Changes

- b8d45e8: README - Update install command
- Updated dependencies [b8d45e8]
  - @kaiverse/signal@0.3.1

## 0.3.0

### Minor Changes

- 1cc2220: (signal-react) add react adapter for `@kaiverse/signal`

### Patch Changes

- Updated dependencies [1cc2220]
  - @kaiverse/signal@0.3.0
