import { CxEntry } from './entry';
import { CxReferenceError } from './reference-error';

/**
 * Creates unavailable context entry accessor function.
 *
 * The created function would throw a {@link CxReferenceError} on each call.
 *
 * @param entry - The unavailable entry.
 * @param message - Error message.
 * @param reason - The reason why entry is no longer available.
 *
 * @returns A no-arg function that always throws.
 */
export function cxUnavailable(
    entry: CxEntry<unknown>,
    message?: string,
    reason?: unknown,
): (this: void) => never {
  return () => {
    throw new CxReferenceError(entry, message || `The ${entry} is unavailable`, reason);
  };
}
