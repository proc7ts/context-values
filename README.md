IoC Context Values Provider
===========================

[![NPM][npm-image]][npm-url]
[![CircleCI][ci-image]][ci-url]
[![codecov][codecov-image]][codecov-url]
[![GitHub Project][github-image]][github-url]
[![API Documentation][api-docs-image]][api-docs-url]

This library allows to construct an [IoC] context, other components can request values from.

An [IoC] context is an object with `get()` method implemented. This method returns a context value by its key.

[npm-image]: https://img.shields.io/npm/v/context-values.svg?logo=npm
[npm-url]: https://www.npmjs.com/package/context-values
[ci-image]: https://img.shields.io/circleci/build/github/surol/context-values?logo=circleci
[ci-url]: https://img.shields.io/codecov/c/github/surol/context-values?logo=codecov
[codecov-image]: https://codecov.io/gh/surol/context-values/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/surol/context-values
[github-image]: https://img.shields.io/static/v1?logo=github&label=GitHub&message=project&color=informational
[github-url]: https://github.com/surol/context-values
[api-docs-image]: https://img.shields.io/static/v1?logo=typescript&label=API&message=docs&color=informational
[api-docs-url]: https://surol.github.io/context-values/
[IoC]: https://en.wikipedia.org/wiki/Inversion_of_control


Accessing Context Values
------------------------

A context should implement a `ContextValues` interface. This interface declares a `get()` method accepting a
`ContextRequest` identifying the requested value (e.g. a `ContextKey` instance), and a non-mandatory options.

The following code returns a string value associated with `key`, or throws an exception if the value not found.
```typescript
import { SingleContextKey } from 'context-values';

const key = new SingleContextKey<string>('my-key');

myContext.get(key)
```

### Fallback Value

Normally, if the value associated with the given key can not be found, an exception is thrown. To avoid this, a fallback
value can be provided. It will be returned if the value not found.
```typescript
import { SingleContextKey } from 'context-values';

const key = new SingleContextKey<string>('my-key');

myContext.get(key, { or: 'empty' });
```


### Context Value Request

The `get()` method accepts not only a `ContextKey` instance, but arbitrary `ContextRequest`. The latter is just an
object with `key` property containing a `ContextKey` instance to find.

This can be handy e.g. when requesting an instance of some known type:
```typescript
import { ContextKey, SingleContextKey } from 'context-values';

class MyService {
  
  // MyService class (not instance) implements a `ContextRequest`
  static readonly key: ContextKey<MyService> = new SingleContextKey('my-service');
  
}

myContext.get(MyService); // No need to specify `MyService.key` here
myContext.get(MyService.key); // The same as above.
```


Providing Context Values
------------------------

Context values can be provided using `ContextRegistry`.
Then the values can be requested from `ContextValues` instance constructed by the `newValues()` method of the registry. 

```typescript
import { ContextRegistry, SingleContextKey } from 'context-values';

const key1 = new SingleContextKey<string>('key1');
const key2 = new SingleContextKey<number>('key2');

const registry = new ContextRegistry();

registry.provide({ a: key1, is: 'string' });
registry.provide({ a: key2, by: ctx => ctx.get(key1).length })

const context = registry.newValues();

context.get(key1); // 'string'
context.get(key2); // 6
```


### Context Value Target

[Context Value Target]: #context-value-target

The `provide()` method accepts not only a `ContextKey` instance, but arbitrary `ContextTarget`. The latter is just an
object with `key` property containing a `ContextKey` to provide.


This can be handy e.g. when providing an instance of some known type:
```typescript
import { ContextKey, ContextRegistry, SingleContextKey } from 'context-values';

class MyService {
  
  // MyService class (not instance) implements a `ContextRequest`
  static readonly key: ContextKey<MyService> = new SingleContextKey('my-service');
  
}

const registry = new ContextRegistry();

registry.provide({ a: MyService, is: new MyService() });

const context = registry.newValues();

context.get(MyService); // No need to specify `MyService.key` here
```


### Context Value Specifier

The `provide()` method of `ContextRegistry` accepts a _context value specifier_ as its only parameter.

This specifier defines a value (or, more precisely, the [value sources]). It may specify the value in a different ways:

- `registry.provide({ a: key, is: value })` - provides the value explicitly.
- `registry.provide({ a: key, by: ctx => calculateValue(ctx) })` - evaluates the value in most generic way. `ctx` here
  is the target context.
- `registry.provide({ a: key, by: (a, b) => calculateValue(a, b), with: [keyA, keyB] })` - evaluates the value based on
  other context values with keys `keyA` and `keyB`.
- `registry.provide({ a: key, as: MyService })` - constructs the value as `new MyService(ctx)`, where `ctx` is the
  target context. The `a` property may be omitted if `MyService` has a static property `key`.
  See [Context Value Target].
- `registry.provide({ a: key, as: MyService, with: [keyA, keyB] })` - constructs the value as `new MyService(a, b)`,
  where `a` and `b` are context values with keys `keyA` and `keyB` respectively. The `a` property may be omitted if
  `MyService` has a static property `key`. See [Context Value Target].
- `registry.provide({ a: key, via: otherKey })` - makes the value available under `otherKey` available under `key`.
  I.e. aliases it.  


Context Value Key
-----------------

Context value keys identify context values.

They extend a `ContextKey` abstract class. The following implementations are available:

- `SingleContextKey` that allows associate a single value with it, and  
- `MultiContextKey` that allows to associate multiple values with it.

```typescript
import { ContextRegistry, SingleContextKey, MultiContextKey } from 'context-values';

const key1 = new SingleContextKey<string>('key1');
const key2 = new MultiContextKey<number>('key2');

const registry = new ContextRegistry();

registry.provide({ a: key1, is: 'value1' });
registry.provide({ a: key1, is: 'value2' });
registry.provide({ a: key2, is: 1 });
registry.provide({ a: key2, is: 2 });

const context = registry.newValues();

context.get(key1); // 'value2' - SingleContextKey uses the latest value provided
context.get(key2); // [1, 2] - MultiContextKey returns all provided values as an array
```


### Default Value

Context value key may declare a default value. It will be evaluated and returned when the value is not found and no
fallback value specified in the request.

The default value is evaluated by the function accepting a `ContextValues` instance as its only argument.
```typescript
import { ContextRegistry, SingleContextKey, MultiContextKey } from 'context-values';

const key1 = new SingleContextKey<string>('key1');
const key2 = new SingleContextKey<number>('key2', ctx => ctx.get('key1').length);
const key3 = new MultiContextKey<number>('key3');

const registry = new ContextRegistry();

registry.provide({ a: key1, is: 'value' });

const context = registry.newValues();

context.get(key1); // 'value'
context.get(key2); // 6 - evaluated, as it is not provided
context.get(key2, { or: null }); // null - fallback value always takes precedence
context.get(key3); // [] - MultiContextKey uses it as a default value, unless explicitly specified

registry.provide({ a: key2, value: 999 });

context.get(key2); // 999 - provided explicitly
```


### Custom Context Key

[ContextKey.merge()]: #custom-context-key

It is possible to implement a custom `ContextKey`.

For that extend an `AbstractContextKey` that implements the boilerplate. The only method left to implement then is a
`merge()` one.

The `merge()` method takes three parameters:
- a `ContextValues` instance (to consult other context values if necessary),
- a `ContextSources` instance (containing provided [value sources]), and
- a `handleDefault` function responsible for the default value selection.

The method returns a context value constructed out of the provided value sources.


#### Value Sources

[value sources]: #value-sources

Instead of the values themselves, the registry allows to provide their sources. Those are used by [ContextKey.merge()]
method to construct the value.

There could be many sources per single value. And they could be of a type different from the final value.

The sources are passed to the `merge()` function as an [AIterable] instance. The latter is an enhanced `Iterable` with
Array-like API, including `map()`, `flatMap()`, `forEach()`, and other methods.

[AIterable]: https://www.npmjs.com/package/a-iterable 

```typescript
import { 
  AbstractContextKey,
  ContextRegistry,
  ContextSources,
  ContextValues,
  Handler,
  DefaultContextValueHandler
} from 'context-values';

class ConcatContextKey<V> extends AbstractContextKey<V, string> {

  constructor(name: string) {
    super(name);
  }

  merge(
      context: ContextValues,
      sources: ContextSources<string>,
      handleDefault: DefaultContextValueHandler<string>): string | null | undefined {
    
    const result = sources.reduce((p, s) => p != null ? `${p}, ${s}` : `${s}`, null);
    
    if (result != null) {
      return result;
    }
    
    return handleDefault(() => ''); // No sources provided. Returning empty string, unless a fallback value provided.
  }

}

const key1 = new ConcatContextKey<number>('my-numbers');
const key2 = new ConcatContextKey<string>('my-string');

const registry = new ContextRegistry();

registry.provide({ a: key1, is: 1 });
registry.provide({ a: key1, is: 2 });
registry.provide({ a: key1, is: 3 });

const context = registry.newValues();

context.get(key1); // '1, 2, 3' - concatenated value
context.get(key2); // '' - empty string by default 
context.get(key2, { or: undefined }); // undefined - fallback value 
```

A context value for particular key is constructed at most once. Thus, the `merge()` method is called at most once per
key.

A [context value specifier](#context-value-specifier) is consulted at most once per key. And only when the `merge()`
method requested the source value. So, for example, if multiple sources specified for the same `SingleContextKey`, only
the last one will be constructed and used as a context value. The rest of them won't be constructed at all.
