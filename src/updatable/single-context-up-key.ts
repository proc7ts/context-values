/**
 * @packageDocumentation
 * @module @proc7ts/context-values/updatable
 */
import { nextArg, noop } from '@proc7ts/call-thru';
import { AfterEvent, afterEventBy, afterThe, EventKeeper, nextAfterEvent } from '@proc7ts/fun-events';
import { ContextKeyDefault, ContextValueOpts } from '../context-key';
import { ContextKeyError } from '../context-key-error';
import { ContextValues } from '../context-values';
import { ContextSupply } from './context-supply';
import { ContextUpKey, ContextUpRef } from './context-up-key';

/**
 * Single updatable context value reference.
 *
 * @typeparam Value  Context value type.
 */
export type SingleContextUpRef<Value> = ContextUpRef<AfterEvent<[Value]>, Value>;

/**
 * Single updatable context value key.
 *
 * The associated value is an `AfterEvent` keeper of the last source value. It is always present,
 * but signals an [[ContextKeyError]] error on attempt to receive an absent value.
 *
 * It is an error to provide a `null` or `undefined` {@link ContextRequest.Opts.or fallback value} when requesting
 * an associated value. Use an `afterThe()` result as a fallback instead.
 *
 * @typeparam Value  Context value type.
 */
export class SingleContextUpKey<Value>
    extends ContextUpKey<AfterEvent<[Value]>, Value>
    implements SingleContextUpRef<Value> {

  /**
   * A provider of context value used when there is no value associated with this key.
   */
  readonly byDefault: ContextKeyDefault<Value, ContextUpKey<AfterEvent<[Value]>, Value>>;

  get upKey(): this {
    return this;
  }

  /**
   * Constructs single updatable context value key.
   *
   * @param name  Human-readable key name.
   * @param seedKey  Value seed key. A new one will be constructed when omitted.
   * @param byDefault  Optional default value provider. If unspecified or `undefined` the key has no default
   * value.
   */
  constructor(
      name: string,
      {
        seedKey,
        byDefault = noop,
      }: {
        seedKey?: ContextUpKey.SeedKey<Value>;
        byDefault?: ContextKeyDefault<Value, ContextUpKey<AfterEvent<[Value]>, Value>>;
      } = {},
  ) {
    super(name, seedKey);
    this.byDefault = byDefault;
  }

  grow<Ctx extends ContextValues>(
      opts: ContextValueOpts<Ctx, AfterEvent<[Value]>, EventKeeper<Value[]> | Value, AfterEvent<Value[]>>,
  ): AfterEvent<[Value]> {

    const value = opts.seed.keepThru((...sources: Value[]) => {
      if (sources.length) {
        // Sources present. Take the last one.
        return nextArg(sources[sources.length - 1]);
      }

      // Sources absent. Attempt to detect the backup value.
      const backup = opts.byDefault(() => {

        const defaultValue = this.byDefault(opts.context, this);

        return defaultValue && afterThe(defaultValue);
      });

      if (backup != null) {
        return nextAfterEvent(backup); // Backup value found.
      }

      // Backup value is absent. Construct an error response.
      return nextAfterEvent(afterEventBy<[Value]>(() => {
        throw new ContextKeyError(this);
      }));
    });

    const supply = opts.context.get(ContextSupply, { or: null });

    return supply ? value.tillOff(supply) : value;
  }

}

