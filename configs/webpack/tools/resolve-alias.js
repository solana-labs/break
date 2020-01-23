const { resolvePath } = require("./helpers");
const paths = require("./paths");

module.exports = {
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json"],
    alias: {
      "@fonts": resolvePath(paths.aliasFonts),
      "@images": resolvePath(paths.aliasImages),
      "@styles": resolvePath(paths.aliasStyles)
    }
  }
};
