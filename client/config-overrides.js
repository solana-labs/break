module.exports = function override(config, env) {
  if (!config.module.rules) {
    config.module.rules = [];
  }

  config.module.rules.unshift({
    test: /\.worker\.ts$/,
    loader: "worker-loader",
  });

  return config;
};
