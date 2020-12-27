import { ContextRegistry } from '../context-registry';
import type { ContextValues } from '../context-values';
import { ContextModule } from './context-module';
import { SingleContextUpKey } from './single-context-up-key';

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

    expect(await context.get(module).use().whenReady).toMatchObject({ module, ready: true });
    expect(await context.get(key1)).toBe(101);

    supply.off();
    expect(await context.get(key1)).toBe(1);
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

    expect(await context.get(module).use().whenReady).toMatchObject({ module, ready: true });
    expect(await context.get(key1)).toBe(101);
    expect(await context.get(key2)).toBe(102);

    supply.off();
    expect(await context.get(key1)).toBe(1);
    expect(await context.get(key2)).toBe(2);
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

    expect(await context.get(replacer).use().whenReady).toMatchObject({ module: replacer });
    expect(await context.get(replaced).use().whenReady).toMatchObject({ module: replacer });
    expect(await context.get(key1)).toBe(1);
    expect(await context.get(key2)).toBe(102);

    replacerSupply.off();
    await new Promise<void>(resolve => context.get(replaced).read(
        // Await for the replacement to unload and the replaced module to load again
        ({ module, ready }) => ready && module === replaced && resolve(),
    ));
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

    expect(await context.get(replaced).use().whenReady).toMatchObject({ module: replacer });
    expect(await context.get(key1)).toBe(1);
    expect(await context.get(key2)).toBe(102);

    replacedSupply.off();
    expect(await context.get(key1)).toBe(1);
    expect(await context.get(key2)).toBe(102);
  });
});
