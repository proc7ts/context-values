import { AIterable } from 'a-iterable';
import {
  ContextKey,
  ContextRequest,
  ContextSources,
  ContextSourcesKey,
  ContextTarget,
  DefaultContextValueHandler,
} from './context-value';
import {
  ContextSourcesProvider,
  ContextValueProvider,
  contextValueSpec,
  ContextValueSpec
} from './context-value-provider';
import { ContextValues } from './context-values';

/**
 * A registry of context value providers.
 *
 * @param <C> A type of context.
 */
export class ContextRegistry<C extends ContextValues = ContextValues> {

  /** @internal */
  private readonly _initial: ContextSourcesProvider<C>;

  /** @internal */
  private readonly _providers = new Map<ContextSourcesKey<any>, ContextValueProvider<C, any>[]>();

  /** @internal */
  private _nonCachedValues?: ContextValues;

  /**
   * Constructs a registry for context value providers.
   *
   * It can be chained with another registry by providing an initially known source of known context values.
   *
   * @param initial An optional source of initially known context values. This can be either a function, or
   * `ContextValues` instance.
   */
  constructor(initial?: ContextSourcesProvider<C> | ContextValues) {
    if (initial == null) {
      this._initial = noContextSources;
    } else if (typeof initial === 'function') {
      this._initial = initial;
    } else {
      this._initial = <S>({ key }: ContextRequest<S>) => initial.get(key.sourcesKey);
    }
  }

  /**
   * Defines a context value.
   *
   * @param <D> A type of dependencies.
   * @param <S> A type of context value sources.
   * @param spec Context value specifier.
   */
  provide<D extends any[], S>(spec: ContextValueSpec<C, any, D, S>): void {

    const { a: { key: { sourcesKey } }, by } = contextValueSpec(spec);
    let providers: ContextValueProvider<C, S>[] | undefined = this._providers.get(sourcesKey);

    if (providers == null) {
      providers = [by];
      this._providers.set(sourcesKey, providers);
    } else {
      providers.push(by);
    }

    this._providers.set(sourcesKey, providers);
  }

  /**
   * Returns the value sources provided for the given key.
   *
   * @param context Context to provide value for.
   * @param request Context value sources request.
   *
   * @returns A revertible iterable of the value sources associated with the given key.
   */
  sources<S>(context: C, request: ContextTarget<S>): ContextSources<S> {
    return this.bindSources(context, false)(request);
  }

  /**
   * Binds value sources to the given context.
   *
   * @param context Target value context.
   * @param cache Whether to cache context values. When `false` the value providers may be called multiple times.
   *
   * @returns A provider of context value sources bound to the given context.
   */
  bindSources(context: C, cache?: boolean): <V, S>(request: ContextTarget<S>) => ContextSources<S> {

    const values = this.newValues(cache);

    return <S>({ key }: ContextTarget<S>) => values.get.call(context, key.sourcesKey) as ContextSources<S>;
  }

  /**
   * Creates new context values instance consulting this registry for value providers.
   *
   * @param cache Whether to cache context values. When `false` the value providers may be called multiple times.
   *
   * @returns New context values instance which methods expect `this` instance to be a context the values provided for.
   */
  newValues(cache = true): ContextValues & ThisType<C> {
    if (!cache && this._nonCachedValues) {
      return this._nonCachedValues;
    }

    const values = new Map<ContextKey<any>, any>();
    const registry = this;

    class Values extends ContextValues {

      get<V, S>(
          this: C,
          { key }: { key: ContextKey<V, S> },
          opts?: ContextRequest.Opts<V>): V | null | undefined {

        const context = this;
        const cached: V | undefined = values.get(key);

        if (cached != null) {
          return cached;
        }

        const sources = keySources(context, key);
        const [constructed, defaultUsed] = mergeSources(context, key, sources, opts);

        if (cache && !defaultUsed) {
          values.set(key, constructed);
        }

        return constructed;
      }

    }

    if (!cache) {
      return this._nonCachedValues = new Values();
    }

    return new Values();

    function keySources<S>(context: C, key: ContextKey<any, S>): ContextSources<S> {
      if (key.sourcesKey !== key as any) {
        // This is not a sources key
        // Retrieve the sources by sources key
        return context.get(key.sourcesKey);
      }
      // This is a sources key.
      // Find providers.
      const sourceProviders = sourcesProvidersFor(key.sourcesKey);
      const initial = registry._initial(key, context);

      return AIterable.from([
        () => initial,
        () => valueSources(context, sourceProviders),
      ]).flatMap(fn => fn());
    }

    function sourcesProvidersFor<S>(key: ContextSourcesKey<S>): AIterable<SourceProvider<C, S>> {

      const providers: ContextValueProvider<C, S>[] = registry._providers.get(key) || [];

      return AIterable.from(providers.map(toSourceProvider));
    }

    function mergeSources<V, S>(
        context: C,
        key: ContextKey<V, S>,
        sources: ContextSources<S>,
        opts: ContextRequest.Opts<V> | undefined): [V | null | undefined, boolean] {

      let defaultUsed = false;
      const handleDefault: DefaultContextValueHandler<V> = (opts && 'or' in opts)
          ? () => {
            defaultUsed = true;
            return opts.or;
          } : defaultProvider => {

            const providedDefault = defaultProvider();

            if (providedDefault == null) {
              throw new Error(`There is no value with key ${key}`);
            }

            return providedDefault;
          };

      return [key.merge(context, sources, handleDefault), defaultUsed];
    }
  }

  /**
   * Appends values provided by another value registry to the ones provided by this one.
   *
   * @param other Another context value registry.
   *
   * @return New context value registry which values provided by both registries.
   */
  append(other: ContextRegistry<C>): ContextRegistry<C> {

    const self = this;

    return new ContextRegistry<C>(<S>(target: ContextTarget<S>, context: C) => AIterable.from([
      self.sources(context, target),
      other.sources(context, target),
    ]).flatMap(s => s));
  }

}

// Context value provider and cached context value source.
type SourceProvider<C extends ContextValues, S> = [ContextValueProvider<C, S>, (S | null | undefined)?];

function toSourceProvider<C extends ContextValues, S>(valueProvider: ContextValueProvider<C, S>): SourceProvider<C, S> {
  return [valueProvider];
}

function valueSources<C extends ContextValues, S>(
    context: C,
    sourceProviders: AIterable<SourceProvider<C, S>>): AIterable<S> {
  return sourceProviders.map(sourceProvider => {
    if (sourceProvider.length > 1) {
      return sourceProvider[1];
    }

    const source = sourceProvider[0](context);

    sourceProvider.push(source);

    return source;
  }).filter<S>(isPresent);
}

function isPresent<S>(value: S | null | undefined): value is S {
  return value != null;
}

function noContextSources<S>(): ContextSources<S> {
  return AIterable.none();
}
