import { configureJest } from '@run-z/project-config';

export default await configureJest({
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/entries/**/*.ts', // Tested in `@proc7ts/context-builder`
    '!src/**/*.spec.ts',
    '!src/**/index.ts',
    '!**/node_modules/**',
  ],
});
