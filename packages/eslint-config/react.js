import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import {defineConfig} from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import {config as baseConfig} from './base.js';

export const config = defineConfig([
  ...baseConfig,
  js.configs.recommended,
  // eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
      },
    },
  },
  pluginReactHooks.configs.flat.recommended,
  reactRefresh.configs.recommended,
  //   {
  //     files: ['**/*.{ts,tsx}'],
  //     rules: {
  //       '@typescript-eslint/no-import-type-side-effects': 'error',
  //     },
  //   },
  {
    rules: {
      'react-refresh/only-export-components': ['warn', {allowConstantExport: true}],
    },
  },
]);
