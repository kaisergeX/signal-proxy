[![.github/workflows/ci.yml](https://github.com/kaisergeX/signal-proxy/actions/workflows/ci.yml/badge.svg)](https://github.com/kaisergeX/signal-proxy/actions/workflows/ci.yml)

<div align="center">
<h1>Signal Proxy</h1>

<p>A lightweight, simple reactive system for your Javascript application.<br/>Zero dependencies, TypeScript fully supported.</p>
</div>

This package draws strong inspiration from [KnockoutJS](https://github.com/knockout/knockout)'s concepts and [SolidJS](https://github.com/solidjs)'s Signal, enabling us to use Signals in vanilla JavaScript. [JS Signals proposal](https://github.com/tc39/proposal-signals) is currently in Stage 1.

## Installation

### Via `npmjs`

```
npm i @kaiverse/signal
```

```
pnpm add @kaiverse/signal
```

### Via `jsr`

```
deno add @kaiverse/signal
```

```
npx jsr add @kaiverse/signal
```

```
pnpm dlx jsr add @kaiverse/signal
```

### Via CDN:

```
unpkg.com/@kaiverse/signal
```

## Compatibility

Signal is a [`Proxy`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Proxy) object at its core, please check [compatibility section](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Proxy#browser_compatibility).

## Documentation

[Functions & Types](https://jsr.io/@kaiverse/signal/doc)

## Example

[Playground source code](https://github.com/kaisergeX/signal-proxy/blob/main/packages/signal/src/playground/index.ts)

### 🔗Signal Proxy

````js
/**
 * ```html
 * <p id="fetch-result"></p>
 * <button type="button" onclick="fetchNextUser()">Get next user</button>
 * ```
 */

import {signalProxy} from '@kaiverse/signal';

const resultElement = document.getElementById('fetch-result');

const userSignal = signalProxy({userId: 123, reqCount: 0}, async (key, newValue) => {
  // Do something when any userSignal's prop value changes
  console.log(`[userSignal updated] key: ${key}, value: ${newValue}`);

  if (key === 'userId') {
    // Do something on `userId` changes only
    const userId = newValue;
    const response = await fetch(`${basePath}/user/${userId}`);
    const userData = await response.json();
    const totalReqCount = userSignal.reqCount + 1;
    userSignal.reqCount = totalReqCount;

    if (resultElement)
      resultElement.innerHTML = `Name: ${userData.name}<br/>Total requests: ${totalReqCount}`;
  }
});

function fetchNextUser() {
  userSignal.userId++;
}
````

### 🚦Signal utilities

If you have experience with SolidJS or ReactJS, you'll find these utility functions very familiar.

```js
import {createComputed, createEffect, createSignal} from '@kaiverse/signal';

const [count, setCount] = createSignal(0);

setInterval(() => {
  setCount((c) => c + 1); // or setCount(count() + 1)
}, 1000);

createEffect(() => {
  // log the count signal's value to the console every 1 second
  console.log('count =', count());
});

const doubled = createComputed(() => count() * 2);

createEffect(() => {
  console.log('[computed] doubled =', doubled());
});
```

## Frameworks compatibility

This package is built for vanilla JS/TS applications.

However, below are implementations to adapt with some frameworks's reactive systems.

### React Server Components & Functions

Compatible.

### React

Use this package instead: [Experimental] [`@kaiverse/signal-react`](https://jsr.io/@kaiverse/signal-react)

### Astro

Compatible. No additional setup required.

You can use it in the [component script](https://docs.astro.build/basics/astro-components/#the-component-script) section for server signals, and/or the [`<script>`](https://docs.astro.build/guides/client-side-scripts/#using-script-in-astro) tag for client signals.

### SolidJS, VueJS

... Just use their "signals" APIs.
