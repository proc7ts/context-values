import { describe, expect, it } from '@jest/globals';
import { cxSingle } from '../entries';
import { CxEntry } from './entry';
import { CxReferenceError } from './reference-error';

describe('CxReferenceError', () => {
  const entry: CxEntry<string> = {
    perContext: cxSingle(),
    toString() {
      return '[CxEntry test]';
    },
  };

  it('has default message', () => {
    const error = new CxReferenceError(entry);

    expect(error.entry).toBe(entry);
    expect(error.message).toBe('The [CxEntry test] has no value');
    expect(error.reason).toBeUndefined();
    expect(String(error)).toBe('CxReferenceError: The [CxEntry test] has no value');
  });
  it('accepts custom message', () => {
    const error = new CxReferenceError(entry, 'Test');

    expect(error.entry).toBe(entry);
    expect(error.message).toBe('Test');
    expect(error.reason).toBeUndefined();
    expect(String(error)).toBe('CxReferenceError: Test');
  });
  it('accepts reason', () => {
    const reason = new Error('Test');
    const error = new CxReferenceError(entry, undefined, reason);

    expect(error.entry).toBe(entry);
    expect(error.message).toBe('The [CxEntry test] has no value. Error: Test');
    expect(error.reason).toBe(reason);
    expect(String(error)).toBe('CxReferenceError: The [CxEntry test] has no value. Error: Test');
  });
});
