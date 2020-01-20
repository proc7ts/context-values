/**
 * @module context-values
 */
import { flatMapIt, mapIt, overArray } from 'a-iterable';
import { asis, NextArgs, nextArgs, noop } from 'call-thru';
import {
  afterEach,
  AfterEvent,
  afterEventBy,
  afterSupplied,
  afterThe,
  EventKeeper,
  isEventKeeper,
  trackValue,
  ValueTracker,
} from 'fun-events';
import { ContextKey, ContextKey__symbol, ContextKeyDefault, ContextSeedKey, ContextValueOpts } from './context-key';
import { ContextKeyError } from './context-key-error';
import { ContextRef } from './context-ref';
import { ContextSeeder } from './context-seeder';
import { ContextValueProvider } from './context-value-spec';
import { ContextValues } from './context-values';

/**
 * @internal
 */
class ContextUpSeeder<Ctx extends ContextValues, Src>
    implements ContextSeeder<Ctx, Src | EventKeeper<Src[]>, AfterEvent<Src[]>> {

  private readonly _providers: ValueTracker<ContextValueProvider<Ctx, Src | EventKeeper<Src[]>>[]> = trackValue([]);

  provide(provider: ContextValueProvider<Ctx, Src | EventKeeper<Src[]>>): () => void {
    this._providers.it = [...this._providers.it, provider];
    return () => {

      const providers = this._providers.it;
      const found = providers.indexOf(provider);

      if (found >= 0) {
        this._providers.it = providers.slice(0, found).concat(providers.slice(found + 1));
      }
    };
  }

  seed(context: Ctx, initial: AfterEvent<Src[]> = afterThe<Src[]>()): AfterEvent<Src[]> {
    return this.combine(initial, upSrcKeepers(context, this._providers));
  }

  isEmpty(): boolean {
    return false;
  }

  combine(first: AfterEvent<Src[]>, second: AfterEvent<Src[]>): AfterEvent<Src[]> {
    return afterEach(
        first,
        second,
    ).keep.thru(
        flatUpSources,
    );
  }

}

/**
 * @internal
 */
function upSrcKeepers<Ctx extends ContextValues, Src>(
    context: Ctx,
    providersTracker: ValueTracker<ContextValueProvider<Ctx, Src | EventKeeper<Src[]>>[]>,
): AfterEvent<Src[]> {
  return providersTracker.read.keep.dig(
      providers => !providers.length
          ? afterThe()
          : afterEach(
              ...mapIt(
                  mapIt(
                      overArray(providers),
                      prov => prov(context),
                  ),
                  toUpSrcKeeper,
              ),
          ).keep.thru(
              flatUpSources,
          ),
  );
}

/**
 * @internal
 */
function toUpSrcKeeper<Src>(src: null | undefined | Src | EventKeeper<Src[]>): AfterEvent<Src[]> {
  return src == null ? afterThe() : isUpSrcKeeper(src) ? afterSupplied(src) : afterThe(src);
}

/**
 * @internal
 */
function isUpSrcKeeper<Src>(src: Src | EventKeeper<Src[]>): src is EventKeeper<Src[]> {
  return (typeof src === 'object' || typeof src === 'function') && isEventKeeper(src as (object | Function));
}

/**
 * @internal
 */
function flatUpSources<Src, NextReturn>(...sources: Src[][]): NextArgs<Src[], NextReturn> {
  return nextArgs<Src[], NextReturn>(
      ...flatMapIt(overArray(sources), asis),
  );
}

/**
 * @internal
 */
class ContextSeedUpKey<Src> extends ContextSeedKey<Src | EventKeeper<Src[]>, AfterEvent<Src[]>> {

  seeder<Ctx extends ContextValues>(): ContextSeeder<Ctx, Src | EventKeeper<Src[]>, AfterEvent<Src[]>> {
    return new ContextUpSeeder();
  }

}

/**
 * Updatable context value reference.
 *
 * @typeparam Value  Context value type.
 * @typeparam Src  Source value type.
 */
export interface ContextUpRef<Value, Src> extends ContextRef<Value, Src | EventKeeper<Src[]>> {

  readonly [ContextKey__symbol]: ContextUpKey<Value, Src>;

}

/**
 * @internal
 */
class ContextUpKeyUpKey<Value, Src>
    extends ContextKey<ContextUpKey.Up<Value>, Src | EventKeeper<Src[]>, AfterEvent<Src[]>> {

  get seedKey(): ContextSeedKey<Src | EventKeeper<Src[]>, AfterEvent<Src[]>> {
    return this._key.seedKey;
  }

  constructor(
      private readonly _key: ContextUpKey<Value, Src>,
      readonly grow: <Ctx extends ContextValues>(
          opts: ContextValueOpts<Ctx, ContextUpKey.Up<Value>, EventKeeper<Src[]> | Src, AfterEvent<Src[]>>,
      ) => ContextUpKey.Up<Value>,
  ) {
    super(_key.name + ':up');
  }

}

/**
 * Abstract implementation of updatable context value key.
 *
 * Accepts single value sources and `EventKeeper`s of value source arrays.
 *
 * Collects value sources into `AfterEvent` keeper of source values.
 *
 * @typeparam Value  Context value type.
 * @typeparam Src  Source value type.
 */
export abstract class ContextUpKey<Value, Src>
    extends ContextKey<Value, Src | EventKeeper<Src[]>, AfterEvent<Src[]>>
    implements ContextUpRef<Value, Src> {

  readonly seedKey: ContextSeedKey<Src | EventKeeper<Src[]>, AfterEvent<Src[]>>;

  /**
   * A key of context value containing an {@link ContextUpKey.Up updates keeper} of this key value.
   *
   * It is expected to report any updates to this key's value.
   *
   * The value of updates key is constructed by [[growUp]] function out of the same seed.
   */
  abstract readonly upKey: ContextUpKey.UpKey<Value, Src>;

  /**
   * Constructs simple context value key.
   *
   * @param name  Human-readable key name.
   * @param seedKey  Value seed key. A new one will be constructed when omitted.
   */
  constructor(name: string, seedKey?: ContextSeedKey<Src | EventKeeper<Src[]>, AfterEvent<Src[]>>) {
    super(name);
    this.seedKey = seedKey || new ContextSeedUpKey(this);
  }

  /**
   * A key of context value containing an {@link ContextUpKey.Up updates keeper} of the value of this key.
   *
   * @param grow  A function that grows an updates keeper of context value out of its seed.
   *
   * @returns New updates keeper key.
   */
  protected createUpKey(
      grow: <Ctx extends ContextValues>(
          opts: ContextValueOpts<Ctx, ContextUpKey.Up<Value>, EventKeeper<Src[]> | Src, AfterEvent<Src[]>>,
      ) => ContextUpKey.Up<Value>,
  ): ContextUpKey.UpKey<Value, Src> {
    return new ContextUpKeyUpKey(this, grow);
  }

}

export namespace ContextUpKey {

  /**
   * A type of updates keeper of context value.
   *
   * It is the same as a type of original value if the value itself is an event keeper, or an `AfterEvent` keeper
   * of original value otherwise.
   *
   * @typeparam Value  Original context value type.
   */
  export type Up<Value> = Value extends AfterEvent<any>
      ? Value
      : (Value extends EventKeeper<infer E>
          ? AfterEvent<E>
          : AfterEvent<[Value]>);

  /**
   * A key of context value containing an {@link ContextUpKey.Up updates keeper} of this key value.
   *
   * @typeparam Value  Context value type.
   * @typeparam Src  Source value type.
   */
  export type UpKey<Value, Src> = ContextKey<ContextUpKey.Up<Value>, Src>;

}

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
        seedKey?: ContextSeedKey<Value | EventKeeper<Value[]>, AfterEvent<Value[]>>;
        byDefault?: ContextKeyDefault<Value, ContextUpKey<AfterEvent<[Value]>, Value>>;
      } = {},
  ) {
    super(name, seedKey);
    this.byDefault = byDefault;
  }

  grow<Ctx extends ContextValues>(
      opts: ContextValueOpts<Ctx, AfterEvent<[Value]>, EventKeeper<Value[]> | Value, AfterEvent<Value[]>>,
  ): AfterEvent<[Value]> {
    return opts.seed.keep.dig((...sources) => {
      if (sources.length) {
        // Sources present. Take the last one.
        return afterThe(sources[sources.length - 1]);
      }

      // Sources absent. Attempt to detect the backup value.
      const backup = opts.byDefault(() => {

        const defaultValue = this.byDefault(opts.context, this);

        return defaultValue && afterThe(defaultValue);
      });

      if (backup != null) {
        return backup; // Backup value found.
      }

      // Backup value is absent. Construct an error response.
      return afterEventBy<[Value]>(() => {
        throw new ContextKeyError(this);
      });
    });
  }

}

/**
 * Single updatable context value reference.
 *
 * @typeparam Src  Source value type.
 */
export type MultiContextUpRef<Src> = ContextUpRef<AfterEvent<Src[]>, Src>;

/**
 * Multiple updatable context values key.
 *
 * The associated value is an `AfterEvent` keeper of the source values. It is always present, even though
 * the array can be empty.
 *
 * It is an error to provide a `null` or `undefined` {@link ContextRequest.Opts.or fallback value} when requesting
 * an associated value. Use an `afterThe()` result as a fallback instead.
 *
 * @typeparam Src  Source value type.
 */
export class MultiContextUpKey<Src>
    extends ContextUpKey<AfterEvent<Src[]>, Src>
    implements MultiContextUpRef<Src> {

  /**
   * A provider of context value used when there is no value associated with this key.
   */
  readonly byDefault: ContextKeyDefault<readonly Src[], ContextUpKey<AfterEvent<Src[]>, Src>>;

  get upKey(): this {
    return this;
  }

  /**
   * Constructs multiple updatable context value key.
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
        seedKey?: ContextSeedKey<Src | EventKeeper<Src[]>, AfterEvent<Src[]>>;
        byDefault?: ContextKeyDefault<readonly Src[], ContextUpKey<AfterEvent<Src[]>, Src>>;
      } = {},
  ) {
    super(name, seedKey);
    this.byDefault = byDefault;
  }

  grow<Ctx extends ContextValues>(
      opts: ContextValueOpts<Ctx, AfterEvent<Src[]>, EventKeeper<Src[]> | Src, AfterEvent<Src[]>>,
  ): AfterEvent<Src[]> {
    return opts.seed.keep.dig((...sources) => {
      if (sources.length) {
        // Sources present. Use them.
        return afterThe(...sources);
      }

      // Sources absent. Attempt to detect the backup value.
      const backup = opts.byDefault(() => {

        const defaultValue = this.byDefault(opts.context, this);

        return defaultValue ? afterThe(...defaultValue) : afterThe();
      });

      if (backup != null) {
        return backup; // Backup value found.
      }

      // Backup value is absent. Construct an error response.
      return afterEventBy<Src[]>(() => {
        throw new ContextKeyError(this);
      });
    });
  }

}
