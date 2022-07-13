module.exports = {
  sourceMaps: true,
  ignore: ['**/*.spec.ts'],
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: '12',
        },
      },
    ],
    ['@babel/preset-typescript'],
  ],
  plugins: [[require.resolve('@babel/plugin-proposal-class-properties')]],
};
