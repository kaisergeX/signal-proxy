import {defineConfig} from 'vite';
import {resolve} from 'path';
import dts from 'vite-plugin-dts';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [dts({rollupTypes: true})],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'signal',
      fileName: 'signal',
    },

    // rollupOptions: {
    //   // make sure to externalize deps that shouldn't be bundled
    //   // into your library
    //   external: ['vue'],
    //   output: {
    //     // Provide global variables to use in the UMD build
    //     // for externalized deps
    //     globals: {
    //       vue: 'Vue',
    //     },
    //   },
    // },
  },
});
