const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

// helpers
const { resolvePath } = require("./tools/helpers");
const babelLoaderOptions = require("./tools/babel-loader-options");
const paths = require("./tools/paths");
const resolveAlias = require("./tools/resolve-alias");

const configForkTsCheckerWebpackPlugin = {
  tsconfig: resolvePath("tsconfig.json"),
  useTypescriptIncrementalApi: true
};

const mode = process.env.NODE_ENV;
const devMode = mode === "development" ? true : false;

module.exports = {
  context: resolvePath(paths.source),
  entry: {
    main: "./index.tsx"
  },
  output: {
    path: resolvePath(paths.dist)
  },
  node: {
    fs: "empty"
  },
  resolve: resolveAlias.resolve,
  module: {
    strictExportPresence: true,
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: "babel-loader",
            options: babelLoaderOptions
          }
        ],
        exclude: /node_modules/
      },
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: "babel-loader",
            options: babelLoaderOptions
          },
          {
            loader: "ts-loader",
            options: {
              transpileOnly: true
            }
          }
        ],
        exclude: /node_modules/
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              hmr: devMode
            }
          },
          {
            loader: "css-loader",
            options: {
              importLoaders: 1
            }
          },
          {
            loader: "sass-loader"
          }
        ]
      },
      {
        oneOf: [
          {
            test: /\.(bmp|gif|jpe?g|svg|png)$/,
            use: [
              {
                loader: "url-loader",
                options: {
                  limit: 10000,
                  name: `${paths.media}/[name].[hash:8].[ext]`
                }
              }
            ]
          },
          {
            test: /\.(woff|woff2|eot|ttf|otf)$/,
            loader: "file-loader",
            options: {
              name: `${paths.fonts}/[name].[hash:8].[ext]`
            }
          },
          {
            exclude: [
              /\.(js|mjs|jsx|ts|tsx)$/,
              /\.html$/,
              /\.json$/,
              /\.(sa|sc|c)ss$/
            ],
            loader: "file-loader",
            options: {
              name: `${paths.other}/[name].[hash:8].[ext]`
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin(configForkTsCheckerWebpackPlugin),
    new MiniCssExtractPlugin({
      filename: devMode ? "[name].css" : "[name].[contenthash:8].css",
      chunkFilename: devMode ? "[id].css" : "[id].[contenthash:8].css"
    })
  ],
  performance: {
    hints: false
  }
};
