function removeTrackingPlugin(babel) {
  const { types: t } = babel;

  return {
    name: 'ast-transform', // not required
    visitor: {
      ImportDeclaration(path) {
        if (path.node.source.value === './util/tag-tracking' || path.node.source.value === './tag-tracking') {
          path.node.source.value = '@glimmer/validator';
        }
      },
    },
  };
}

module.exports = {
  presets: ['@babel/typescript'],
  plugins: [
    removeTrackingPlugin,
    'transform-node-env-inline',
    '@babel/plugin-proposal-optional-chaining',
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-proposal-class-properties', { loose: true }],
  ],
};
