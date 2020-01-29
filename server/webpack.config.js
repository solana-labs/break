const webpack = require("webpack");
const path = require("path");
const nodeExternals = require("webpack-node-externals");

module.exports = (env, argv) => {
  let mode = argv.mode;
  let config = {
    mode,
    target: "node",
    entry: ["./src/index.ts"],
    node: {
      __dirname: false
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "server.js"
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: "ts-loader",
          exclude: /node_modules/
        }
      ]
    },
    resolve: {
      extensions: [".ts", ".js", ".json"]
    },
    externals: [nodeExternals()]
  };

  if (mode === "development") {
    config.watch = true;
  }

  return config;
};
