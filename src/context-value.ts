import { AIterable, itsLast } from 'a-iterable';
import { ContextValueProvider } from './context-value-provider';
import { ContextValues } from './context-values';

/**
 * Context value sources.
 *
 * This is an iterable of source values that are passed to `ContextKey.merge()` method in order to construct
 * a context value.
 *
 * @param <S> A type of source values.
 */
export type ContextSources<S> = AIterable<S>;

/**
 * A request for context value.
 *
 * This is passed to `ContextValues.get()` methods in order to obtain a context value.
 *
 * This is typically a context value key. But may also be any object with `key` property containing such key.
 *
 * @param <V> A type of requested context value.
 */
export interface ContextRequest<V> {

  /**
   * A key of context value to request.
   */
  readonly key: ContextKey<V, any>;

}

export namespace ContextRequest {

  /**
   * Context request options.
   *
   * This can be passed to `ContextValues.get()` method as a second parameter.
   *
   * @param <V> A type of requested context value.
   */
  export interface Opts<V> {

    /**
     * The default value to return if there is no value associated with the given key. Can be `null` or `undefined` too.
     */
    or?: V | null;

  }

  export interface OrDefault<V> extends Opts<V> {
    or: V;
  }

  export interface OrNull<V> extends Opts<V> {
    or: null;
  }

  export interface OrUndefined<V> extends Opts<V> {
    or?: undefined;
  }

}

/**
 * Context value definition target.
 *
 * Designates a declared declaring context value.
 *
 * @param <S> A type of declared context value sources.
 */
export interface ContextTarget<S> extends ContextRequest<any> {

  /**
   * A key of context value to provide.
   */
  readonly key: ContextKey<any, S>;

}

/**
 * Context value key.
 *
 * Every key should be an unique instance of this class.
 *
 * Multiple source values can be provided internally per value key. Then they are merged with `ContextKey.merge()`
 * method into single context value.
 *
 * @param <V> A type of associated value.
 * @param <S> A type of source values.
 */
export abstract class ContextKey<V, S = V> implements ContextRequest<V>, ContextTarget<S> {

  /**
   * Human-readable key name.
   *
   * This is not necessarily unique.
   */
  readonly name: string;

  /**
   * A key of context value holding the sources of the value associated with this key.
   *
   * When multiple context value keys have the same `sourceKey`, then their values are constructed against the same
   * set of sources.
   */
  abstract readonly sourcesKey: ContextSourcesKey<S>;

  /**
   * Constructs context value key.
   *
   * @param name Human-readable key name.
   */
  protected constructor(name: string) {
    this.name = name;
  }

  /**
   * Always the key itself.
   *
   * This is to use context value keys both as context value requests and definitions of provided context values.
   */
  get key(): this {
    return this;
  }

  /**
   * Merges multiple source values into one context value.
   *
   * @param context Context values.
   * @param sources A sources of context value.
   * @param handleDefault Default value handler. The default values should be passed through it.
   *
   * @returns Single context value, or `undefined` if there is no default value.
   */
  abstract merge(
      context: ContextValues,
      sources: ContextSources<S>,
      handleDefault: ContextValueDefaultHandler<V>): V | null | undefined;

  toString(): string {
    return `ContextKey(${this.name})`;
  }

}

/**
 * Default context value handler.
 *
 * It is called from `ContextKey.merge()` operation to handle default values.
 *
 * It is responsible for default value selection. As explicitly specified default value should always take precedence
 * over the one specified in the value key.
 *
 * @param <V> A type of context value key.
 * @param defaultProvider Default value provider. It is called only when the default value is not provided explicitly.
 * If it returns a non-null/non-undefined value, then it will be associated with context key.
 *
 * @return Default value to return.
 *
 * @throws Error If there is no explicitly specified default value, and `defaultProvider` did not provide any value.
 */
export type ContextValueDefaultHandler<V> = (defaultProvider: () => V | null | undefined) => V | null | undefined;

/**
 * A key of context value holding sources for some other context value.
 *
 * An instance of this class is used as `ContextKey.sourcesKey` value by default.
 */
export class ContextSourcesKey<S> extends ContextKey<ContextSources<S>, S> {

  /**
   * Constructs context value sources key.
   *
   * @param key A key of context value having its sources associated with this key.
   */
  constructor(key: ContextKey<any, S>) {
    super(`${key.name}:sources`);
  }

  /**
   * Always refers to itself.
   */
  get sourcesKey(): this {
     return this;
  }

  merge(context: ContextValues, sources: ContextSources<S>): ContextSources<S> {
    return sources;
  }

}

/**
 * Abstract context value key.
 */
export abstract class AbstractContextKey<V, S = V> extends ContextKey<V, S> {

  readonly sourcesKey: ContextSourcesKey<S>;

  /**
   * Constructs context value key.
   *
   * @param name Human-readable key name.
   * @param sourcesKey A key of context value holding the sources of the value associated with this key. An instance
   * of `ContextSourcesKey` will be constructed by default.
   */
  protected constructor(name: string, sourcesKey?: ContextSourcesKey<S>) {
    super(name);
    this.sourcesKey = sourcesKey || new ContextSourcesKey(this);
  }

}

/**
 * Single context value key.
 *
 * Treats the last source value as context one and ignores the rest of them.
 *
 * @param <V> The type of associated value.
 * @param <S> The type of source values.
 */
export class SingleContextKey<V> extends AbstractContextKey<V> {

  /**
   * A provider of context value used when there is no value associated with this key.
   *
   * If `undefined`, then there is no default value.
   */
  readonly defaultProvider: (context: ContextValues) => V | null | undefined;

  /**
   * Constructs single context value key.
   *
   * @param name Human-readable key name.
   * @param defaultProvider Optional default value provider. If unspecified or `undefined` the key has no default value.
   */
  constructor(name: string, defaultProvider: (context: ContextValues) => V | null | undefined = () => undefined) {
    super(name);
    this.defaultProvider = defaultProvider;
  }

  merge(
      context: ContextValues,
      sources: ContextSources<V>,
      handleDefault: ContextValueDefaultHandler<V>): V | null | undefined {

    const value = itsLast(sources);

    if (value != null) {
      return value;
    }

    return handleDefault(() => this.defaultProvider(context));
  }

}

/**
 * Multiple context values key.
 *
 * Represents context value as array of source values.
 *
 * Associated with empty array by default.
 *
 * @param <V> The type of associated value.
 * @param <S> The type of source values.
 */
export class MultiContextKey<V> extends AbstractContextKey<V[], V> {

  /**
   * A provider of context value used when there is no value associated with this key.
   */
  readonly defaultProvider: ContextValueProvider<ContextValues, V[]>;

  /**
   * Constructs multiple context values key.
   *
   * @param name Human-readable key name.
   * @param defaultProvider Optional default value provider. If unspecified then the default value is empty array.
   */
  constructor(name: string, defaultProvider: ContextValueProvider<ContextValues, V[]> = () => []) {
    super(name);
    this.defaultProvider = defaultProvider;
  }

  merge(
      context: ContextValues,
      sources: ContextSources<V>,
      handleDefault: ContextValueDefaultHandler<V[]>): V[] | null | undefined {

    const result = [...sources];

    if (result.length) {
      return result;
    }

    return handleDefault(() => {

      const defaultSources = this.defaultProvider(context);

      if (defaultSources) {
        return [...defaultSources];
      }

      return;
    });
  }

}
