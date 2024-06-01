// eslint.config.js

import prettier from 'eslint-plugin-prettier';
import unicorn from 'eslint-plugin-unicorn';

export default {
  languageOptions: {
    globals: {
      node: true,
      es6: true
    }
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: {
    prettier,
    unicorn
  },
  extends: [
    'eslint:recommended',
    'plugin:unicorn/recommended'
  ],
  rules: {
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        trailingComma: 'none',
        arrowParens: 'avoid',
        embeddedLanguageFormatting: 'off'
      }
    ],
    'require-atomic-updates': 0,
    'no-extra-semi': 0,
    'no-mixed-spaces-and-tabs': 0,
    'unicorn/filename-case': 0,
    'unicorn/prevent-abbreviations': 0,
    'unicorn/no-array-reduce': 0,
    'unicorn/prefer-spread': 0
  }
}
