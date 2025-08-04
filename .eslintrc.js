module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
  },
  env: {
    es6: true,
    node: true,
  },
  plugins: ['@typescript-eslint', 'json', 'prettier', 'jest', 'simple-import-sort', 'unused-imports', 'html'],
  extends: [
    'eslint:recommended',
    'prettier',
    'plugin:jest/recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  globals: {},
  rules: {
    'jest/no-disabled-tests': 'off',
    'no-console': 'error',
    'no-process-env': 'error',
    'no-process-exit': 'error',
    'no-useless-escape': 'off',
    'object-shorthand': 'error',
    'prettier/prettier': 'error',
  },
  overrides: [
    {
      files: ['*.html'],
      env: {
        browser: true,
      },
    },
    {
      files: ['*.ts', '*.tsx'],
      extends: ['plugin:@typescript-eslint/recommended'],
      rules: {
        '@typescript-eslint/consistent-type-assertions': [
          'error',
          { assertionStyle: 'as', objectLiteralTypeAssertions: 'never' },
        ],
        '@typescript-eslint/member-delimiter-style': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
        '@typescript-eslint/no-empty-interface': 'off',
        '@typescript-eslint/ban-ts-ignore': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/camelcase': 'off',
        '@typescript-eslint/no-namespace': 'off',
        '@typescript-eslint/no-this-alias': 'off',
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        'jest/require-top-level-describe': [
          'error',
          {
            maxNumberOfTopLevelDescribes: 1,
          },
        ],
        'simple-import-sort/imports': 'error',
        'simple-import-sort/exports': 'error',
        'unused-imports/no-unused-imports': 'error',
        'unused-imports/no-unused-vars': [
          'warn',
          { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
        ],
        'no-constant-condition': ['error', { checkLoops: false }],
        'no-inner-declarations': 'off',
        curly: ['error'],
        'jest/no-focused-tests': 'error',
      },
    },
    {
      files: ['*.tsx'],
      extends: [
        'plugin:@typescript-eslint/recommended' /*, 'plugin:react/recommended', 'plugin:react-hooks/recommended'*/,
      ],
      rules: {
        'arrow-body-style': ['error', 'as-needed'],
        '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      },
    },
    {
      files: ['*.spec.ts'],
      rules: {
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
}
