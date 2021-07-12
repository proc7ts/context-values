IoC Context Values
==================

[![NPM][npm-image]][npm-url]
[![Build Status][build-status-img]][build-status-link]
[![Code Quality][quality-img]][quality-link]
[![Coverage][coverage-img]][coverage-link]
[![GitHub Project][github-image]][github-url]
[![API Documentation][api-docs-image]][api-docs-url]

[IoC] context allows accessing its _values_ identified by their _entries_ and _provided_ somewhere else. 

**Features:**

- Type-safe API.

  Each context entry has definite value type specified as generic type parameter. So, when accessing context value with
  [get()] method, the returned value has that exact type, rather `any`.

- Clean distinction between _assets_ provided for context entries, and their _values_.

  E.g. entry value is an array, while its assets are elements of this array.

- Customizable relation between entry assets and its value.

  This relation established by entry implementation. Typically, the entry builds its value out of its assets. 

- Reusable context entry implementations suitable for the majority of use cases.

  E.g. [cxSingle()] for single-valued entries, or [cxArray()] for array-valued ones.

- Dynamically updatable context values.

  The [cxSingle()] and [cxArray()] entries build the value _once_ on the first access, and return it on each subsequent
  access. In contrast, the [cxRecent()] and [cxDynamic()] are able to track asset changes and reflect these changes in
  entry value.

- Context derivation.

  A context may derive another context to make the values from the latter available in the former.

[npm-image]: https://img.shields.io/npm/v/@proc7ts/context-values.svg?logo=npm
[npm-url]: https://www.npmjs.com/package/@proc7ts/context-values
[build-status-img]: https://github.com/proc7ts/context-values/workflows/Build/badge.svg
[build-status-link]: https://github.com/proc7ts/context-values/actions?query=workflow:Build
[quality-img]: https://app.codacy.com/project/badge/Grade/69f604f1399d49d58f12202fce675048
[quality-link]: https://www.codacy.com/gh/proc7ts/context-values/dashboard?utm_source=github.com&utm_medium=referral&utm_content=proc7ts/context-values&utm_campaign=Badge_Grade
[coverage-img]: https://app.codacy.com/project/badge/Coverage/69f604f1399d49d58f12202fce675048
[coverage-link]: https://www.codacy.com/gh/proc7ts/context-values/dashboard?utm_source=github.com&utm_medium=referral&utm_content=proc7ts/context-values&utm_campaign=Badge_Coverage
[github-image]: https://img.shields.io/static/v1?logo=github&label=GitHub&message=project&color=informational
[github-url]: https://github.com/proc7ts/context-values
[api-docs-image]: https://img.shields.io/static/v1?logo=typescript&label=API&message=docs&color=informational
[api-docs-url]: https://proc7ts.github.io/context-values/
[IoC]: https://en.wikipedia.org/wiki/Inversion_of_control


Project Modules
---------------
  
- [@proc7ts/context-values] library declares context API, and provides basic context entries implementations.
- [@proc7ts/context-builder] builds IoC contexts, and provides basic context entry assets implementations.
- [@proc7ts/context-modules] brings support for dynamically loadable (and un-loadable) context modules.

[@proc7ts/context-builder]: https://www.npmjs.com/package/@proc7ts/context-builder
[@proc7ts/context-modules]: https://www.npmjs.com/package/@proc7ts/context-modules
[@proc7ts/context-values]: https://www.npmjs.com/package/@proc7ts/context-values


Accessing Context Values
------------------------

An IoC context implements a [CxValues] interface. This interface declares a single [get()] method accepting requested
entry instance ([CxEntry]), and optional request ([CxRequest]).

The following code returns a string value of `myEntry` entry, or throws an exception if the entry has no value.
```typescript
import { CxEntry, cxSingle } from '@proc7ts/context-values';

const myEntry: CxEntry<string> = { 
  perContext: cxSingle(),
  toString: () => '[CxEntry myEntry]',
};

myContext.get(myEntry);
```

[get()]: https://proc7ts.github.io/context-values/interfaces/CxValues.html#get
[CxEntry]: https://proc7ts.github.io/context-values/interfaces/CxEntry.html
[CxRequest]: https://proc7ts.github.io/context-values/interfaces/CxRequest.html
[CxValues]: https://proc7ts.github.io/context-values/interfaces/CxValues.html


### Fallback Value

Normally, if context entry has no value, an exception thrown. To avoid this, a [fallback value] can be provided. It will
be returned in case there is no value.

```typescript
import { CxEntry, cxSingle } from '@proc7ts/context-values';

const myEntry: CxEntry<string> = {
  perContext: cxSingle(),
  toString: () => '[CxEntry myEntry]',
};

myContext.get(myEntry, { or: 'empty' }); // 'empty'
```

A `null` value can be used as a fallback one.

[fallback value]: https://proc7ts.github.io/context-values/interfaces/CxRequest.html#or


### Default Value

Context entry may have a [default value] that will be returned, unless the entry has an explicitly provided one or a
[fallback value] specified. It is possible to request the default value directly:

```typescript
import { CxEntry, CxRequestMethod, cxSingle } from '@proc7ts/context-values';

const myEntry: CxEntry<string> = {
  perContext: cxSingle({ byDefault: () => 'default' }),
  toString: () => '[CxEntry myEntry]',
};

myContext.get(myEntry, { by: CxRequestMethod.Defaults }); // 'default'
```

It is also possible to request explicitly provided value with `{ by: CxRequestMethod.Assets }` request.

[default value]: https://proc7ts.github.io/context-values/interfaces/CxEntry.Definition.html#assignDefault


### Request Callback

In addition to returning from [get()] method call, the context value can be passed to a callback:

```typescript
import { CxEntry, CxRequestMethod, cxSingle } from '@proc7ts/context-values';

const myEntry: CxEntry<string> = {
  perContext: cxSingle({ byDefault: () => 'default' }),
  toString: () => '[CxEntry myEntry]',
};

let myValue: string | undefined;
let myValueBy: CxRequestMethod | undefined;

myContext.get(myEntry, { set: (value, by) => { myValue = value; myValueBy = my });
// myValue === 'default'
// myValueBy === CxRequestMethod.Defaults
```

The callback won't be called if the entry has no value.

Note that this is the only way to know the origin of the value received. I.e. whether it is

- an explicitly provided value (`CxRequestMethod.Assets`),
- a [default value] (`CxRequestMethod.Defaults`), or
- a [fallback value] (`CxRequestMethod.Fallback`).


Providing Context Values
------------------------

The [@proc7ts/context-builder] contains everything needed to build a context and to provide assets for it.

```typescript
import { CxBuilder, cxBuildAsset, cxConstAsset } from '@proc7ts/context-builder';
import { CxEntry, cxSingle } from '@proc7ts/context-values';

const entry1: CxEntry<string> = { perContext: cxSingle(), toString: () => '[CxEntry entry1]' };
const entry2: CxEntry<number> = { perContext: cxSingle(), toString: () => '[CxEntry entry2]' };

// Create context builder.
const cxBuilder = new CxBuilder(get => ({ get } /* create context instance with `get` method */));

// Provide asset for `entry1` as constant.
cxBuilder.provide(cxConstAsset(entry1, 'string'));

// Evaluate asset for `entry2` as the length `entry1` value.
cxBuilder.provide(cxBuildAsset(entry2, target => target.get(entry1).length))

// Obtain context instance.
const context = registry.context;

// Obtain context values.
context.get(entry1); // 'string'
context.get(entry2); // 6
```


Context Entry
-------------

Context entry identifies the value to obtain when passed to context's [get()] method. It is also responsible for
combining provided _assets_ into context _value_.

Context entry implements [CxEntry] interface containing a single `perContext` method. It also a good practice to
override a `toString()` method, so that error messages contain a string representation of the entry.

There are several standard customizable [CxEntry] implementations. It is typically enough to use one of them:

- [cxArray()] - Lazily evaluated array-valued context entry.
- [cxDynamic()] - Dynamically updating context entry reflecting the changes in entry assets.
- [cxEvaluated()] - Context entry with value lazily evaluated by the given function.
- [cxRecent()] - Dynamically updating context entry reflecting the changes in the most recent entry asset.
- [cxSingle()] - Lazily evaluated single-valued context entry.

These functions create entry definers. I.e. functions that can be used as `perContext` implementations.

[cxArray()]: https://proc7ts.github.io/context-values/modules.html#cxArray
[cxDynamic()]: https://proc7ts.github.io/context-values/modules.html#cxDynamic
[cxEvaluated()]: https://proc7ts.github.io/context-values/modules.html#cxEvaluated
[cxRecent()]: https://proc7ts.github.io/context-values/modules.html#cxRecent
[cxSingle()]: https://proc7ts.github.io/context-values/modules.html#cxSingle

```typescript
import { CxBuilder, cxConstAsset } from '@proc7ts/context-builder';
import { cxDynamic, CxEntry } from '@proc7ts/context-values';

// Context value is a readonly array of strings,
// wwhile its assets are stringhs.
const myEntry: CxEntry<readonly string[], string> = { 
  perContext: cxDynamic(),
  toString: () => '[CxEntry myEntry]',
};

const cxBuilder = new CxBuilder(get => ({ get }));
const context = cxBuilder.context;

context.get(myEntry); // []

// Provide first asset.
const supply = cxBuilder.provide(cxConstAsset(myEntry, 'foo'));

context.get(myEntry); // ['foo']

// Provide second asset.
cxBuilder.provide(cxConstAsset(myEntry, 'bar'));
context.get(myEntry); // ['foo', 'bar']

// Revoke the first asset.
supply.off();
context.get(myEntry); // ['bar']
```


### Context Scopes

When combining multiple contexts (i.e. making one context derive another one), it is often required to obtain some entry
from particular context only.

To make it possible a context may provide itself as its own context value. Then the entry implementation may obtain
this context, and then obtain its value from that context.

A context entry containing a context as its value called _scope_. There are two context entry implementations able to
handle scopes:

- [cxScoped()] - Scoped context entry.
- [cxDefaultScoped()] - Context entry with scoped default value. 

[cxDefaultScoped()]: https://proc7ts.github.io/context-values/modules.html#cxDefaultScoped
[cxScoped()]: https://proc7ts.github.io/context-values/modules.html#cxScoped
