module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/context-ref.ts',
    '!src/specs.ts',
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
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.spec.json',
    },
  },
};
