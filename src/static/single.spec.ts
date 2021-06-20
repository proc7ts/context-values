import { beforeEach, describe, expect, it } from '@jest/globals';
import { CxBuilder, cxConstAsset, CxEntry, CxValues } from '../entry';
import { cxSingle } from './single';

describe('cxSingle', () => {

  let builder: CxBuilder;
  let context: CxValues;

  beforeEach(() => {
    builder = new CxBuilder<CxValues>(get => ({ get }));
    context = builder.context;
  });

  let entry: CxEntry<string>;

  beforeEach(() => {
    entry = { perContext: cxSingle() };
  });

  it('provides value', () => {

    const value = 'test value';

    builder.provide(cxConstAsset(entry, value));

    expect(context.get(entry)).toBe(value);
  });
  it('selects the last provided value if more than one provided', () => {

    const value1 = 'value1';
    const value2 = 'value2';

    builder.provide(cxConstAsset(entry, value1));
    builder.provide(cxConstAsset(entry, value2));
    builder.provide(cxConstAsset(entry, null));

    expect(context.get(entry)).toBe(value2);
  });
  it('removes the asset', () => {

    const value1 = 'value1';
    const value2 = 'value2';

    builder.provide(cxConstAsset(entry, value1));
    builder.provide(cxConstAsset(entry, value2)).off();

    expect(context.get(entry)).toBe(value1);
  });
  it('retains the constructed value when asset removed', () => {

    const value1 = 'value1';
    const value2 = 'value2';

    builder.provide(cxConstAsset(entry, value1));

    const supply = builder.provide(cxConstAsset(entry, value2));

    expect(context.get(entry)).toBe(value2);

    supply.off();
    expect(context.get(entry)).toBe(value2);
  });

});
