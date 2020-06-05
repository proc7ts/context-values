IoC Context Values Provider
===========================

[![NPM][npm-image]][npm-url]
[![Build Status][build-status-img]][build-status-link]
[![codecov][codecov-image]][codecov-url]
[![GitHub Project][github-image]][github-url]
[![API Documentation][api-docs-image]][api-docs-url]

This library allows to construct an [IoC] context, other components can request values from.

An [IoC] context is an object with `get()` method implemented. This method returns a context value by its key.

[npm-image]: https://img.shields.io/npm/v/@proc7ts/context-values.svg?logo=npm
[npm-url]: https://www.npmjs.com/package/@proc7ts/context-values
[build-status-img]: https://github.com/proc7ts/context-values/workflows/Build/badge.svg
[build-status-link]: https://github.com/proc7ts/context-values/actions?query=workflow%3ABuild
[codecov-image]: https://codecov.io/gh/proc7ts/context-values/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/proc7ts/context-values
[github-image]: https://img.shields.io/static/v1?logo=github&label=GitHub&message=project&color=informational
[github-url]: https://github.com/proc7ts/context-values
[api-docs-image]: https://img.shields.io/static/v1?logo=typescript&label=API&message=docs&color=informational
[api-docs-url]: https://proc7ts.github.io/context-values/
[IoC]: https://en.wikipedia.org/wiki/Inversion_of_control


Accessing Context Values
------------------------

A context should implement a `ContextValues` interface. This interface declares a `get()` method accepting a
`ContextRequest` identifying the requested value (e.g. a `ContextKey` instance), and a non-mandatory options.

The following code returns a string value associated with `key`, or throws an exception if the value not found.
```typescript
import { SingleContextKey } from '@proc7ts/context-values';

const key = new SingleContextKey<string>('my-key');

myContext.get(key)
```

### Fallback Value

Normally, if the value associated with the given key can not be found, an exception is thrown. To avoid this, a fallback
value can be provided. It will be returned if the value not found.
```typescript
import { SingleContextKey } from '@proc7ts/context-values';

const key = new SingleContextKey<string>('my-key');

myContext.get(key, { or: 'empty' });
```


### Context Value Request

The `get()` method accepts not only a `ContextKey` instance, but arbitrary `ContextRequest`. The latter is just an
object with `[ContextKey__symbol]` property containing a `ContextKey` instance to find.

This can be handy e.g. when requesting an instance of some known type:
```typescript
import { ContextKey, ContextKey__symbol, SingleContextKey } from '@proc7ts/context-values';

class MyService {
  
  // MyService class (not instance) implements a `ContextRequest`
  static readonly [ContextKey__symbol]: ContextKey<MyService> = new SingleContextKey('my-service');
  
}

myContext.get(MyService); // No need to specify `MyService[ContextKey__symbol]` here
myContext.get(MyService[ContextKey__symbol]); // The same as above.
```


Providing Context Values
------------------------

Context values can be provided using `ContextRegistry`.
Then the values can be requested from `ContextValues` instance constructed by the `newValues()` method of the registry. 

```typescript
import { ContextRegistry, SingleContextKey } from '@proc7ts/context-values';

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
object with `[ContextKey__symbol]` property containing a `ContextKey` to provide.


This can be handy e.g. when providing an instance of some known type:
```typescript
import { ContextKey, ContextKey__symbol, ContextRegistry, SingleContextKey } from '@proc7ts/context-values';

class MyService {
  
  // MyService class (not instance) implements a `ContextRequest`
  static readonly [ContextKey__symbol]: ContextKey<MyService> = new SingleContextKey('my-service');
  
}

const registry = new ContextRegistry();

registry.provide({ a: MyService, is: new MyService() });

const context = registry.newValues();

context.get(MyService); // No need to specify `MyService[ContextKey__symbol]` here
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
  target context. The `a` property may be omitted if `MyService` has a static `[ContextKey__symbol]` property.
  See [Context Value Target].
- `registry.provide({ a: key, as: MyService, with: [keyA, keyB] })` - constructs the value as `new MyService(a, b)`,
  where `a` and `b` are context values with keys `keyA` and `keyB` respectively. The `a` property may be omitted if
  `MyService` has a static `[ContextKey__symbol]` property. See [Context Value Target].
- `registry.provide({ a: key, via: otherKey })` - makes the value available under `otherKey` available under `key`.
  I.e. aliases it.  


Context Value Key
-----------------

Context value keys identify context values.

They extend a `ContextKey` abstract class. The following implementations are available:

- `SingleContextKey` that allows associating a single value with it, and  
- `MultiContextKey` that allows associating multiple values with it.

```typescript
import { ContextRegistry, SingleContextKey, MultiContextKey } from '@proc7ts/context-values';

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

Context value key may declare a default value. It will be evaluated and returned when the value not found and no
fallback one specified in the request.

The default value is evaluated by the function accepting a `ContextValues` instance as its only argument.
```typescript
import { ContextRegistry, SingleContextKey, MultiContextKey } from '@proc7ts/context-values';

const key1 = new SingleContextKey<string>('key1');
const key2 = new SingleContextKey<number>('key2', { byDefault: ctx => ctx.get('key1').length });
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

[ContextKey.grow()]: #custom-context-key

It is possible to implement a custom `ContextKey`.

For that extend e.g. a `SimpleContextKey` that implements the boilerplate. The only method left to implement then is a
`grow()` one.

The `grow()` method takes a single `ContextValueSlot` parameter to insert the constructed value to.


#### Value Sources and Seeds

[value sources]: #value-sources

Instead of the value itself, the registry allows to provide its sources. Those are combined into _value seed_.
That is passed to [ContextKey.grow()] method to construct the value (or grow it from the seed).

There could be multiple sources per single value. They could be of a different type.

For example, the seed of `MultiContextKey` is an `Iterable` instance of value sources.

```typescript
import { 
  ContextRegistry,
  ContextValueSlot,
  IterativeContextKey,
} from '@proc7ts/context-values';

class ConcatContextKey<Src> extends IterativeContextKey<string, Src> {

  constructor(name: string) {
    super(name);  
  }

  grow(
    slot: ContextValueSlot<string, Src, Iterable<Src>>,
  ): void {
    
    const result = slot.seed.reduce((p, s) => p != null ? `${p}, ${s}` : `${s}`, null);
    
    if (result != null) {
      // Insert the result if there is at leas one source.
      slot.insert(result);
    } else if (slot.hasFallback) {
        // No sources provided, but there is a fallback value. Insert the latter.
        slot.insert(slot.or);    
    } else {
        // No sources provided, and there is no a fallback value. Insert an empty string.    
        slot.insert('');
    }
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

A context value for particular key is constructed at most once. Thus, the `grow()` method is called at most once per
key.

A [context value specifier](#context-value-specifier) is consulted at most once per key. Only when the `grow()`
method requested the source value. So, for example, if multiple sources specified for the same `SingleContextKey`, only
the last one will be constructed and used as a context value. The rest of them won't be constructed at all.


Updatable Context Values
------------------------

`SingleContextKey` and `MultiContextKey`, imply that once the associated context value constructed, it no longer
changes. I.e. even though more sources provided for the same key in `ContextRegistry` they won't affect the already
constructed value. 

However, it is possible to update context values. For that a `ContextUpKey` abstract context value key implementation
may be used, or `SingleContextUpKey` and `MultiContextUpKey` implementations.

They provide an [AfterEvent] keeper of value. The receivers registered in this keeper would receive the actual value
each time it changes. E.g. when new value source is provided in `ContextRegistry`.

This functionality is implemented in `@proc7ts/context-value/updatable` sub-module and depends on `@proc7ts/fun-events`.

```typescript
import { ContextRegistry } from '@proc7ts/context-values'; 
import { SingleContextUpKey } from '@proc7ts/context-values/updatable';

const key = new SingleContextUpKey<string>('updatable-value');
const registry = new ContextRegistry();

registry.provide({ a: key, is: 'initial' });

const values = registry.newValues();

values.get(key)(value => console.log(value)); // Log: 'initial'

registry.provide({ a: key, is: 'updated' });  // Log: 'updated'
```

[AfterEvent]: https://www.npmjs.com/package/@proc7ts/fun-events
