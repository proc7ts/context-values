import { onceAfter } from '@proc7ts/fun-events';
import { asis, newPromiseResolver, noop } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import type { ContextValues } from '../../context-values';
import { ContextKey__symbol } from '../../key';
import { ContextRegistry } from '../../registry';
import { MultiContextUpKey } from '../multi-context-up-key';
import { SingleContextUpKey } from '../single-context-up-key';
import { ContextModule } from './context-module';
import { ContextModuleDependencyError } from './context-module-dependency-error';

describe('ContextModule', () => {

  const key1 = new SingleContextUpKey<number>('key1', { byDefault: () => 1 });
  const key2 = new SingleContextUpKey<number>('key2', { byDefault: () => 2 });

  let registry: ContextRegistry;
  let context: ContextValues;

  beforeEach(() => {
    registry = new ContextRegistry();
    context = registry.newValues();
  });

  it('provides value when loaded', async () => {

    const module = new ContextModule(
        'test',
        {
          setup(setup) {
            setup.provide({ a: key1, is: 101 });
          },
        },
    );
    const supply = registry.provide(module);

    expect(await context.get(key1)).toBe(1);
    expect(await context.get(module).read).toMatchObject({
      module,
      provided: true,
      used: false,
      settled: false,
      ready: false,
    });

    expect(await context.get(module).use().whenReady).toMatchObject({
      module,
      provided: true,
      used: true,
      settled: true,
      ready: true,
    });
    expect(await context.get(key1)).toBe(101);

    supply.off();
    expect(await context.get(key1)).toBe(1);
    expect(await context.get(module).read).toMatchObject({
      module,
      provided: false,
      used: true,
      settled: false,
      ready: false,
    });
  });
  it('provides value by initializer', async () => {

    const resolver = newPromiseResolver();
    const module = new ContextModule(
        'test',
        {
          setup(setup) {
            setup.initBy(async () => {
              await resolver.promise();
              setup.provide({ a: key1, is: 101 });
            });
          },
        },
    );
    const supply = registry.provide(module);

    expect(await context.get(key1)).toBe(1);
    expect(await context.get(module).read).toMatchObject({
      module,
      provided: true,
      used: false,
      settled: false,
      ready: false,
    });

    expect(await context.get(module).use().whenSettled).toMatchObject({
      module,
      provided: true,
      used: true,
      settled: true,
      ready: false,
    });
    expect(await context.get(key1)).toBe(1);

    resolver.resolve();
    expect(await context.get(module).use().whenReady).toMatchObject({
      module,
      provided: true,
      used: true,
      settled: true,
      ready: true,
    });
    expect(await context.get(key1)).toBe(101);

    supply.off();
    expect(await context.get(key1)).toBe(1);
    expect(await context.get(module).read).toMatchObject({
      module,
      provided: false,
      used: true,
      settled: false,
      ready: false,
    });
  });
  it('provides value by initializer inside initializer', async () => {

    const resolver = newPromiseResolver();
    const module = new ContextModule(
        'test',
        {
          setup(setup) {
            setup.initBy(() => {
              setup.initBy(async () => {
                await resolver.promise();
                setup.provide({ a: key1, is: 101 });
              });
            });
          },
        },
    );
    const supply = registry.provide(module);

    expect(await context.get(key1)).toBe(1);
    expect(await context.get(module).read).toMatchObject({
      module,
      provided: true,
      used: false,
      settled: false,
      ready: false,
    });

    expect(await context.get(module).use().whenSettled).toMatchObject({
      module,
      provided: true,
      used: true,
      settled: true,
      ready: false,
    });
    expect(await context.get(key1)).toBe(1);

    resolver.resolve();
    expect(await context.get(module).use().whenReady).toMatchObject({
      module,
      provided: true,
      used: true,
      settled: true,
      ready: true,
    });
    expect(await context.get(key1)).toBe(101);

    supply.off();
    expect(await context.get(key1)).toBe(1);
    expect(await context.get(module).read).toMatchObject({
      module,
      provided: false,
      used: true,
      settled: false,
      ready: false,
    });
  });
  it('loaded once', async () => {

    const key = new MultiContextUpKey('key', { byDefault: () => [0] });
    const module = new ContextModule(
        'test',
        {
          setup(setup) {
            setup.provide({ a: key, is: 1 });
            setup.provide({ a: key, is: 2 });
          },
        },
    );
    const supply1 = registry.provide(module);
    const supply2 = registry.provide(module);

    const receiver = jest.fn();

    context.get(key).do(onceAfter)(receiver);
    expect(receiver).toHaveBeenLastCalledWith(0);

    expect(await context.get(module).use().whenReady).toMatchObject({
      module,
      provided: true,
      used: true,
      settled: true,
      ready: true,
    });
    context.get(key).do(onceAfter)(receiver);
    expect(receiver).toHaveBeenLastCalledWith(1, 2);

    supply1.off();
    await Promise.resolve();
    expect(await context.get(module).use().whenReady).toMatchObject({
      module,
      provided: true,
      used: true,
      settled: true,
      ready: true,
    });
    context.get(key).do(onceAfter)(receiver);
    expect(receiver).toHaveBeenLastCalledWith(1, 2);

    supply2.off();
    context.get(key).do(onceAfter)(receiver);
    expect(receiver).toHaveBeenLastCalledWith(0);
    expect(await context.get(module).read).toMatchObject({
      module,
      provided: false,
      used: true,
      settled: false,
      ready: false,
    });
  });
  it('never loaded when user supply is cut off', async () => {

    const module = new ContextModule(
        'test',
        {
          setup(setup) {
            setup.provide({ a: key1, is: 101 });
          },
        },
    );

    registry.provide(module);

    const handle = context.get(module);
    const use = handle.use(new Supply(noop).off('reason'));

    await Promise.resolve();
    expect(await handle.read).toMatchObject({
      module,
      provided: true,
      used: false,
      settled: false,
      ready: false,
    });
    expect(await Promise.resolve(use.read).catch(asis)).toBe('reason');
    expect(await context.get(key1)).toBe(1);
  });
  it('unloaded when no more users', async () => {

    const module = new ContextModule(
        'test',
        {
          setup(setup) {
            setup.provide({ a: key1, is: 101 });
          },
        },
    );

    registry.provide(module);

    const use1 = context.get(module).use();
    const use2 = use1.use();

    expect(await use1.whenReady).toMatchObject({ module, ready: true });
    expect(await context.get(key1)).toBe(101);

    use1.supply.off();
    await Promise.resolve();
    expect(await use2.read).toMatchObject({ module, ready: true });
    expect(await context.get(key1)).toBe(101);

    use2.supply.off();
    expect(await context.get(key1)).toBe(1);
  });
  it('reports load failure', async () => {

    const error = new Error('test');
    const module = new ContextModule(
        'test',
        {
          setup(setup) {
            setup.provide({ a: key1, is: 101 });
            throw error;
          },
        },
    );

    registry.provide(module);

    const use = context.get(module).use();

    expect(await whenFailed(module)).toBe(error);
    expect(await context.get(key1)).toBe(1);

    use.supply.off();
    expect(await whenStatus(module, status => status.error === undefined && status)).toMatchObject({
      module,
      provided: false,
      used: false,
      settled: false,
      ready: false,
    });
  });
  it('reports init failure', async () => {

    const error = new Error('test');
    const module = new ContextModule(
        'test',
        {
          setup(setup) {
            setup.initBy(() => {
              setup.provide({ a: key1, is: 101 });
              throw error;
            });
          },
        },
    );

    registry.provide(module);

    const use = context.get(module).use();

    expect(await whenFailed(module)).toBe(error);
    expect(await context.get(key1)).toBe(1);

    use.supply.off();
    expect(await whenStatus(module, status => status.error === undefined && status)).toMatchObject({
      module,
      provided: false,
      used: false,
      settled: false,
      ready: false,
    });
  });
  it('rejects initializer when initialization complete', async () => {

    const whenInit = newPromiseResolver();
    const afterInit = newPromiseResolver();
    const module = new ContextModule(
        'test',
        {
          setup(setup) {
            setup.initBy(() => {

              const result = Promise.resolve();

              // eslint-disable-next-line jest/valid-expect-in-promise
              afterInit.resolve(result.then(async () => {
                await whenInit.promise();
                setup.initBy(noop);
              }));

              return result;
            });
          },
        },
    );

    registry.provide(module);

    await context.get(module).use().whenReady;
    whenInit.resolve();

    const error: Error = await afterInit.promise().catch(asis);

    expect(error).toBeInstanceOf(TypeError);
    expect(error.message).toBe('ContextModule(test) initialized already, and does not accept new initializers');

  });
  it('loads dependency', async () => {

    const dep = new ContextModule(
        'dep',
        {
          setup(setup) {
            setup.provide({ a: key1, is: 101 });
          },
        },
    );
    const module = new ContextModule(
        'test',
        {
          needs: dep,
          setup(setup) {
            setup.provide({ a: key2, is: 102 });
          },
        },
    );
    const supply = registry.provide(module);

    expect(await context.get(key1)).toBe(1);
    expect(await context.get(key2)).toBe(2);

    expect(await context.get(module).use().whenReady).toMatchObject({
      module,
      provided: true,
      used: true,
      settled: true,
      ready: true,
    });
    expect(await context.get(key1)).toBe(101);
    expect(await context.get(key2)).toBe(102);

    supply.off();
    expect(await context.get(key1)).toBe(1);
    expect(await context.get(key2)).toBe(2);
    expect(await context.get(module).read).toMatchObject({
      module,
      provided: false,
      used: true,
      settled: false,
      ready: false,
    });
  });
  it('handles preliminary module unload', async () => {

    const dep = new ContextModule(
        'dep',
        {
          setup(setup) {
            setup.provide({ a: key1, is: 101 });
          },
        },
    );
    const module = new ContextModule(
        'test',
        {
          needs: dep,
          setup(setup) {
            setup.provide({ a: key1, is: 201 });
          },
        },
    );
    const supply = registry.provide(module);

    expect(await context.get(key1)).toBe(1);

    const read = context.get(module).use().read;

    supply.off();

    expect(await read).toMatchObject({
      module,
      provided: false,
      used: true,
      settled: false,
      ready: false,
    });
    expect(await context.get(key1)).toBe(1);
  });
  it('handles preliminary module deactivation', async () => {

    const dep = new ContextModule(
        'dep',
        {
          setup(setup) {
            setup.provide({ a: key1, is: 101 });
          },
        },
    );
    const module = new ContextModule(
        'test',
        {
          needs: dep,
          setup(setup) {
            setup.provide({ a: key1, is: 201 });
          },
        },
    );

    registry.provide(module);

    expect(await context.get(key1)).toBe(1);

    const handle = context.get(module);
    const use = handle.use();

    use.supply.whenOff(noop).off('reason');

    expect(await handle.read).toMatchObject({
      module,
      provided: true,
      used: false,
      settled: false,
      ready: false,
    });
    expect(await Promise.resolve(use.read).catch(asis)).toBe('reason');
    expect(await context.get(key1)).toBe(1);
  });
  it('sets up after dependency', async () => {

    const dep = new ContextModule(
        'dep',
        {
          setup(setup) {
            setup.provide({ a: key1, is: 101 });
          },
        },
    );
    const module = new ContextModule(
        'test',
        {
          needs: dep,
          setup(setup) {
            setup.provide({ a: key1, is: 201 });
          },
        },
    );
    const supply = registry.provide(module);

    expect(await context.get(key1)).toBe(1);

    expect(await context.get(module).use().whenReady).toMatchObject({ module, ready: true });
    expect(await context.get(key1)).toBe(201);

    supply.off();
    expect(await context.get(key1)).toBe(1);
  });
  it('handles itself as a dependency', async () => {

    class TestModule extends ContextModule {

      constructor() {
        super('test');
      }

      async setup(setup: ContextModule.Setup): Promise<void> {
        await super.setup(setup);
        setup.provide({ a: key1, is: 201 });
      }

      get needs(): ReadonlySet<ContextModule> {
        return new Set([this]);
      }

    }

    const module = new TestModule();
    const supply = registry.provide(module);

    expect(await context.get(key1)).toBe(1);

    expect(await context.get(module).use().whenReady).toMatchObject({ module, ready: true });
    expect(await context.get(key1)).toBe(201);

    supply.off();
    expect(await context.get(key1)).toBe(1);
  });
  it('fails to load on dependency load failure', async () => {

    const error = new Error('test');
    const dep = new ContextModule(
        'dep',
        {
          setup(setup) {
            setup.provide({ a: key1, is: 101 });
            throw error;
          },
        },
    );
    const module = new ContextModule(
        'test',
        {
          needs: dep,
          setup(setup) {
            setup.provide({ a: key1, is: 201 });
          },
        },
    );

    registry.provide(module);
    context.get(module).use();

    const failure = (await whenFailed(module)) as ContextModuleDependencyError;

    expect(failure).toBeInstanceOf(ContextModuleDependencyError);
    expect(failure.module).toBe(module);
    expect(failure.reasons).toEqual([[dep, error]]);
    expect(await context.get(module).read).toMatchObject({
      module,
      provided: false,
      used: true,
      ready: false,
      settled: false,
      error: failure,
    });
    expect(await context.get(key1)).toBe(1);
  });
  it('fails to load on dependency init failure', async () => {

    const error = new Error('test');
    const dep = new ContextModule(
        'dep',
        {
          setup(setup) {
            setup.initBy(() => {
              setup.provide({ a: key1, is: 101 });
              throw error;
            });
          },
        },
    );
    const module = new ContextModule(
        'test',
        {
          needs: dep,
          setup(setup) {
            setup.provide({ a: key1, is: 201 });
          },
        },
    );

    registry.provide(module);
    context.get(module).use();

    const failure = (await whenFailed(module)) as ContextModuleDependencyError;

    expect(failure).toBeInstanceOf(ContextModuleDependencyError);
    expect(failure.module).toBe(module);
    expect(failure.reasons).toEqual([[dep, error]]);
    expect(await context.get(module).read).toMatchObject({
      module,
      provided: false,
      used: true,
      ready: false,
      settled: false,
      error: failure,
    });
    expect(await context.get(key1)).toBe(1);
  });
  it('replaces other module when explicitly loaded', async () => {

    const replaced = new ContextModule(
        'replaced',
        {
          setup(setup) {
            setup.provide({ a: key1, is: 101 });
          },
        },
    );

    expect(await context.get(key1)).toBe(1);
    expect(await context.get(key2)).toBe(2);

    const replacedSupply = registry.provide(replaced);

    expect(await context.get(replaced).use().whenReady).toMatchObject({ module: replaced, ready: true });
    expect(await context.get(key1)).toBe(101);

    const replacer = new ContextModule(
        'test',
        {
          has: replaced,
          setup(setup) {
            setup.provide({ a: key2, is: 102 });
          },
        },
    );
    const replacerSupply = registry.provide(replacer);

    context.get(replacer).use();
    await whenImplementedBy(replacer, replacer);
    context.get(replaced).use();
    await whenImplementedBy(replaced, replacer);
    expect(await context.get(key1)).toBe(1);
    expect(await context.get(key2)).toBe(102);

    replacerSupply.off();
    await whenImplementedBy(replaced, replaced);
    expect(await context.get(key1)).toBe(101);
    expect(await context.get(key2)).toBe(2);

    replacedSupply.off();
    expect(await context.get(key1)).toBe(1);
    expect(await context.get(key2)).toBe(2);
  });
  it('implicitly loaded on replaced module use', async () => {

    const replaced = new ContextModule(
        'replaced',
        {
          setup(setup) {
            setup.provide({ a: key1, is: 101 });
          },
        },
    );

    expect(await context.get(key1)).toBe(1);
    expect(await context.get(key2)).toBe(2);

    const replacedSupply = registry.provide(replaced);

    const replacer = new ContextModule(
        'test',
        {
          has: replaced,
          setup(setup) {
            setup.provide({ a: key2, is: 102 });
          },
        },
    );

    registry.provide(replacer);
    context.get(replaced).use();
    await whenImplementedBy(replaced, replacer);
    expect(await context.get(key1)).toBe(1);
    expect(await context.get(key2)).toBe(102);

    replacedSupply.off();
    expect(await context.get(key1)).toBe(1);
    expect(await context.get(key2)).toBe(102);
    expect(await context.get(replaced).read).toMatchObject({
      module: replaced,
      provided: true,
      used: true,
      settled: true,
      ready: true,
    });
  });
  it('handles immediate module replacement', async () => {

    const replaced = new ContextModule(
        'replaced',
        {
          setup(setup) {
            setup.provide({ a: key1, is: 101 });
          },
        },
    );

    registry.provide(replaced);

    const replacedUse = context.get(replaced).use();

    const replacer = new ContextModule(
        'test',
        {
          has: replaced,
          setup(setup) {
            setup.provide({ a: key2, is: 102 });
          },
        },
    );
    const replacerSupply = registry.provide(replacer);

    expect(await replacedUse.whenReady).toMatchObject({ module: replacer, ready: true });
    expect(await context.get(key1)).toBe(1);
    expect(await context.get(key2)).toBe(102);

    replacerSupply.off();
    await whenImplementedBy(replaced, replaced);
    expect(await context.get(key1)).toBe(101);
    expect(await context.get(key2)).toBe(2);
  });

  describe('toString', () => {
    it('builds module string representation', () => {
      expect(new ContextModule('test').toString()).toBe('ContextModule(test)');
    });
  });

  describe('[ContextKey__symbol]', () => {
    it('is updatable', () => {

      const module = new ContextModule('test');
      const key = module[ContextKey__symbol];

      expect(key.upKey).toBe(key);
    });
  });

  function whenStatus<T>(
      target: ContextModule,
      checkStatus: (status: ContextModule.Status) => T | false | null | undefined,
  ): Promise<T> {
    return new Promise(resolve => context.get(target).read(
        status => {

          const result = checkStatus(status);

          if (result) {
            resolve(result);
          }
        },
    ));
  }

  function whenImplementedBy(target: ContextModule, impl: ContextModule): Promise<unknown> {
    return whenStatus(
        target,
        ({ module, provided, ready }) => ready && provided && module === impl,
    );
  }

  function whenFailed(target: ContextModule): Promise<unknown> {
    return whenStatus(target, ({ error }) => error);
  }
});
