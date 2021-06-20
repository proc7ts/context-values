import { lazyValue, valueProvider } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { CxAsset } from './asset';
import { CxEntry } from './entry';
import { CxReferenceError } from './reference-error';
import { CxRequest } from './request';
import { CxValues } from './values';

/**
 * Context builder.
 *
 * Provides value assets for the context.
 */
export class CxBuilder<TContext extends CxValues = CxValues>
    implements CxValues.Modifier<TContext>, CxValues.Accessor {

  /**
   * @internal
   */
  private readonly _cx: () => TContext;

  /**
   * @internal
   */
  private readonly _records = new Map<CxEntry<any, any>, CxEntry$Record<any, any, TContext>>();

  /**
   * @internal
   */
  readonly _initial: CxValues.Provider;

  /**
   * Constructs context builder.
   *
   * @param createContext - Context creator function. Accepts context value getter as its only parameter and returns
   * created context.
   * @param initial - Initial context value assets provider. These assets applies before the ones provided
   * {@link provide explicitly}.
   */
  constructor(
      createContext: (this: void, getValue: CxValues.Getter) => TContext,
      initial: CxValues.Provider = CxValues$emptyProvider,
  ) {
    this._cx = lazyValue(() => createContext(
        (entry, request) => this.get(entry, request),
    ));
    this._initial = initial;
  }

  /**
   * Modified context.
   */
  get context(): TContext {
    return this._cx();
  }

  get<TValue>(entry: CxEntry<TValue, any>, request?: CxRequest.WithFallback<TValue>): TValue;

  get<TValue>(entry: CxEntry<TValue, any>, request?: CxRequest<TValue>): TValue | null;

  get<TValue>(entry: CxEntry<TValue, any>, request?: CxRequest<TValue>): TValue | null {
    return this._record(entry).get(request);
  }

  provide<TValue, TAsset = TValue>(asset: CxAsset<TValue, TAsset, TContext>): Supply {

    const { entry, supply = new Supply() } = asset;

    this._record(entry).provide(asset.read, supply);

    return supply;
  }

  readAssets<TValue, TAsset>(
      target: CxEntry.Target<TValue, TAsset>,
      receiver: CxEntry.AssetReceiver<TAsset>,
  ): void {
    this._record(target.entry).readAssets(target, receiver);
  }

  private _record<TValue, TAsset>(entry: CxEntry<TValue, TAsset>): CxEntry$Record<TValue, TAsset, TContext> {

    let record: CxEntry$Record<TValue, TAsset, TContext> | undefined = this._records.get(entry);

    if (!record) {
      this._records.set(entry, record = new CxEntry$Record(this, entry));
    }

    return record;
  }

}

class CxEntry$Record<TValue, TAsset, TContext extends CxValues> {

  private readonly providers = new Map<Supply, CxAsset.Provider<TValue, TAsset, TContext>>();
  private readonly receivers = new Map<Supply, [CxEntry.Target<TValue, TAsset>, CxEntry.AssetReceiver<TAsset>]>();

  constructor(
      private readonly builder: CxBuilder<TContext>,
      private readonly entry: CxEntry<TValue, TAsset>,
  ) {
  }

  provide(provider: CxAsset.Provider<TValue, TAsset, TContext>, supply: Supply): void {
    this.addProvider(provider, supply);
  }

  private provideToAll(provider: CxAsset.Provider<TValue, TAsset, TContext>, supply: Supply): void {
    this.addProvider(provider, supply);

    for (const [supply, [target, receiver]] of this.receivers) {
      if (!supply.isOff) {
        this.readAssetsTo(target, receiver);
      }
    }
  }

  private addProvider(
      provider: CxAsset.Provider<TValue, TAsset, TContext>,
      supply: Supply,
  ): void {
    this.providers.set(supply, provider);
    supply.whenOff(() => this.providers.delete(supply));
  }

  get({ or }: CxRequest<TValue> = {}): TValue | null {

    const definition = this.define();
    const value = definition.get?.();

    if (value != null) {
      return value;
    }
    if (or !== undefined) {
      return or;
    }

    const defaultValue = definition.getDefault?.();

    if (defaultValue != null) {
      return defaultValue;
    }

    throw new CxReferenceError(this.entry);
  }

  readAssets(
      target: CxEntry.Target<TValue, TAsset>,
      receiver: CxEntry.AssetReceiver<TAsset>,
  ): Supply {
    this.provide = this.provideToAll;
    this.readAssets = this.readAssetsTo;

    return this.readAssetsTo(target, receiver);
  }

  private readAssetsTo(
      target: CxEntry.Target<TValue, TAsset>,
      receiver: CxEntry.AssetReceiver<TAsset>,
  ): Supply {

    const assetsSupply: Supply = new Supply(() => this.receivers.delete(assetsSupply));

    this.receivers.set(assetsSupply, [target, receiver]);

    this.builder._initial(target, receiver);
    for (const [supply, provider] of this.providers) {
      (provider as CxAsset.Provider<TValue, TAsset>)(
          target,
          getAsset => receiver(getAsset, supply.needs(assetsSupply)),
      );
    }

    return assetsSupply;
  }

  private define(): CxEntry.Definition<TValue, TAsset> {

    const { entry, builder } = this;
    const { context } = builder;
    const target: CxEntry.Target<TValue, TAsset, TContext> = {
      context,
      entry,
      get: context.get.bind(context),
      provide: builder.provide.bind(builder),
    };
    const definition = this.entry.perContext(target);

    this.define = valueProvider(definition);

    definition.addPeer({
      readAssets: receiver => this.readAssets(target, receiver),
    });

    return definition;
  }

}

function CxValues$emptyProvider<TValue, TAsset>(
    _target: CxEntry.Target<TValue, TAsset>,
    _receiver: CxEntry.AssetReceiver<TAsset>,
): void {
  // No assets
}
