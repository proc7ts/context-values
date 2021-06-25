import { beforeEach, describe, expect, it } from '@jest/globals';
import { asis, newPromiseResolver, noop } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { cxBuildAsset, cxConstAsset } from '../assets';
import { CxBuilder } from '../build';
import { cxDynamic, CxEntry, cxRecent, CxValues } from '../core';
import { CxDependencyError } from './dependency-error';
import { CxModule } from './module';

describe('CxModule', () => {

  const entry1: CxEntry<number> = { perContext: cxRecent({ byDefault: () => 1 }) };
  const entry2: CxEntry<number> = { perContext: cxRecent({ byDefault: () => 2 }) };

  let builder: CxBuilder;
  let context: CxValues;

  beforeEach(() => {
    builder = new CxBuilder(get => ({ get }));
    context = builder.context;
  });

  it('makes module handle available before it is provided', async () => {

    const module = new CxModule('test');

    builder.provide(cxBuildAsset(module, () => null));

    const handle = context.get(module);

    expect(await handle.read).toMatchObject({
      module,
      provided: false,
      used: false,
      settled: false,
      ready: false,
    });
    expect(await handle.use().read).toMatchObject({
      module,
      provided: false,
      used: true,
      settled: false,
      ready: false,
    });
  });
  it('provides value when loaded', async () => {

    const module = new CxModule(
        'test',
        {
          setup(setup) {
            setup.provide(cxConstAsset(entry1, 101));
          },
        },
    );
    const supply = builder.provide(module);

    expect(context.get(entry1)).toBe(1);
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
    expect(context.get(entry1)).toBe(101);

    supply.off();
    expect(context.get(entry1)).toBe(1);
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
    const module = new CxModule(
        'test',
        {
          setup(setup) {
            setup.initBy(async () => {
              await resolver.promise();
              setup.provide(cxConstAsset(entry1, 101));
            });
          },
        },
    );
    const supply = builder.provide(module);

    expect(context.get(entry1)).toBe(1);
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
    expect(context.get(entry1)).toBe(1);

    resolver.resolve();
    expect(await context.get(module).use().whenReady).toMatchObject({
      module,
      provided: true,
      used: true,
      settled: true,
      ready: true,
    });
    expect(context.get(entry1)).toBe(101);

    supply.off();
    expect(context.get(entry1)).toBe(1);
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
    const module = new CxModule(
        'test',
        {
          setup(setup) {
            setup.initBy(() => {
              setup.initBy(async () => {
                await resolver.promise();
                setup.provide(cxConstAsset(entry1, 101));
              });
            });
          },
        },
    );
    const supply = builder.provide(module);

    expect(context.get(entry1)).toBe(1);
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
    expect(context.get(entry1)).toBe(1);

    resolver.resolve();
    expect(await context.get(module).use().whenReady).toMatchObject({
      module,
      provided: true,
      used: true,
      settled: true,
      ready: true,
    });
    expect(context.get(entry1)).toBe(101);

    supply.off();
    expect(context.get(entry1)).toBe(1);
    expect(await context.get(module).read).toMatchObject({
      module,
      provided: false,
      used: true,
      settled: false,
      ready: false,
    });
  });
  it('loaded once', async () => {

    const entry: CxEntry<readonly number[], number> = { perContext: cxDynamic({ byDefault: () => [0] }) };
    const module = new CxModule(
        'test',
        {
          setup(setup) {
            setup.provide(cxConstAsset(entry, 1));
            setup.provide(cxConstAsset(entry, 2));
          },
        },
    );
    const supply1 = builder.provide(module);
    const supply2 = builder.provide(module);

    expect(context.get(entry)).toEqual([0]);

    expect(await context.get(module).use().whenReady).toMatchObject({
      module,
      provided: true,
      used: true,
      settled: true,
      ready: true,
    });
    expect(context.get(entry)).toEqual([1, 2]);

    supply1.off();
    await Promise.resolve();
    expect(await context.get(module).use().whenReady).toMatchObject({
      module,
      provided: true,
      used: true,
      settled: true,
      ready: true,
    });
    expect(context.get(entry)).toEqual([1, 2]);

    supply2.off();
    expect(context.get(entry)).toEqual([0]);
    expect(await context.get(module).read).toMatchObject({
      module,
      provided: false,
      used: true,
      settled: false,
      ready: false,
    });
  });
  it('never loaded when user supply is cut off', async () => {

    const module = new CxModule(
        'test',
        {
          setup(setup) {
            setup.provide(cxConstAsset(entry1, 101));
          },
        },
    );

    builder.provide(module);

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
    expect(context.get(entry1)).toBe(1);
  });
  it('unloaded when no more users', async () => {

    const module = new CxModule(
        'test',
        {
          setup(setup) {
            setup.provide(cxConstAsset(entry1, 101));
          },
        },
    );

    builder.provide(module);

    const use1 = context.get(module).use();
    const use2 = use1.use();

    expect(await use1.whenReady).toMatchObject({ module, ready: true });
    expect(context.get(entry1)).toBe(101);

    use1.supply.off();
    await Promise.resolve();
    expect(await use2.read).toMatchObject({ module, ready: true });
    expect(context.get(entry1)).toBe(101);

    use2.supply.off();
    expect(context.get(entry1)).toBe(1);
  });
  it('reports load failure', async () => {

    const error = new Error('test');
    const module = new CxModule(
        'test',
        {
          setup(setup) {
            setup.provide(cxConstAsset(entry1, 101));
            throw error;
          },
        },
    );

    builder.provide(module);

    const use = context.get(module).use();

    expect(await whenFailed(module)).toBe(error);
    expect(context.get(entry1)).toBe(1);

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
    const module = new CxModule(
        'test',
        {
          setup(setup) {
            setup.initBy(() => {
              setup.provide(cxConstAsset(entry1, 101));
              throw error;
            });
          },
        },
    );

    builder.provide(module);

    const use = context.get(module).use();

    expect(await whenFailed(module)).toBe(error);
    expect(context.get(entry1)).toBe(1);

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
    const module = new CxModule(
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

    builder.provide(module);

    await context.get(module).use().whenReady;
    whenInit.resolve();

    const error: Error = await afterInit.promise().catch(asis);

    expect(error).toBeInstanceOf(TypeError);
    expect(error.message).toBe('[CxModule test] initialized already, and does not accept new initializers');

  });
  it('loads dependency', async () => {

    const dep = new CxModule(
        'dep',
        {
          setup(setup) {
            setup.provide(cxConstAsset(entry1, 101));
          },
        },
    );
    const module = new CxModule(
        'test',
        {
          needs: dep,
          setup(setup) {
            setup.provide(cxConstAsset(entry2, 102));
          },
        },
    );
    const supply = builder.provide(module);

    expect(context.get(entry1)).toBe(1);
    expect(context.get(entry2)).toBe(2);

    expect(await context.get(module).use().whenReady).toMatchObject({
      module,
      provided: true,
      used: true,
      settled: true,
      ready: true,
    });
    expect(context.get(entry1)).toBe(101);
    expect(context.get(entry2)).toBe(102);

    supply.off();
    expect(context.get(entry1)).toBe(1);
    expect(context.get(entry2)).toBe(2);
    expect(await context.get(module).read).toMatchObject({
      module,
      provided: false,
      used: true,
      settled: false,
      ready: false,
    });
  });
  it('handles preliminary module unload', async () => {

    const dep = new CxModule(
        'dep',
        {
          setup(setup) {
            setup.provide(cxConstAsset(entry1, 101));
          },
        },
    );
    const module = new CxModule(
        'test',
        {
          needs: dep,
          setup(setup) {
            setup.provide(cxConstAsset(entry1, 201));
          },
        },
    );
    const supply = builder.provide(module);

    expect(context.get(entry1)).toBe(1);

    const read = context.get(module).use().read;

    supply.off();

    expect(await read).toMatchObject({
      module,
      provided: false,
      used: true,
      settled: false,
      ready: false,
    });
    expect(context.get(entry1)).toBe(1);
  });
  it('handles preliminary module deactivation', async () => {

    const dep = new CxModule(
        'dep',
        {
          setup(setup) {
            setup.provide(cxConstAsset(entry1, 101));
          },
        },
    );
    const module = new CxModule(
        'test',
        {
          needs: dep,
          setup(setup) {
            setup.provide(cxConstAsset(entry1, 201));
          },
        },
    );

    builder.provide(module);

    expect(context.get(entry1)).toBe(1);

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
    expect(context.get(entry1)).toBe(1);
  });
  it('sets up after dependency', async () => {

    const dep = new CxModule(
        'dep',
        {
          setup(setup) {
            setup.provide(cxConstAsset(entry1, 101));
          },
        },
    );
    const module = new CxModule(
        'test',
        {
          needs: dep,
          setup(setup) {
            setup.provide(cxConstAsset(entry1, 201));
          },
        },
    );
    const supply = builder.provide(module);

    expect(context.get(entry1)).toBe(1);

    expect(await context.get(module).use().whenReady).toMatchObject({ module, ready: true });
    expect(context.get(entry1)).toBe(201);

    supply.off();
    expect(context.get(entry1)).toBe(1);
  });
  it('handles itself as a dependency', async () => {

    class TestModule extends CxModule {

      constructor() {
        super('test');
      }

      override async setup(setup: CxModule.Setup): Promise<void> {
        await super.setup(setup);
        setup.provide(cxConstAsset(entry1, 201));
      }

      override get needs(): ReadonlySet<CxModule> {
        return new Set([this]);
      }

    }

    const module = new TestModule();
    const supply = builder.provide(module);

    expect(context.get(entry1)).toBe(1);

    expect(await context.get(module).use().whenReady).toMatchObject({ module, ready: true });
    expect(context.get(entry1)).toBe(201);

    supply.off();
    expect(context.get(entry1)).toBe(1);
  });
  it('fails to load on dependency load failure', async () => {

    const error = new Error('test');
    const dep = new CxModule(
        'dep',
        {
          setup(setup) {
            setup.provide(cxConstAsset(entry1, 101));
            throw error;
          },
        },
    );
    const module = new CxModule(
        'test',
        {
          needs: dep,
          setup(setup) {
            setup.provide(cxConstAsset(entry1, 201));
          },
        },
    );

    builder.provide(module);
    context.get(module).use();

    const failure = (await whenFailed(module)) as CxDependencyError;

    expect(failure).toBeInstanceOf(CxDependencyError);
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
    expect(context.get(entry1)).toBe(1);
  });
  it('fails to load on dependency init failure', async () => {

    const error = new Error('test');
    const dep = new CxModule(
        'dep',
        {
          setup(setup) {
            setup.initBy(() => {
              setup.provide(cxConstAsset(entry1, 101));
              throw error;
            });
          },
        },
    );
    const module = new CxModule(
        'test',
        {
          needs: dep,
          setup(setup) {
            setup.provide(cxConstAsset(entry1, 201));
          },
        },
    );

    builder.provide(module);
    context.get(module).use();

    const failure = (await whenFailed(module)) as CxDependencyError;

    expect(failure).toBeInstanceOf(CxDependencyError);
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
    expect(context.get(entry1)).toBe(1);
  });
  it('replaces other module when explicitly loaded', async () => {

    const replaced = new CxModule(
        'replaced',
        {
          setup(setup) {
            setup.provide(cxConstAsset(entry1, 101));
          },
        },
    );

    expect(context.get(entry1)).toBe(1);
    expect(context.get(entry2)).toBe(2);

    const replacedSupply = builder.provide(replaced);

    expect(await context.get(replaced).use().whenReady).toMatchObject({ module: replaced, ready: true });
    expect(context.get(entry1)).toBe(101);

    const replacer = new CxModule(
        'replacer',
        {
          has: replaced,
          setup(setup) {
            setup.provide(cxConstAsset(entry2, 102));
          },
        },
    );
    const replacerSupply = builder.provide(replacer);

    context.get(replacer).use();
    await whenImplementedBy(replacer, replacer);

    context.get(replaced).use();
    await whenImplementedBy(replaced, replacer);
    expect(context.get(entry1)).toBe(1);
    expect(context.get(entry2)).toBe(102);

    replacerSupply.off();
    await whenImplementedBy(replaced, replaced);
    expect(context.get(entry1)).toBe(101);
    expect(context.get(entry2)).toBe(2);

    replacedSupply.off();
    expect(context.get(entry1)).toBe(1);
    expect(context.get(entry2)).toBe(2);
  });
  it('implicitly loaded on replaced module use', async () => {

    const replaced = new CxModule(
        'replaced',
        {
          setup(setup) {
            setup.provide(cxConstAsset(entry1, 101));
          },
        },
    );

    expect(context.get(entry1)).toBe(1);
    expect(context.get(entry2)).toBe(2);

    const replacedSupply = builder.provide(replaced);

    const replacer = new CxModule(
        'test',
        {
          has: replaced,
          setup(setup) {
            setup.provide(cxConstAsset(entry2, 102));
          },
        },
    );

    builder.provide(replacer);
    context.get(replaced).use();
    await whenImplementedBy(replaced, replacer);
    expect(context.get(entry1)).toBe(1);
    expect(context.get(entry2)).toBe(102);

    replacedSupply.off();
    expect(context.get(entry1)).toBe(1);
    expect(context.get(entry2)).toBe(102);
    expect(await context.get(replaced).read).toMatchObject({
      module: replaced,
      provided: true,
      used: true,
      settled: true,
      ready: true,
    });
  });
  it('handles immediate module replacement', async () => {

    const replaced = new CxModule(
        'replaced',
        {
          setup(setup) {
            setup.provide(cxConstAsset(entry1, 101));
          },
        },
    );

    builder.provide(replaced);

    const replacedUse = context.get(replaced).use();

    const replacer = new CxModule(
        'test',
        {
          has: replaced,
          setup(setup) {
            setup.provide(cxConstAsset(entry2, 102));
          },
        },
    );
    const replacerSupply = builder.provide(replacer);

    expect(await replacedUse.whenReady).toMatchObject({ module: replacer, ready: true });
    expect(context.get(entry1)).toBe(1);
    expect(context.get(entry2)).toBe(102);

    replacerSupply.off();
    await whenImplementedBy(replaced, replaced);
    expect(context.get(entry1)).toBe(101);
    expect(context.get(entry2)).toBe(2);
  });

  describe('toString', () => {
    it('builds module string representation', () => {
      expect(new CxModule('test').toString()).toBe('[CxModule test]');
    });
  });

  function whenStatus<T>(
      target: CxModule,
      checkStatus: (status: CxModule.Status) => T | false | null | undefined,
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

  function whenImplementedBy(target: CxModule, impl: CxModule): Promise<unknown> {
    return whenStatus(
        target,
        ({ module, provided, ready }) => ready && provided && module === impl,
    );
  }

  function whenFailed(target: CxModule): Promise<unknown> {
    return whenStatus(target, ({ error }) => error);
  }
});
