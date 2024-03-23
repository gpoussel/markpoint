import hideoo from '@hideoo/eslint-config'

export default hideoo([
  {
    files: ['**/src/**/*.ts', '**/tests/**/*.ts'],
    rules: {
      'unicorn/prefer-query-selector': 'off',
    },
  },
])
