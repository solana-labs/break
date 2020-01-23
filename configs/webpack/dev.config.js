const merge = require("webpack-merge");

const mode = "development";
process.env.NODE_ENV = mode;

// helpers
const {
  htmlWebpackPluginHelper,
  resolvePath,
  appDirectory
} = require("./tools/helpers");
const commonConfig = require("./common.config");
const paths = require("./tools/paths");

module.exports = function(webpackEnv, argv) {
  const configHtmlWebpackPlugin = {
    minify: false
  };

  return merge(commonConfig, {
    mode,
    output: {
      filename: "[name].bundle.js",
      chunkFilename: "[name].bundle.js"
    },
    plugins: [...htmlWebpackPluginHelper(configHtmlWebpackPlugin)],
    devServer: {
      contentBase: resolvePath(paths.source),
      port: 8081,
      hot: true,
      open: false,
      index: "index.html",
      watchContentBase: true,
      historyApiFallback: true,
      watchOptions: {
        ignored: /node_modules/
      },
      proxy: {
        "/api": "http://localhost:8080"
      }
    },
    devtool: "inline-source-map",
    target: "web"
  });
};
