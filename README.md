[![npm](https://img.shields.io/npm/v/@kaiverse/signal)](https://www.npmjs.com/package/@kaiverse/signal)
[![JSR](https://jsr.io/badges/@kaiverse/signal)](https://jsr.io/@kaiverse/signal)
[![.github/workflows/ci.yml](https://github.com/kaisergeX/signal-proxy/actions/workflows/ci.yml/badge.svg)](https://github.com/kaisergeX/signal-proxy/actions/workflows/ci.yml)

<div align="center">
<h1>Signal Proxy</h1>

<p>A simple reactive system for your Javascript application.<br/>Zero dependency, TypeScript fully supported.</p>
</div>

[JS Signals proposal](https://github.com/tc39/proposal-signals) is currently in Stage 1. This package draws strong inspiration from [KnockoutJS](https://github.com/knockout/knockout)'s concepts and [SolidJS](https://github.com/solidjs)'s Signal, enabling us to use Signals in vanilla JavaScript.

## Docs

[Documentation page](packages/signal/README.md)

## Run this monorepo locally

Please check the root `package.json`'s `engines` field for the env requirement, then run:

```
pnpm i
pnpm build:pkgs
pnpm dev
```

JS playground: http://localhost:5174

React playground: http://localhost:5173

### Packages

- [@kaiverse/signal](packages/signal): Signal core implementation
- [playground](apps/playground): React playground
