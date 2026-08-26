# Playground App Development Guide

## Setup & Installation
- Requires Node.js 22+ and pnpm 11+
- Install dependencies with: `pnpm i`
- Generate routes before development: `pnpm generate-routes`

## Development Commands
- Start dev server: `pnpm dev` (default port 3000)
- Run linting: `pnpm lint`
- Format code: `pnpm format` or `pnpm format:fix`
- Build for production: `pnpm build`
- Preview build locally: `pnpm preview`

## Architecture Notes
- Uses TanStack Router with React (v19)
- Implements auto-code splitting via `@tanstack/router-plugin`
- Powered by Vite with React plugin and TanStack Devtools integration
- Uses Tailwind CSS for styling with `@tailwindcss/vite` plugin
- Entry point at `src/main.tsx` using TanStack Router's `createRouter`

## Key Implementation Details
- Route tree generated automatically via `tsr generate`
- Routes configured in `src/routes/` directory structure
- Devtools enabled with `@tanstack/devtools-vite` plugin (must be first plugin)
- Path aliases configured: `#/*` maps to `src/*`
- TypeScript configuration extends `@repo/typescript-config/react.json`
