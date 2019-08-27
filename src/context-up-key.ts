/**
 * @module context-values
 */
import { flatMapIt, mapIt, overArray } from 'a-iterable';
import { asis, NextArgs, nextArgs, noop } from 'call-thru';
import {
  AfterEvent,
  afterEventBy,
  afterEventFrom,
  afterEventFromEach,
  afterEventOf,
  EventKeeper,
  isEventKeeper,
  trackValue,
  ValueTracker,
} from 'fun-events';
import { ContextKey, ContextSeedKey, ContextKeyDefault, ContextValueOpts } from './context-key';
import { ContextKeyError } from './context-key-error';
import { ContextRef } from './context-ref';
import { ContextSeeder } from './context-seeder';
import { ContextValueProvider } from './context-value-spec';
import { ContextValues } from './context-values';

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

  seed(context: Ctx, initial: AfterEvent<Src[]> = afterEventOf<Src[]>()): AfterEvent<Src[]> {
    return this.combine(initial, upSrcKeepers(context, this._providers));
  }

  isEmpty(): boolean {
    return false;
  }

  combine(first: AfterEvent<Src[]>, second: AfterEvent<Src[]>): AfterEvent<Src[]> {
    return afterEventFromEach(
        first,
        second,
    ).keep.thru(
        (...sources) => flatUpSources(sources),
    );
  }

}

function upSrcKeepers<Ctx extends ContextValues, Src>(
    context: Ctx,
    providersTracker: ValueTracker<ContextValueProvider<Ctx, Src | EventKeeper<Src[]>>[]>,
): AfterEvent<Src[]> {
  return providersTracker.read.keep.dig(
      providers => !providers.length ? afterEventOf() : afterEventFromEach(
          ...mapIt(
              mapIt(
                  overArray(providers),
                  prov => prov(context),
              ),
              toUpSrcKeeper,
          ),
      ).keep.thru(
          (...sources) => flatUpSources(sources),
      ));
}

function toUpSrcKeeper<Src>(src: null | undefined | Src | EventKeeper<Src[]>): AfterEvent<Src[]> {
  return src == null ? afterEventOf() : isUpSrcKeeper(src) ? afterEventFrom(src) : afterEventOf(src);
}

function isUpSrcKeeper<Src>(src: Src | EventKeeper<Src[]>): src is EventKeeper<Src[]> {
  return (typeof src === 'object' || typeof src === 'function') && isEventKeeper(src as (object | Function));
}

function flatUpSources<Src, NextReturn>(sources: Src[][]): NextArgs<Src[], NextReturn> {
  return nextArgs<Src[], NextReturn>(
      ...flatMapIt(overArray(sources), asis)
  );
}

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
 * @typeparam Seed  Value seed type.
 */
export type ContextUpRef<Value, Src, Seed = unknown> = ContextRef<Value, Src | EventKeeper<Src[]>, Seed>;

/**
 * Abstract implementation of updatable context value key.
 *
 * Accepts single value sources and `EventKeeper`s of value source arrays.
 *
 * Collects value sources into `AfterEvent` registrar of source values array receivers.
 *
 * @typeparam Value  Context value type.
 * @typeparam Src  Source value type.
 */
export abstract class ContextUpKey<Value, Src>
    extends ContextKey<Value, Src | EventKeeper<Src[]>, AfterEvent<Src[]>>
    implements ContextUpRef<Value, Src, AfterEvent<Src[]>> {

  readonly seedKey: ContextSeedKey<Src | EventKeeper<Src[]>, AfterEvent<Src[]>>;

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

}

/**
 * Single updatable context value reference.
 *
 * @typeparam Value  Context value type.
 * @typeparam Seed  Value seed type.
 */
export type SingleContextUpRef<Value, Seed = unknown> = ContextUpRef<AfterEvent<[Value]>, Value, Seed>;

/**
 * Single updatable context value key.
 *
 * The associated value is an `AfterEvent` registrar of receivers of the last source value. It is always present,
 * but signals an [[ContextKeyError]] error on attempt to receive an absent value.
 *
 * It is an error to provide a `null` or `undefined` {@link ContextRequest.Opts.or fallback value} when requesting
 * an associated value. Use an `afterEventOf()` result as a fallback instead.
 *
 * @typeparam Value  Context value type.
 */
export class SingleContextUpKey<Value>
    extends ContextUpKey<AfterEvent<[Value]>, Value>
    implements SingleContextUpRef<Value, AfterEvent<Value[]>> {

  /**
   * A provider of context value used when there is no value associated with this key.
   */
  readonly byDefault: ContextKeyDefault<Value, ContextUpKey<AfterEvent<[Value]>, Value>>;

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
        seedKey?: ContextSeedKey<Value | EventKeeper<Value[]>, AfterEvent<Value[]>>,
        byDefault?: ContextKeyDefault<Value, ContextUpKey<AfterEvent<[Value]>, Value>>,
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
        return afterEventOf(sources[sources.length - 1]);
      }

      // Sources absent. Attempt to detect the backup value.
      const backup = opts.byDefault(() => {

        const defaultValue = this.byDefault(opts.context, this);

        return defaultValue && afterEventOf(defaultValue);
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
 * @typeparam Seed  Value seed type.
 */
export type MultiContextUpRef<Src, Seed = unknown> = ContextUpRef<AfterEvent<Src[]>, Src, Seed>;

/**
 * Multiple updatable context values key.
 *
 * The associated value is an `AfterEvent` registrar of receivers of the source values array. It is always present,
 * even though the array can be empty.
 *
 * It is an error to provide a `null` or `undefined` {@link ContextRequest.Opts.or fallback value} when requesting
 * an associated value. Use an `afterEventOf()` result as a fallback instead.
 *
 * @typeparam Src  Source value type.
 */
export class MultiContextUpKey<Src>
    extends ContextUpKey<AfterEvent<Src[]>, Src>
    implements MultiContextUpRef<Src, AfterEvent<Src[]>> {

  /**
   * A provider of context value used when there is no value associated with this key.
   */
  readonly byDefault: ContextKeyDefault<readonly Src[], ContextUpKey<AfterEvent<Src[]>, Src>>;

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
        seedKey?: ContextSeedKey<Src | EventKeeper<Src[]>, AfterEvent<Src[]>>,
        byDefault?: ContextKeyDefault<readonly Src[], ContextUpKey<AfterEvent<Src[]>, Src>>,
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
        return afterEventOf(...sources);
      }

      // Sources absent. Attempt to detect the backup value.
      const backup = opts.byDefault(() => {

        const defaultValue = this.byDefault(opts.context, this);

        return defaultValue ? afterEventOf(...defaultValue) : afterEventOf();
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
