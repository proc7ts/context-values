/**
 * @packageDocumentation
 * @module @proc7ts/context-values/updatable
 */
import { AfterEvent, afterThe, digAfter, EventKeeper } from '@proc7ts/fun-events';
import { noop } from '@proc7ts/primitives';
import type { ContextKeyDefault, ContextValueSlot } from '../context-key';
import { ContextKeyError } from '../context-key-error';
import type { ContextValues } from '../context-values';
import { contextDestroyed } from './context-destroyed';
import { ContextUpKey, ContextUpRef } from './context-up-key';

/**
 * A reference to updatable context function value.
 *
 * @typeParam TArgs - Function arguments tuple type.
 * @typeParam TRet - Function return value type.
 */
export type FnContextRef<TArgs extends any[], TRet = void> =
    ContextUpRef<(this: void, ...args: TArgs) => TRet, (this: void, ...args: TArgs) => TRet>;

/**
 * A key of updatable context function value.
 *
 * The value associated with this key is a function that delegates to the last provided function. The target function
 * may be updated.
 *
 * The value is always present. But if the function to delegate is not provided, and no default/fallback function
 * provided, an attempt to call the delegate would throw an {@link ContextKeyError}.
 *
 * It is an error to provide a `null` or `undefined` {@link ContextRequest.Opts.or fallback value} when requesting
 * an associated value. Use an `afterThe()` result as a fallback instead.
 *
 * @typeParam TArgs - Function arguments tuple type.
 * @typeParam TRet - Function return value type.
 */
export class FnContextKey<TArgs extends any[], TRet = void>
    extends ContextUpKey<(this: void, ...args: TArgs) => TRet, (this: void, ...args: TArgs) => TRet>
    implements FnContextRef<TArgs, TRet> {

  /**
   * Constructs a function that will be called unless fallback provided.
   */
  readonly byDefault: (this: void, context: ContextValues, key: FnContextKey<TArgs, TRet>) =>
      (this: void, ...args: TArgs) => TRet;

  readonly upKey: ContextUpKey.SimpleUpKey<
      [(this: void, ...args: TArgs) => TRet],
      (this: void, ...args: TArgs) => TRet>;

  /**
   * Constructs updatable context function key.
   *
   * @param name - Human-readable key name.
   * @param seedKey - Value seed key. A new one will be constructed when omitted.
   * @param byDefault - Constructs a default function to call. If unspecified then the default function would raise
   * an error.
   */
  constructor(
      name: string,
      {
        seedKey,
        byDefault = noop,
      }: {
        seedKey?: ContextUpKey.SeedKey<((this: void, ...args: TArgs) => TRet)>;
        byDefault?: ContextKeyDefault<(this: void, ...args: TArgs) => TRet, FnContextKey<TArgs, TRet>>;
      } = {},
  ) {
    super(name, seedKey);
    this.byDefault = (context, key) => byDefault(context, key)
        || (() => {
          throw new ContextKeyError(this);
        });
    this.upKey = this.createUpKey(
        slot => {
          slot.insert(slot.seed.do(digAfter(
              (...fns): AfterEvent<[(this: void, ...args: TArgs) => TRet]> => {
                if (fns.length) {
                  return afterThe(fns[fns.length - 1]);
                }

                if (slot.hasFallback && slot.or) {
                  return slot.or;
                }

                return afterThe(this.byDefault(slot.context, this));
              },
          )));
        },
    );
  }

  grow(
      slot: ContextValueSlot<
          (this: void, ...args: TArgs) => TRet,
          EventKeeper<((this: void, ...args: TArgs) => TRet)[]> | ((this: void, ...args: TArgs) => TRet),
          AfterEvent<((this: void, ...args: TArgs) => TRet)[]>>,
  ): void {

    let delegated: (this: void, ...args: TArgs) => TRet;

    slot.context.get(
        this.upKey,
        slot.hasFallback ? { or: slot.or != null ? afterThe(slot.or) : slot.or } : undefined,
    )!(
        fn => delegated = fn,
    ).whenOff(
        reason => delegated = contextDestroyed(reason),
    );

    slot.insert((...args) => delegated(...args));
  }

}
