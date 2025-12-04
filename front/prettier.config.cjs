module.exports = {
  semi: true,
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  trailingComma: 'all',
  bracketSpacing: true,
  arrowParens: 'always',
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      options: {
        semi: true,
        singleQuote: true,
      },
    },
    {
      files: ['*.js', '*.jsx'],
      options: {
        semi: false,
      },
    },
  ],
};
