import { describe, expect, it } from '@jest/globals';
import { isAlwaysSupply, Supply, SupplyPeer } from '@proc7ts/supply';
import type { ContextValues } from '../context-values';
import { ContextRegistry } from '../registry';
import { ContextSupply } from './context-supply';

describe('ContextSupply', () => {
  it('is always-supply by default', () => {

    const values = new ContextRegistry().newValues();

    expect(values.get(ContextSupply, { or: null })).toBeNull();
    expect(isAlwaysSupply(values.get(ContextSupply))).toBe(true);
  });
  it('is equal to the supply of context', () => {

    const values = new ContextRegistry().newValues();
    const supply = new Supply();
    const context: ContextValues = {
      get: values.get,
      supply,
    };

    expect(context.get(ContextSupply, { or: null })).toBe(supply);
    expect(context.get(ContextSupply, { or: undefined })).toBe(supply);
    expect(context.get(ContextSupply)).toBe(supply);
  });
  it('is equal to the supply of context and fallback specified', () => {

    const values = new ContextRegistry().newValues();
    const supply = new Supply();
    const context: ContextValues & SupplyPeer = {
      get: values.get,
      supply,
    };
    const fallback = new Supply();

    expect(context.get(ContextSupply, { or: fallback })).toBe(supply);
  });
  it('is equal to fallback when context has no supply and no value provided', () => {

    const values = new ContextRegistry().newValues();
    const context: ContextValues = {
      get: values.get,
    };
    const fallback = new Supply();

    expect(context.get(ContextSupply, { or: fallback })).toBe(fallback);
  });
  it('is equal to provided value when context is a peer', () => {

    const registry = new ContextRegistry();
    const provided = new Supply();

    registry.provide({ a: ContextSupply, is: provided });

    const values = registry.newValues();
    const supply = new Supply();
    const context: ContextValues & SupplyPeer = {
      get: values.get,
      supply,
    };

    expect(context.get(ContextSupply)).toBe(provided);
    expect(context.get(ContextSupply, { or: new Supply() })).toBe(provided);
    expect(context.get(ContextSupply, { or: null })).toBe(provided);
    expect(context.get(ContextSupply, { or: undefined })).toBe(provided);
  });
});
