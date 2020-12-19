import { Supply, SupplyPeer } from '@proc7ts/primitives';
import { ContextKeyError } from './context-key-error';
import { ContextRegistry } from './context-registry';
import { ContextSupply } from './context-supply';
import type { ContextValues } from './context-values';

describe('ContextSupply', () => {
  it('is not defined by default', () => {

    const values = new ContextRegistry().newValues();

    expect(values.get(ContextSupply, { or: null })).toBeNull();
    expect(values.get(ContextSupply, { or: undefined })).toBeUndefined();
    expect(() => values.get(ContextSupply)).toThrow(ContextKeyError);
  });
  it('is equal to supply of context when context is a peer', () => {

    const values = new ContextRegistry().newValues();
    const supply = new Supply();
    const context: ContextValues & SupplyPeer = {
      get: values.get,
      supply,
    };

    expect(context.get(ContextSupply, { or: null })).toBe(supply);
    expect(context.get(ContextSupply, { or: undefined })).toBe(supply);
    expect(context.get(ContextSupply)).toBe(supply);
  });
  it('is equal to fallback when context is a peer and no value provided', () => {

    const values = new ContextRegistry().newValues();
    const supply = new Supply();
    const context: ContextValues & SupplyPeer = {
      get: values.get,
      supply,
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
