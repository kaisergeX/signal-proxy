# Signal Playground
 
[![React](https://img.shields.io/badge/React-000?style=for-the-badge&logo=react&logoColor=fff)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-fff?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)

## Engines Requirements

`node@18` or later

`pnpm@9` or later

## Environment Variables

Generate env file.

```bash
cp .env.example .env.development
```

## Installation

```bash
pnpm i
```

## Development server

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) with your browser to see the result.

## Coding convention

Check lint and format.

```bash
pnpm lint
```

To fix all "auto-fixable" issues.

```bash
pnpm lint--fix
```

## Build

```bash
pnpm build
```

Preview lastest build on local.

```bash
pnpm preview
```

## Preview on mobile

Development Preview

```bash
  pnpm dev --host
```

Build Preview

```bash
  pnpm preview --host
```

Then open link on mobile with the same network with your PC.

Default port: `4173` (built preview) & `5173` (dev preview)

`http://[your IPv4 Address]:[port]/`

`http://localhost:[port]/`
