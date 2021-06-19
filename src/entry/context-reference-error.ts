import { ContextEntry } from './context-entry';

/**
 * Represents an error when non-existent context value referenced. I.e. when requested context entry has no value.
 */
export class ContextReferenceError extends ReferenceError {

  /**
   * Illegally referred context entry.
   */
  readonly entry: ContextEntry<any>;

  /**
   * Constructs context context reference error.
   *
   * @param entry - Illegally referred context entry.
   * @param message - Arbitrary error message.
   */
  constructor(entry: ContextEntry<any>, message = `The ${String(entry)} has no value`) {
    super(message);
    this.entry = entry;
  }

}
