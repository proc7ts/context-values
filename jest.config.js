export default {
  preset: 'ts-jest/presets/default-esm',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/entries/**/*.ts', // Tested in `@proc7ts/context-builder`
    '!src/**/*.spec.ts',
    '!src/**/index.ts',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'target/coverage',
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
  extensionsToTreatAsEsm: ['.ts'],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        suiteName: '@proc7ts/context-values',
        outputDirectory: './target/test-results',
        classNameTemplate: '{classname}: {title}',
        titleTemplate: '{classname}: {title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: 'true',
      },
    ],
  ],
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.spec.json',
      useESM: true,
    },
  },
};
