import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import turboPlugin from 'eslint-plugin-turbo';
import {defineConfig} from 'eslint/config';
import tseslint from 'typescript-eslint';

/**
 * A shared ESLint configuration for the repository.
 */
export const config = defineConfig([
  eslint.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      'turbo/no-undeclared-env-vars': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_'},
      ],
    },
  },
  {
    ignores: ['dist', '**/dist', 'dist/**', '**/*.d.ts', 'node_modules', '**/routeTree.gen.ts'],
  },
]);
