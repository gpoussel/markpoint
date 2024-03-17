import hideoo from '@hideoo/eslint-config'

export default hideoo([
  {
    files: ['**/src/*.ts'],
    rules: {
      'unicorn/prefer-query-selector': 'off',
    },
  },
])
