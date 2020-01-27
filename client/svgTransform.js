module.exports = {
  process(): string {
    return "module.exports = {};";
  },
  getCacheKey(): string {
    // The output is always the same.
    return "svgTransform";
  }
};
