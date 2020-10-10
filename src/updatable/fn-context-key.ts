/**
 * @packageDocumentation
 * @module @proc7ts/context-values/updatable
 */
import { AfterEvent, afterThe, EventKeeper, nextAfterEvent } from '@proc7ts/fun-events';
import { noop } from '@proc7ts/primitives';
import { ContextKeyDefault, ContextValueSlot } from '../context-key';
import { ContextKeyError } from '../context-key-error';
import { ContextValues } from '../context-values';
import { contextDestroyed } from './context-destroyed';
import { ContextUpKey, ContextUpRef } from './context-up-key';

/**
 * A reference to updatable context function value.
 *
 * @typeParam Args  Function arguments tuple type.
 * @typeParam Ret  Function return value type.
 */
export type FnContextRef<Args extends any[], Ret = void> =
    ContextUpRef<(this: void, ...args: Args) => Ret, (this: void, ...args: Args) => Ret>;

/**
 * A key of updatable context function value.
 *
 * The value associated with this key is a function that delegates to the last provided function. The target function
 * may be updated.
 *
 * The value is always present. But if the function to delegate is not provided, and no default/fallback function
 * provided, an attempt to call the delegate would throw an [[ContextKeyError]].
 *
 * It is an error to provide a `null` or `undefined` {@link ContextRequest.Opts.or fallback value} when requesting
 * an associated value. Use an `afterThe()` result as a fallback instead.
 *
 * @typeParam Args  Function arguments tuple type.
 * @typeParam Ret  Function return value type.
 */
export class FnContextKey<Args extends any[], Ret = void>
    extends ContextUpKey<(this: void, ...args: Args) => Ret, (this: void, ...args: Args) => Ret>
    implements FnContextRef<Args, Ret> {

  /**
   * Constructs a function that will be called unless fallback provided.
   */
  readonly byDefault: (this: void, context: ContextValues, key: FnContextKey<Args, Ret>) =>
      (this: void, ...args: Args) => Ret;

  readonly upKey: ContextUpKey.UpKey<(this: void, ...args: Args) => Ret, (this: void, ...args: Args) => Ret>;

  /**
   * Constructs updatable context function key.
   *
   * @param name  Human-readable key name.
   * @param seedKey  Value seed key. A new one will be constructed when omitted.
   * @param byDefault  Constructs a default function to call. If unspecified then the default function would raise
   * an error.
   */
  constructor(
      name: string,
      {
        seedKey,
        byDefault = noop,
      }: {
        seedKey?: ContextUpKey.SeedKey<((this: void, ...args: Args) => Ret)>;
        byDefault?: ContextKeyDefault<(this: void, ...args: Args) => Ret, FnContextKey<Args, Ret>>;
      } = {},
  ) {
    super(name, seedKey);
    this.byDefault = (context, key) => byDefault(context, key) || (() => { throw new ContextKeyError(this); });
    this.upKey = this.createUpKey(
        slot => {
          slot.insert(slot.seed.keepThru(
              (...fns) => {
                if (fns.length) {
                  return fns[fns.length - 1];
                }

                if (slot.hasFallback && slot.or) {
                  return nextAfterEvent(slot.or);
                }

                return nextAfterEvent(afterThe(this.byDefault(slot.context, this)));
              },
          ));
        },
    );
  }

  grow(
      slot: ContextValueSlot<
          (this: void, ...args: Args) => Ret,
          EventKeeper<((this: void, ...args: Args) => Ret)[]> | ((this: void, ...args: Args) => Ret),
          AfterEvent<((this: void, ...args: Args) => Ret)[]>>,
  ): void {

    let delegated: (this: void, ...args: Args) => Ret;

    slot.context.get(
        this.upKey,
        slot.hasFallback ? { or: slot.or != null ? afterThe(slot.or) : slot.or } : undefined,
    )!.to(
        fn => delegated = fn,
    ).whenOff(
        reason => delegated = contextDestroyed(reason),
    );

    slot.insert((...args) => delegated(...args));
  }

}
