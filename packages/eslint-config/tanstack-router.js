import pluginRouter from '@tanstack/eslint-plugin-router';
import {defineConfig} from 'eslint/config';
import {config as reactConfig} from './react.js';

export const config = defineConfig([
  ...reactConfig,
  ...pluginRouter.configs['flat/recommended'],
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      '@typescript-eslint/only-throw-error': [
        'error',
        {
          allow: [
            {
              from: 'package',
              package: '@tanstack/router-core',
              name: 'Redirect',
            },
            {
              from: 'package',
              package: '@tanstack/router-core',
              name: 'NotFoundError',
            },
          ],
        },
      ],
      'react-refresh/only-export-components': [
        'warn',
        {
          extraHOCs: [
            'createFileRoute',
            'createLazyFileRoute',
            'createRootRoute',
            'createRootRouteWithContext',
            'createLink',
            'createRoute',
            'createLazyRoute',
          ],
        },
      ],
    },
  },
]);
