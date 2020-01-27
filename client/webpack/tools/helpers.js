const path = require("path");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const paths = require("./paths");

//process
const appDirectory = fs.realpathSync(process.cwd());

//helper
const resolvePath = relativePath => path.resolve(appDirectory, relativePath);

module.exports = {
  htmlWebpackPluginHelper: function(config) {
    return [
      new HtmlWebpackPlugin({
        ...config,
        inject: true,
        filename: "index.html",
        template: resolvePath(`${paths.source}/index.html`),
        chunks: "bundle",
        base: "/"
      })
    ];
  },
  resolvePath,
  appDirectory
};
