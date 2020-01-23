module.exports = {
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
    "^.+\\.svg$": "<rootDir>/svgTransform.js"
  },
  testRegex: "(/tests/.*|(\\.|/)(uitest))\\.tsx?$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  moduleNameMapper: {
    "^.+\\.(css|less|scss)$": "identity-obj-proxy"
  },
  setupFiles: ["<rootDir>/jest.config.js", "jest-canvas-mock"],
  setupFilesAfterEnv: ["jest-enzyme"],
  testEnvironment: "enzyme"
};
