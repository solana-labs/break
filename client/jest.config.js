module.exports = {
  roots: ["<rootDir>/tests"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
    "^.+\\.svg$": "<rootDir>/svgTransform.js"
  },
  testRegex: "(/.*|(\\.|/)(uitest))\\.tsx?$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^.+\\.(css|less|scss)$": "identity-obj-proxy"
  },
  setupFiles: ["<rootDir>/jest.config.js", "jest-canvas-mock"],
  setupFilesAfterEnv: ["jest-enzyme"],
  testEnvironment: "enzyme"
};
