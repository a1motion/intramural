const { DefinePlugin } = require(`webpack`);
const path = require(`path`);
const { useEslintRc, addBundleVisualizer } = require(`customize-cra`);
const { version } = require(`./package.json`);

module.exports = {
  webpack(config, env) {
    if (env === `production`) {
      config.output.filename = `js/[chunkhash].js`;
      config.output.chunkFilename = `js/[chunkhash].js`;
      config.plugins[5].options.filename = `css/[contenthash].css`;
      config.plugins[5].options.chunkFilename = `css/[contenthash].css`;
      config.module.rules[2].oneOf[0].options.name = `media/[hash].[ext]`;
      config.module.rules[2].oneOf[7].options.name = `media/[hash].[ext]`;
    }

    config.plugins.push(
      new DefinePlugin({
        __RELEASE__: JSON.stringify(version),
      })
    );
    config = useEslintRc(path.join(__dirname, `.eslintrc`))(config);
    config = addBundleVisualizer()(config);
    const { test, include, ...babelOptions } = config.module.rules[2].oneOf[1]; // eslint-disable-line
    config.module.rules[2].oneOf[1] = {
      test,
      include,
      rules: [
        babelOptions,
        {
          loader: `linaria/loader`,
          options: {
            cacheDirectory: `src/.linaria_cache`,
            sourceMap: process.env.NODE_ENV !== `production`,
            babelOptions: {
              presets: babelOptions.options.presets,
            },
          },
        },
      ],
    };
    return config;
  },
};
