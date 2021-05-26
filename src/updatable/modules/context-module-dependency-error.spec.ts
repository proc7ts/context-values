import { describe, expect, it } from '@jest/globals';
import { ContextModule } from './context-module';
import { ContextModuleDependencyError } from './context-module-dependency-error';

describe('ContextModuleDependencyError', () => {
  describe('message', () => {
    it('reflects multiple reasons', () => {

      const error = new ContextModuleDependencyError(
          new ContextModule('test'),
          [
            [new ContextModule('dep1')],
            [new ContextModule('dep2'), 'reason 2'],
          ],
      );

      expect(error.message).toBe(
          'Failed to load ContextModule(test): '
          + 'ContextModule(dep1) not loaded, ContextModule(dep2) failed to load (reason 2)',
      );
    });
    it('reflects no reasons', () => {

      const error = new ContextModuleDependencyError(new ContextModule('test'));

      expect(error.message).toBe('Failed to load ContextModule(test)');
    });
  });
});
