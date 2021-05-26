import { describe, expect, it } from '@jest/globals';
import { AfterEvent, afterEventBy, afterThe, digAfter } from '@proc7ts/fun-events';
import { noop } from '@proc7ts/primitives';
import { ContextKeyError } from '../context-key-error';
import type { ContextValueSlot } from '../key';
import { ContextRegistry } from '../registry';
import { ContextUpKey } from './context-up-key';

describe('ContextUpKey', () => {
  describe('createUpKey', () => {
    it('throws when no value', () => {

      class TestKey extends ContextUpKey<AfterEvent<string[]>, string> {

        readonly upKey: ContextUpKey.SimpleUpKey<string[], string>;

        constructor() {
          super('test-key');
          this.upKey = this.createUpKey(noop);
        }

        grow(slot: ContextValueSlot<AfterEvent<string[]>, ContextUpKey.Source<string>, AfterEvent<string[]>>): void {

          const value = slot.seed.do(digAfter((...sources: string[]): AfterEvent<string[]> => {
            if (sources.length) {
              // Sources present. Use them.
              return afterThe(...sources);
            }
            if (slot.hasFallback && slot.or) {
              return slot.or; // Backup value found.
            }

            // Backup value is absent. Construct an error response.
            return afterEventBy<string[]>(() => {
              throw new ContextKeyError(this);
            });
          }));

          slot.insert(value);
        }

      }

      const key = new TestKey();
      const values = new ContextRegistry().newValues();

      expect(() => values.get(key.upKey)(noop)).toThrow(new ContextKeyError(key.upKey));
    });
  });
});
