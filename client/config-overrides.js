const { override } = require('customize-cra');

module.exports = override(
  (config) => {
    // fix Can't resolve 'crypto'
    config.resolve.fallback = {
      crypto: false,
      http: false,
      //https.Agent is not a constructor
      stream: 'stream-browserify',
      https: 'agent-base', 
process: false,
fs: false,
      zlib: false,
      url: false,
      // fix Buffer is not defined

        buffer: require.resolve('buffer'),
        Buffer: require.resolve('buffer'),
    };
    return config;
  }
);