/**
 * @packageDocumentation
 * @module @proc7ts/context-values/updatable
 */
import { CallChain, nextArgs, NextCall } from '@proc7ts/call-thru';
import {
  afterEach,
  AfterEvent,
  afterSupplied,
  afterThe,
  EventKeeper,
  isEventKeeper,
  nextAfterEvent,
  trackValue,
  ValueTracker,
} from '@proc7ts/fun-events';
import { mapIt, overArray, overElementsOf } from '@proc7ts/push-iterator';
import { ContextKey, ContextKey__symbol, ContextSeedKey, ContextValueSlot } from '../context-key';
import { ContextRef } from '../context-ref';
import { ContextSeeder } from '../context-seeder';
import { ContextValueProvider } from '../context-value-spec';
import { ContextValues } from '../context-values';
import { ContextSupply } from './context-supply';

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
    ).keepThru(
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
  return providersTracker.read().keepThru(
      providers => !providers.length
          ? nextArgs()
          : nextAfterEvent(
              afterEach(
                  ...mapIt(
                      mapIt(
                          overArray(providers),
                          prov => prov(context),
                      ),
                      toUpSrcKeeper,
                  ),
              ),
          ),
      flatUpSources,
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
  return (typeof src === 'object' || typeof src === 'function') && isEventKeeper(src as object);
}

/**
 * @internal
 */
function flatUpSources<Src>(...sources: Src[][]): NextCall<CallChain, Src[]> {
  return nextArgs(...overElementsOf(...sources));
}

/**
 * @internal
 */
class ContextSeedUpKey<Src>
    extends ContextSeedKey<Src | EventKeeper<Src[]>, AfterEvent<Src[]>>
    implements ContextUpKey.SeedKey<Src> {

  get upKey(): this {
    return this;
  }

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

  readonly grow: (
      slot: ContextValueSlot<ContextUpKey.Up<Value>, EventKeeper<Src[]> | Src, AfterEvent<Src[]>>,
  ) => void;

  get seedKey(): ContextSeedKey<Src | EventKeeper<Src[]>, AfterEvent<Src[]>> {
    return this._key.seedKey;
  }

  constructor(
      private readonly _key: ContextUpKey<Value, Src>,
      grow: (
          slot: ContextValueSlot<ContextUpKey.Up<Value>, EventKeeper<Src[]> | Src, AfterEvent<Src[]>>,
      ) => void,
  ) {
    super(_key.name + ':up');
    this.grow = slot => {

      const value = slot.fillBy(grow);

      if (value) {

        const supply = slot.context.get(ContextSupply, { or: null });

        if (supply) {
          slot.insert(value.tillOff(supply) as ContextUpKey.Up<Value>);
        }
      }
    };
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

  readonly seedKey: ContextUpKey.SeedKey<Src>;

  /**
   * A key of context value containing an {@link ContextUpKey.Up updates keeper} of this key value.
   *
   * It is expected to report any updates to this key's value.
   *
   * The value of updates key is constructed by [[grow]] function out of the same seed.
   */
  abstract readonly upKey: ContextUpKey.UpKey<Value, Src>;

  /**
   * Constructs simple context value key.
   *
   * @param name  Human-readable key name.
   * @param seedKey  Value seed key. A new one will be constructed when omitted.
   */
  constructor(
      name: string,
      {
        seedKey,
      }: {
        seedKey?: ContextUpKey.SeedKey<Src>;
      } = {},
  ) {
    super(name);
    this.seedKey = seedKey || new ContextSeedUpKey<Src>(this);
  }

  /**
   * A key of context value containing an {@link ContextUpKey.Up updates keeper} of the value of this key.
   *
   * @param grow  A function that grows an updates keeper of context value out of its seed.
   *
   * @returns New updates keeper key.
   */
  protected createUpKey(
      grow: (
          slot: ContextValueSlot<ContextUpKey.Up<Value>, EventKeeper<Src[]> | Src, AfterEvent<Src[]>>,
      ) => void,
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

  /**
   * Updatable context value seed key.
   *
   * @typeparam Src  Source value type.
   */
  export interface SeedKey<Src> extends ContextSeedKey<Src | EventKeeper<Src[]>, AfterEvent<Src[]>> {

    /**
     * A key of context value containing an {@link Up updates keeper} of the seed. Always equal to this key.
     */
    readonly upKey: this;

  }

}
