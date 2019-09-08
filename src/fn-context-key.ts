import { noop } from 'call-thru';
import { AfterEvent, EventKeeper } from 'fun-events';
import { ContextKeyDefault, ContextSeedKey, ContextValueOpts } from './context-key';
import { ContextKeyError } from './context-key-error';
import { ContextUpKey, ContextUpRef } from './context-up-key';
import { ContextValues } from './context-values';

/**
 * A reference to updatable context function value.
 *
 * @typeparam Args  Function arguments tuple type.
 * @typeparam Ret  Function return value type.
 * @typeparam Seed  Value seed type.
 */
export type FnContextRef<Args extends any[], Ret = void, Seed = unknown> =
    ContextUpRef<(this: void, ...args: Args) => Ret, (this: void, ...args: Args) => Ret, Seed>;

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
 * an associated value. Use an `afterEventOf()` result as a fallback instead.
 *
 * @typeparam Args  Function arguments tuple type.
 * @typeparam Ret  Function return value type.
 */
export class FnContextKey<Args extends any[], Ret = void>
    extends ContextUpKey<(this: void, ...args: Args) => Ret, (this: void, ...args: Args) => Ret>
    implements FnContextRef<Args, Ret, AfterEvent<((this: void, ...args: Args) => Ret)[]>> {

  /**
   * Constructs a function that will be called unless fallback provided.
   */
  readonly byDefault: (this: void, context: ContextValues, key: FnContextKey<Args, Ret>) =>
      (this: void, ...args: Args) => Ret;

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
        seedKey?: ContextSeedKey<
            ((this: void, ...args: Args) => Ret) | EventKeeper<((this: void, ...args: Args) => Ret)[]>,
            AfterEvent<((this: void, ...args: Args) => Ret)[]>>,
        byDefault?: ContextKeyDefault<(this: void, ...args: Args) => Ret, FnContextKey<Args, Ret>>,
      } = {},
  ) {
    super(name, seedKey);
    this.byDefault = (context, key) => byDefault(context, key) || (() => { throw new ContextKeyError(this); });
  }

  grow<Ctx extends ContextValues>(
      opts: ContextValueOpts<
          Ctx,
          (this: void, ...args: Args) => Ret,
          EventKeeper<((this: void, ...args: Args) => Ret)[]> | ((this: void, ...args: Args) => Ret),
          AfterEvent<((this: void, ...args: Args) => Ret)[]>>,
  ): (this: void, ...args: Args) => Ret {

    let delegated!: (this: void, ...args: Args) => Ret;

    opts.seed((...fns) => {
      if (fns.length) {
        delegated = fns[fns.length - 1];
      } else {

        const defaultProvider = () => this.byDefault(opts.context, this);
        const fallback = opts.byDefault(defaultProvider);

        delegated = fallback || defaultProvider();
      }
    });

    return (...args) => delegated(...args);
  }

}
