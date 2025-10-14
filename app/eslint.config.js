import js from '@eslint/js';
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';

const reactRecommendedRules =
  reactPlugin.configs['flat/recommended']?.rules ?? reactPlugin.configs.recommended?.rules ?? {};
const reactHooksRecommendedRules =
  reactHooksPlugin.configs['recommended-latest']?.rules ?? reactHooksPlugin.configs.recommended?.rules ?? {};
const reactRefreshRecommendedRules = reactRefreshPlugin.configs.vite?.rules ?? {};

export default tseslint.config(
  {
    ignores: ['dist'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      prettier,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-refresh': reactRefreshPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...reactRecommendedRules,
      ...reactHooksRecommendedRules,
      ...reactRefreshRecommendedRules,
  'prettier/prettier': ['warn', { endOfLine: 'auto' }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
      'react/no-danger': 'warn',
      'react/jsx-key': 'error',
  'react/react-in-jsx-scope': 'off',
  'react/jsx-uses-react': 'off',
  'react/prop-types': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
);
