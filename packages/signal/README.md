[![.github/workflows/ci.yml](https://github.com/kaisergeX/signal-proxy/actions/workflows/ci.yml/badge.svg)](https://github.com/kaisergeX/signal-proxy/actions/workflows/ci.yml)

<div align="center">
<h1>Signal Proxy</h1>

<p>A simple reactive system for your Javascript application.<br/>Zero dependency, TypeScript fully supported.</p>
</div>

[JS Signals proposal](https://github.com/tc39/proposal-signals) is currently in Stage 1. This package draws strong inspiration from [KnockoutJS](https://github.com/knockout/knockout)'s concepts and [SolidJS](https://github.com/solidjs)'s Signal, enabling us to use Signals in vanilla JavaScript.

## Installation

### Via `npmjs`

```
npm i @kaiverse/signal
```

or

```
pnpm add @kaiverse/signal
```

### Via `jsr`

```
deno add @kaiverse/signal
```

or

```
npx jsr add @kaiverse/signal
```

or

```
pnpm dlx jsr add @kaiverse/signal
```

### Via `unpkg` CDN:

```
unpkg.com/@kaiverse/signal
```

## Compatibility

Signal is a [**Proxy**](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Proxy) object at its core, please check [compatibility section](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Proxy#browser_compatibility).

## Example

[Playground source code](https://github.com/kaisergeX/signal-proxy/blob/main/packages/signal/src/playground/index.ts)

### Use Signal Proxy

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

### Signal utilities examples

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

## Framework ports?

### React

[Experimental] [React signal hooks](https://github.com/kaisergeX/signal-proxy/blob/main/apps/playground/src/hooks/react-signal.ts) implementation. **DO NOT** use in production.

<small>Those hooks work, but its lack of testing and seems that the usage of memory is inefficient. An alternative approach may be better. Please feel free to open PRs. Your contributions are welcomed and appreciated.</small>

[React playground source code](https://github.com/kaisergeX/signal-proxy/blob/main/apps/playground/src/routes/signal/route.lazy.tsx)
