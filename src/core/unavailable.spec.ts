import { describe, expect, it } from '@jest/globals';
import { cxSingle } from '../entries';
import { CxEntry } from './entry';
import { CxReferenceError } from './reference-error';
import { cxUnavailable } from './unavailable';

describe('cxUnavailable', () => {
  const entry: CxEntry<string> = {
    perContext: cxSingle(),
    toString() {
      return '[CxEntry test]';
    },
  };

  it('throws on access', () => {
    expect(() => cxUnavailable(entry)()).toThrow(
      new CxReferenceError(entry, 'The [CxEntry test] is unavailable'),
    );
  });
  it('throws custom error on access', () => {
    const message = 'Test message';
    const reason = new Error('Test reason');

    expect(() => cxUnavailable(entry, message, reason)()).toThrow(
      new CxReferenceError(entry, message, reason),
    );
  });
});
