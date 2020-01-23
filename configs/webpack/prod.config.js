const merge = require("webpack-merge");
const TerserPlugin = require("terser-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");

const mode = "production";
process.env.NODE_ENV = mode;

// helpers
const { htmlWebpackPluginHelper, resolvePath } = require("./tools/helpers");
const commonConfig = require("./common.config");

module.exports = function(webpackEnv, argv) {
  const configHtmlWebpackPlugin = {
    minify: {
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      useShortDoctype: true
    }
  };

  return merge(commonConfig, {
    bail: true,
    mode,
    output: {
      filename: "[name].[contenthash:8].bundle.js",
      chunkFilename: "[name].[contenthash:8].bundle.js"
    },
    plugins: [
      new CleanWebpackPlugin(),
      ...htmlWebpackPluginHelper(configHtmlWebpackPlugin)
    ],
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          sourceMap: true,
          cache: true,
          parallel: true,
          terserOptions: {
            ecma: 5
          }
        })
        // new OptimizeCSSAssetsPlugin()
      ],
      splitChunks: {
        chunks: "all"
      },
      runtimeChunk: false
    }
  });
};
