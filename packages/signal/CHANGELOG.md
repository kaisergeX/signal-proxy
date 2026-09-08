# @kaiverse/signal

## 0.5.0

### Minor Changes

- 26669db: `signalProxy`!: The default values comparison logic now use strict equality (`===`) instead of `Object.is`
- 1e150da: `signalProxy`!: callback is now optional, 3rd args become an options object instead of comparision function.

## 0.4.0

### Minor Changes

- 0c9e183: Add `batch` API and enhance cleanup mechanism.
- 0c9e183: Add `withHMR` API and `hot` options for computeds & effects as a workaround to adapt with HMR mode in DEV. A dedicated bundler plugin that automates both is planned.

## 0.3.1

### Patch Changes

- b8d45e8: README - Update install command

## 0.3.0

### Minor Changes

- 1cc2220: (signal) Update README and playground to align with `@kaiverse/signal-react` adapter.

## 0.2.3

### Patch Changes

- aa1523b: fix `unTrack` infer return type

## 0.2.2

### Patch Changes

- 662cbc8: update README
- 5bd3877: docs update

## 0.2.1

### Patch Changes

- 86b8a57: Add MIT LICENSE, JSR config

## 0.2.0

### Minor Changes

- 34bb45c: update Effect type to avoid incorrect imported from React's effect type
- eb36183: exports the core `signalProxy`, update README

## 0.1.0

### Minor Changes

- Prepare for npm publish
- f9750b5: fix eslint flat config and lint errors
