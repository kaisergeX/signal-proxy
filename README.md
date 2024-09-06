# Signal Proxy

A simple reactive system for your Javascript application. TypeScript fully supported.

[JS Signals proposal](https://github.com/tc39/proposal-signals) is currently in Stage 1. This package draws strong inspiration from [KnockoutJS](https://github.com/knockout/knockout)'s concepts and [SolidJS](https://github.com/solidjs)'s Signal, enabling us to use Signals in vanilla JavaScript.

## Installation

Via `npmjs`

```
npm i @kaiverse/signal
```

or

```
pnpm add @kaiverse/signal
```

Via `jsr`

<details>
  <summary> (Not available yet)</summary>
  
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
</details><br/>

Via `unpkg` CDN:

```
unpkg.com/@kaiverse/signal
```

## Compatibility

Signal is a [**Proxy**](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Proxy) object at its core, please check [compatibility section](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Proxy#browser_compatibility).

## Example

[Playground source code](packages/signal/src/playground/index.ts)

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
  console.log('count =', count());
});

const doubled = createComputed(() => count() * 2);

createEffect(() => {
  console.log('[computed] doubled =', doubled());
});
```



## Framework ports?

- [Experimental] [React signal hooks](apps/playground/src/hooks/react-signal.ts) implementation ([React playground source code](apps/playground/src/routes/signal/route.lazy.tsx)). **DO NOT** use in production.<br/><small>Those hooks work, but its lack of testing and seems that the usage of memory is inefficient. An alternative approach may be better. Please feel free to open PRs. Your contributions are welcomed and appreciated.</small>

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