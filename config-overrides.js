const { DefinePlugin } = require(`webpack`);
const path = require(`path`);
const {
  useEslintRc,
  addBundleVisualizer,
  override,
  addWebpackPlugin,
  addBabelPlugins,
  addWebpackAlias,
  addBabelPreset,
} = require(`customize-cra`);
const { version } = require(`./package.json`);

module.exports = {
  webpack(config, env) {
    if (env === `production`) {
      config.output.filename = `js/[name]/[chunkhash].js`;
      config.output.chunkFilename = `js/[name]/[chunkhash].js`;
      config.plugins[5].options.filename = `css/[name]/[contenthash].css`;
      config.plugins[5].options.chunkFilename = `css/[name]/[contenthash].css`;
      config.module.rules[2].oneOf[0].options.name = `media/[name]/[hash].[ext]`;
      config.module.rules[2].oneOf[7].options.name = `media/[name]/[hash].[ext]`;
      config.optimization.runtimeChunk = true;
      config.optimization.splitChunks.maxInitialRequests = Infinity;
      config.optimization.splitChunks.minSize = 0;
      config.optimization.splitChunks.cacheGroups = {
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-hot-loader|@hot-loader\/react-dom)[\\/]/,
          name: `react`,
          chunks: `all`,
        },
        analytics: {
          test: /[\\/]node_modules[\\/](@a1motion\/analytics|@sentry\/.*)[\\/]/,
          name: `analytics`,
          chunks: `all`,
        },
        polyfill: {
          test: /[\\/]node_modules[\\/](core-js\/.*)[\\/]/,
          name: `polyfill`,
          chunks: `all`,
        },
      };
    }

    config = override(
      useEslintRc(path.join(__dirname, `.eslintrc`)),
      addWebpackPlugin(
        new DefinePlugin({
          __RELEASE__: JSON.stringify(version),
        })
      ),
      addBabelPreset(`linaria/babel`),
      addBabelPlugins(`react-hot-loader/babel`),
      addWebpackAlias({
        "react-dom": `@hot-loader/react-dom`,
      }),
      env === `production` && addBundleVisualizer()
    )(config);

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
