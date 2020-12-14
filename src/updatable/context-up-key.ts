/**
 * @packageDocumentation
 * @module @proc7ts/context-values/updatable
 */
import {
  afterEach,
  AfterEvent,
  afterSupplied,
  afterThe,
  digAfter_,
  EventKeeper,
  isEventKeeper,
  letInEvents,
  trackValue,
  translateAfter,
  ValueTracker,
} from '@proc7ts/fun-events';
import { Supply } from '@proc7ts/primitives';
import { itsElements, mapIt, overElementsOf, overIterator } from '@proc7ts/push-iterator';
import { ContextKey, ContextKey__symbol, ContextSeedKey, ContextValueSlot } from '../context-key';
import type { ContextRef } from '../context-ref';
import type { ContextSeeder } from '../context-seeder';
import type { ContextValueProvider } from '../context-value-spec';
import type { ContextValues } from '../context-values';
import { ContextSupply } from './context-supply';

/**
 * @internal
 */
const flatUpSources: <TSrc>(this: void, input: AfterEvent<TSrc[][]>) => AfterEvent<TSrc[]> = translateAfter(
    (send, ...sources) => send(...itsElements(overElementsOf(...sources))),
);

/**
 * @internal
 */
class ContextUpSeeder<TCtx extends ContextValues, TSrc>
    implements ContextSeeder<TCtx, TSrc | EventKeeper<TSrc[]>, AfterEvent<TSrc[]>> {

  private readonly _providers = trackValue<[Map<Supply, ContextValueProvider<TCtx, TSrc | EventKeeper<TSrc[]>>>]>(
      [new Map()],
  );

  provide(provider: ContextValueProvider<TCtx, TSrc | EventKeeper<TSrc[]>>): Supply {

    const [providers] = this._providers.it;
    const supply = new Supply();

    providers.set(supply, provider);
    this._providers.it = [providers];

    return supply.whenOff(() => {

      const [providers] = this._providers.it;

      providers.delete(supply);

      this._providers.it = [providers];
    });
  }

  seed(context: TCtx, initial: AfterEvent<TSrc[]> = afterThe<TSrc[]>()): AfterEvent<TSrc[]> {
    return this.combine(initial, upSrcKeepers(context, this._providers));
  }

  isEmpty(): boolean {
    return false;
  }

  combine(first: AfterEvent<TSrc[]>, second: AfterEvent<TSrc[]>): AfterEvent<TSrc[]> {
    return afterEach(first, second).do(flatUpSources);
  }

}

/**
 * @internal
 */
function upSrcKeepers<TCtx extends ContextValues, TSrc>(
    context: TCtx,
    providersTracker: ValueTracker<[Map<Supply, ContextValueProvider<TCtx, TSrc | EventKeeper<TSrc[]>>>]>,
): AfterEvent<TSrc[]> {
  return providersTracker.read.do(
      digAfter_(
          ([providers]): AfterEvent<TSrc[][]> => !providers.size
              ? afterThe()
              : afterEach(
                  ...mapIt(
                      mapIt(
                          overIterator(() => providers.values()),
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
function toUpSrcKeeper<TSrc>(src: null | undefined | TSrc | EventKeeper<TSrc[]>): AfterEvent<TSrc[]> {
  return src == null ? afterThe() : isUpSrcKeeper(src) ? afterSupplied(src) : afterThe(src);
}

/**
 * @internal
 */
function isUpSrcKeeper<TSrc>(src: TSrc | EventKeeper<TSrc[]>): src is EventKeeper<TSrc[]> {
  return (typeof src === 'object' || typeof src === 'function') && isEventKeeper(src as object);
}

/**
 * @internal
 */
class ContextSeedUpKey<TSrc>
    extends ContextSeedKey<TSrc | EventKeeper<TSrc[]>, AfterEvent<TSrc[]>>
    implements ContextUpKey.SeedKey<TSrc> {

  get upKey(): this {
    return this;
  }

  seeder<TCtx extends ContextValues>(): ContextSeeder<TCtx, TSrc | EventKeeper<TSrc[]>, AfterEvent<TSrc[]>> {
    return new ContextUpSeeder();
  }

}

/**
 * Updatable context value reference.
 *
 * @typeParam TValue  Context value type.
 * @typeParam TSrc  Source value type.
 */
export interface ContextUpRef<TValue, TSrc> extends ContextRef<TValue, TSrc | EventKeeper<TSrc[]>> {

  readonly [ContextKey__symbol]: ContextUpKey<TValue, TSrc>;

}

/**
 * @internal
 */
class ContextUpKeyUpKey<TValue, TSrc>
    extends ContextKey<ContextUpKey.Up<TValue>, TSrc | EventKeeper<TSrc[]>, AfterEvent<TSrc[]>> {

  readonly grow: (
      slot: ContextValueSlot<ContextUpKey.Up<TValue>, EventKeeper<TSrc[]> | TSrc, AfterEvent<TSrc[]>>,
  ) => void;

  get seedKey(): ContextSeedKey<TSrc | EventKeeper<TSrc[]>, AfterEvent<TSrc[]>> {
    return this._key.seedKey;
  }

  constructor(
      private readonly _key: ContextUpKey<TValue, TSrc>,
      grow: (
          slot: ContextValueSlot<ContextUpKey.Up<TValue>, EventKeeper<TSrc[]> | TSrc, AfterEvent<TSrc[]>>,
      ) => void,
  ) {
    super(_key.name + ':up');
    this.grow = slot => {

      const value: AfterEvent<[TValue]> | null | undefined = slot.fillBy(grow);

      if (value) {

        const supply = slot.context.get(ContextSupply, { or: null });

        if (supply) {
          slot.insert(value.do(letInEvents(supply)) as ContextUpKey.Up<TValue>);
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
 * @typeParam TValue  Context value type.
 * @typeParam TSrc  Source value type.
 */
export abstract class ContextUpKey<TValue, TSrc>
    extends ContextKey<TValue, TSrc | EventKeeper<TSrc[]>, AfterEvent<TSrc[]>>
    implements ContextUpRef<TValue, TSrc> {

  readonly seedKey: ContextUpKey.SeedKey<TSrc>;

  /**
   * A key of context value containing an {@link ContextUpKey.Up updates keeper} of this key value.
   *
   * It is expected to report any updates to this key's value.
   *
   * The value of updates key is constructed by [[grow]] function out of the same seed.
   */
  abstract readonly upKey: ContextUpKey.UpKey<TValue, TSrc>;

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
        seedKey?: ContextUpKey.SeedKey<TSrc>;
      } = {},
  ) {
    super(name);
    this.seedKey = seedKey || new ContextSeedUpKey<TSrc>(this);
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
          slot: ContextValueSlot<ContextUpKey.Up<TValue>, EventKeeper<TSrc[]> | TSrc, AfterEvent<TSrc[]>>,
      ) => void,
  ): ContextUpKey.UpKey<TValue, TSrc> {
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
   * @typeParam TValue  Original context value type.
   */
  export type Up<TValue> = TValue extends AfterEvent<any>
      ? TValue
      : (TValue extends EventKeeper<infer E>
          ? AfterEvent<E>
          : AfterEvent<[TValue]>);

  /**
   * A key of context value containing an {@link ContextUpKey.Up updates keeper} of this key value.
   *
   * @typeParam TValue  Context value type.
   * @typeParam TSrc  Source value type.
   */
  export type UpKey<TValue, TSrc> = ContextKey<ContextUpKey.Up<TValue>, TSrc>;

  /**
   * Updatable context value seed key.
   *
   * @typeParam TSrc  Source value type.
   */
  export interface SeedKey<TSrc> extends ContextSeedKey<TSrc | EventKeeper<TSrc[]>, AfterEvent<TSrc[]>> {

    /**
     * A key of context value containing an {@link Up updates keeper} of the seed. Always equal to this key.
     */
    readonly upKey: this;

  }

}
