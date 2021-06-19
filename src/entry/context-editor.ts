import { lazyValue, valueProvider } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { ContextAsset } from './context-asset';
import { ContextEntries } from './context-entries';
import { ContextEntry } from './context-entry';
import { ContextReferenceError } from './context-reference-error';

/**
 * Context editor.
 *
 * Allows to provide entries for the edited context.
 */
export class ContextEditor<TContext extends ContextEntries = ContextEntries>
    implements ContextEntries.Editor<TContext> {

  /**
   * @internal
   */
  private readonly _cx: () => TContext;

  /**
   * @internal
   */
  private readonly _records = new Map<ContextEntry<any, any>, ContextEntry$Record<any, any, TContext>>();

  /**
   * @internal
   */
  readonly _initial: ContextEntries.Provider;

  /**
   * Constructs context editor.
   *
   * @param createContext - Context builder function. Accepts context value accessor as its only parameter and returns
   * created context.
   * @param initial - Initial context value assets provider. These assets applies before the ones provided
   * {@link provide explicitly}.
   */
  constructor(
      createContext: (this: void, getValue: ContextEntries.Accessor) => TContext,
      initial: ContextEntries.Provider = ContextEntries$emptyProvider,
  ) {
    this._cx = lazyValue(() => createContext(
        (context, entry) => this._getValue(context, entry),
    ));
    this._initial = initial;
  }

  /**
   * Edited context.
   */
  get context(): TContext {
    return this._cx();
  }

  provide<TValue, TAsset = TValue>(
      entry: ContextEntry<TValue, TAsset>,
      asset: ContextAsset<TValue, TAsset, TContext>,
  ): Supply {
    return this._record(entry).provide(asset);
  }

  provideAssets<TValue, TAsset>(
      target: ContextEntry.Target<TValue, TAsset>,
      receiver: ContextAsset.Receiver<TAsset>,
  ): void {
    this._record(target.entry).provideAssets(target, receiver);
  }

  private _record<TValue, TAsset>(entry: ContextEntry<TValue, TAsset>): ContextEntry$Record<TValue, TAsset, TContext> {

    let record: ContextEntry$Record<TValue, TAsset, TContext> | undefined = this._records.get(entry);

    if (!record) {
      this._records.set(entry, record = new ContextEntry$Record(this, entry));
    }

    return record;
  }

  private _getValue<TValue>(
      entry: ContextEntry<TValue, any>,
      request?: ContextEntry.Request<TValue>,
  ): TValue | null {
    return this._record(entry).get(request);
  }

}

class ContextEntry$Record<TValue, TAsset, TContext extends ContextEntries> {

  private readonly providers = new Map<Supply, ContextAsset.Provider<TValue, TAsset, TContext>>();
  private readonly receivers = new Map<ContextEntry.Target<TValue, TAsset>, ContextAsset.Receiver<TAsset>>();

  constructor(
      private readonly editor: ContextEditor<TContext>,
      private readonly entry: ContextEntry<TValue, TAsset>,
  ) {
  }

  provide(provider: ContextAsset.Provider<TValue, TAsset, TContext>): Supply {
    return this.addProvider(provider);
  }

  private provideToAll(provider: ContextAsset.Provider<TValue, TAsset, TContext>): Supply {

    const supply = this.addProvider(provider);

    for (const [target, receiver] of this.receivers) {
      this.provideAssetsTo(target, receiver);
    }

    return supply;
  }

  private addProvider(provider: ContextAsset.Provider<TValue, TAsset, TContext>): Supply {

    const supply: Supply = new Supply(() => this.providers.delete(supply));

    this.providers.set(supply, provider);

    return supply;
  }

  get({ or }: ContextEntry.Request<TValue> = {}): TValue | null {

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

    throw new ContextReferenceError(this.entry);
  }

  provideAssets(
      target: ContextEntry.Target<TValue, TAsset>,
      receiver: ContextAsset.Receiver<TAsset>,
  ): void {
    this.provide = this.provideToAll;
    this.provideAssets = this.provideAssetsTo;
    this.provideAssetsTo(target, receiver);
  }

  private provideAssetsTo(
      target: ContextEntry.Target<TValue, TAsset>,
      receiver: ContextAsset.Receiver<TAsset>,
  ): void {

    const prevReceiver = this.receivers.get(target);

    this.receivers.set(
        target,
        prevReceiver
            ? (asset, supply) => {
              receiver(asset, supply);
              prevReceiver(asset, supply);
            }
            : receiver,
    );

    this.editor._initial(target, receiver);
    for (const [providerSupply, provider] of this.providers) {
      (provider as ContextAsset.Provider<TValue, TAsset>)(
          target,
          (asset, supply) => receiver(asset, supply.needs(providerSupply)),
      );
    }
  }

  private define(): ContextEntry.Definition<TValue, TAsset> {

    const { entry, editor } = this;
    const { context } = editor;
    const target: ContextEntry.Target<TValue, TAsset, TContext> = {
      context,
      entry,
      get: context.get.bind(context),
      provide: editor.provide.bind(editor),
    };
    const definition = this.entry.perContext(target);

    this.define = valueProvider(definition);

    definition.addPeer({
      provideAssets: (receiver: ContextAsset.Receiver<TAsset>) => {
        this.provideAssets(target, receiver);
      },
    });

    return definition;
  }

}

function ContextEntries$emptyProvider<TValue, TAsset>(
    _target: ContextEntry.Target<TValue, TAsset>,
    _receiver: ContextAsset.Receiver<TAsset>,
): void {
  // No assets
}
