import { eventSupply, EventSupply__symbol, EventSupplyPeer } from '@proc7ts/fun-events';
import { ContextKeyError } from '../context-key-error';
import { ContextRegistry } from '../context-registry';
import type { ContextValues } from '../context-values';
import { ContextSupply } from './context-supply';

describe('ContextSupply', () => {
  it('is not defined by default', () => {

    const values = new ContextRegistry().newValues();

    expect(values.get(ContextSupply, { or: null })).toBeNull();
    expect(values.get(ContextSupply, { or: undefined })).toBeUndefined();
    expect(() => values.get(ContextSupply)).toThrow(ContextKeyError);
  });
  it('is equal to supply of context when context is a peer', () => {

    const values = new ContextRegistry().newValues();
    const supply = eventSupply();
    const context: ContextValues & EventSupplyPeer = {
      get: values.get,
      [EventSupply__symbol]: supply,
    };

    expect(context.get(ContextSupply, { or: null })).toBe(supply);
    expect(context.get(ContextSupply, { or: undefined })).toBe(supply);
    expect(context.get(ContextSupply)).toBe(supply);
  });
  it('is equal to fallback when context is a peer and no value provided', () => {

    const values = new ContextRegistry().newValues();
    const supply = eventSupply();
    const context: ContextValues & EventSupplyPeer = {
      get: values.get,
      [EventSupply__symbol]: supply,
    };
    const fallback = eventSupply();

    expect(context.get(ContextSupply, { or: fallback })).toBe(fallback);
  });
  it('is equal to provided value when context is a peer', () => {

    const registry = new ContextRegistry();
    const provided = eventSupply();

    registry.provide({ a: ContextSupply, is: provided });

    const values = registry.newValues();
    const supply = eventSupply();
    const context: ContextValues & EventSupplyPeer = {
      get: values.get,
      [EventSupply__symbol]: supply,
    };

    expect(context.get(ContextSupply)).toBe(provided);
    expect(context.get(ContextSupply, { or: eventSupply() })).toBe(provided);
    expect(context.get(ContextSupply, { or: null })).toBe(provided);
    expect(context.get(ContextSupply, { or: undefined })).toBe(provided);
  });
});
