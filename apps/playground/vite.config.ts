import {defineConfig} from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import {TanStackRouterVite} from '@tanstack/router-plugin/vite';

// vitest automatically sets NODE_ENV to 'test' when running tests
const isTestEnv = process.env.NODE_ENV === 'test';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), !isTestEnv && TanStackRouterVite()],
  server: {
    open: true,
  },
});
