module.exports = {
  parserOptions: {
    project: './tsconfig-base.json',
  },
  extends: ['.eslintrc.js'],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      extends: ['.eslintrc.js'],
      rules: {
        '@typescript-eslint/no-floating-promises': 'error',
        //"@typescript-eslint/no-misused-promises": "error" // still requires some fixes
      },
    },
  ],
}
