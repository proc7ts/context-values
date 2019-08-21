import { ContextKey } from './context-key';

/**
 * An error indicating the absence of context value with the given key.
 */
export class ContextKeyError extends Error {

  /**
   * A missing value key.
   */
  readonly key: ContextKey<any, any, any>;

  /**
   * Constructs an invalid context key error.
   *
   * @param key  Missing value key.
   * @param message  Arbitrary error message.
   */
  constructor(key: ContextKey<any, any, any>, message: string = `There is no value with key ${key}`) {
    super(message);
    this.key = key;
  }

}
