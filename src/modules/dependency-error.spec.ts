import { describe, expect, it } from '@jest/globals';
import { CxDependencyError } from './dependency-error';
import { CxModule } from './module';

describe('CxDependencyError', () => {
  describe('message', () => {
    it('reflects multiple reasons', () => {

      const error = new CxDependencyError(
          new CxModule('test'),
          [
            [new CxModule('dep1')],
            [new CxModule('dep2'), 'reason 2'],
          ],
      );

      expect(error.message).toBe(
          'Failed to load [CxModule test]: '
          + '[CxModule dep1] not loaded, [CxModule dep2] failed to load (reason 2)',
      );
    });
    it('reflects no reasons', () => {

      const error = new CxDependencyError(new CxModule('test'));

      expect(error.message).toBe('Failed to load [CxModule test]');
    });
  });
});
