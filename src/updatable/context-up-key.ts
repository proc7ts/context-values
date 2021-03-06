import {
  afterEach,
  AfterEvent,
  afterThe,
  digAfter_,
  EventKeeper,
  isAfterEvent,
  supplyAfter,
  trackValue,
  translateAfter,
  ValueTracker,
} from '@proc7ts/fun-events';
import { itsElements, mapIt, overElementsOf, overIterator } from '@proc7ts/push-iterator';
import { Supply } from '@proc7ts/supply';
import type { ContextRef } from '../context-ref';
import type { ContextValues } from '../context-values';
import { ContextSupply } from '../conventional';
import type { ContextSeeder, ContextValueSlot } from '../key';
import { ContextKey, ContextKey__symbol, ContextSeedKey } from '../key';
import type { ContextValueProvider } from '../registry';

/**
 * @internal
 */
const flatUpSources: <TSrc>(this: void, input: AfterEvent<TSrc[][]>) => AfterEvent<TSrc[]> = (
    /*#__PURE__*/ translateAfter((send, ...sources) => send(...itsElements(overElementsOf(...sources))))
);

/**
 * @internal
 */
class ContextUpSeeder<TCtx extends ContextValues, TSrc>
    implements ContextSeeder<TCtx, ContextUpKey.Source<TSrc>, AfterEvent<TSrc[]>> {

  private readonly _providers = trackValue<[Map<Supply, ContextValueProvider<ContextUpKey.Source<TSrc>, TCtx>>]>(
      [new Map()],
  );

  provide(provider: ContextValueProvider<ContextUpKey.Source<TSrc>, TCtx>): Supply {

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
    providersTracker: ValueTracker<[Map<Supply, ContextValueProvider<ContextUpKey.Source<TSrc>, TCtx>>]>,
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
function toUpSrcKeeper<TSrc>(src: null | undefined | ContextUpKey.Source<TSrc>): AfterEvent<TSrc[]> {
  return isAfterEvent(src)
      ? src
      : (src != null ? afterThe(src) : afterThe());
}

/**
 * @internal
 */
class ContextSeed$UpKey<TSrc>
    extends ContextSeedKey<ContextUpKey.Source<TSrc>, AfterEvent<TSrc[]>>
    implements ContextUpKey.SeedKey<TSrc> {

  get upKey(): this {
    return this;
  }

  seeder<TCtx extends ContextValues>(): ContextSeeder<TCtx, ContextUpKey.Source<TSrc>, AfterEvent<TSrc[]>> {
    return new ContextUpSeeder();
  }

}

/**
 * Updatable context value reference.
 *
 * @typeParam TValue - Context value type.
 * @typeParam TSrc - Source value type.
 */
export interface ContextUpRef<TValue, TSrc> extends ContextRef<TValue, ContextUpKey.Source<TSrc>> {

  readonly [ContextKey__symbol]: ContextUpKey<TValue, TSrc>;

}

/**
 * @internal
 */
class ContextUpKey$UpKey<TUpdate extends any[], TSrc>
    extends ContextKey<AfterEvent<TUpdate>, ContextUpKey.Source<TSrc>, AfterEvent<TSrc[]>>
    implements ContextUpKey.SimpleUpKey<TUpdate, TSrc> {

  readonly grow: (
      slot: ContextValueSlot<
          AfterEvent<TUpdate>,
          ContextUpKey.Source<TSrc>,
          AfterEvent<TSrc[]>>,
  ) => void;

  get seedKey(): ContextSeedKey<ContextUpKey.Source<TSrc>, AfterEvent<TSrc[]>> {
    return this._key.seedKey;
  }

  get upKey(): this {
    return this;
  }

  constructor(
      private readonly _key: ContextUpKey<unknown, TSrc>,
      grow: (
          slot: ContextValueSlot<
              AfterEvent<TUpdate>,
              ContextUpKey.Source<TSrc>,
              AfterEvent<TSrc[]>>,
      ) => void,
  ) {
    super(_key.name + ':up');
    this.grow = slot => {

      const value: AfterEvent<TUpdate> | null | undefined = slot.fillBy(grow);

      if (value != null) {
        slot.insert(value.do(
            supplyAfter(slot.context.get(ContextSupply)),
        ));
      }
    };
  }

}

/**
 * Abstract implementation of updatable context value key.
 *
 * Accepts a {@link ContextUpKey.Source} instances as source values.
 *
 * Collects value sources into `AfterEvent` keeper of source values.
 *
 * @typeParam TValue - Context value type.
 * @typeParam TSrc - Source value type.
 */
export abstract class ContextUpKey<TValue, TSrc>
    extends ContextKey<TValue, ContextUpKey.Source<TSrc>, AfterEvent<TSrc[]>>
    implements ContextUpRef<TValue, TSrc>, ContextUpKey.Base<TValue, TSrc> {

  readonly seedKey: ContextUpKey.SeedKey<TSrc>;

  /**
   * A key of context value containing an {@link ContextUpKey.Up updates keeper} of this key value.
   *
   * It is expected to report any updates to this key's value.
   *
   * The value of updates key is constructed by {@link grow} function out of the same seed.
   */
  abstract readonly upKey: ContextUpKey.UpKey<TValue, TSrc>;

  /**
   * Constructs simple context value key.
   *
   * @param name - Human-readable key name.
   * @param seedKey - Value seed key. A new one will be constructed when omitted.
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
    this.seedKey = seedKey || new ContextSeed$UpKey<TSrc>(this);
  }

  /**
   * Creates a key of context value containing an `AfterEvent` keeper of updates to the value of this key.
   *
   * @typeParam TUpdate - Context value update type.
   * @param grow - A function that grows an updates keeper of context value out of its seed.
   *
   * @returns New updates keeper key.
   */
  protected createUpKey<TUpdate extends any[]>(
      grow: (
          slot: ContextValueSlot<
              AfterEvent<TUpdate>,
              ContextUpKey.Source<TSrc>,
              AfterEvent<TSrc[]>>,
      ) => void,
  ): ContextUpKey.SimpleUpKey<TUpdate, TSrc> {
    return new ContextUpKey$UpKey(this, grow);
  }

}

export namespace ContextUpKey {

  /**
   * A source value accepted by {@link ContextUpKey updatable context key}.
   *
   * Either a single source value, or an `AfterEvent` keeper of source values.
   *
   * @typeParam TSrc - Source value type.
   */
  export type Source<TSrc> = TSrc | AfterEvent<TSrc[]>;

  /**
   * A type of context value updates tracker.
   *
   * It is the same as a type of original value if the value itself is an event keeper, or an `AfterEvent` keeper
   * of original value otherwise.
   *
   * @typeParam TValue - Original context value type.
   */
  export type Up<TValue> = TValue extends EventKeeper<any> ? TValue : AfterEvent<[TValue]>;

  /**
   * Base interface of updatable context value key.
   *
   * @typeParam TValue - Context value type.
   * @typeParam TSrc - Source value type.
   */
  export interface Base<TValue, TSrc> extends ContextKey<TValue, ContextUpKey.Source<TSrc>> {

    /**
     * A key of context value containing an {@link ContextUpKey.Up updatable value tracker}.
     *
     * It is expected to report any updates to this key's value.
     *
     * The value of updates key is constructed by {@link grow} function out of the same seed.
     */
    readonly upKey: UpKey<TValue, TSrc>;

  }

  /**
   * A key of context value containing an {@link ContextUpKey.Up updatable value tracker}.
   *
   * @typeParam TValue - Context value type.
   * @typeParam TSrc - Source value type.
   */
  export interface UpKey<TValue, TSrc> extends ContextKey<ContextUpKey.Up<TValue>, ContextUpKey.Source<TSrc>> {

    /**
     * A reference to this key.
     *
     * Indicates that this key is updatable too.
     */
    readonly upKey: this;

  }

  /**
   * A key of context value containing an `AfterEvent` keeper of updates of {@link ContextUpKey updatable value}.
   *
   * @typeParam TUpdate - Context value update type.
   * @typeParam TSrc - Source value type.
   */
  export interface SimpleUpKey<TUpdate extends any[], TSrc> extends Base<AfterEvent<TUpdate>, TSrc> {

    readonly upKey: this;

  }

  /**
   * Updatable context value seed key.
   *
   * @typeParam TSrc - Source value type.
   */
  export interface SeedKey<TSrc> extends ContextSeedKey<ContextUpKey.Source<TSrc>, AfterEvent<TSrc[]>> {

    /**
     * A key of context value containing an {@link Up updates keeper} of the seed. Always equal to this key.
     */
    readonly upKey: this;

  }

}
