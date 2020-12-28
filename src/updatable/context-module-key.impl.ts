import type { AfterEvent, EventKeeper } from '@proc7ts/fun-events';
import { mapAfter_ } from '@proc7ts/fun-events';
import type { ContextValueSlot } from '../context-key';
import type { ContextModule } from './context-module';
import { ContextModuleUsage } from './context-module-usage.impl';
import { ContextUpKey } from './context-up-key';

/**
 * @internal
 */
export class ContextModuleKey extends ContextUpKey<ContextModule.Handle, ContextModule> {

  constructor(name: string, private readonly _module: ContextModule) {
    super(name);
  }

  get upKey(): this {
    return this;
  }

  grow(
      slot: ContextValueSlot<
          ContextModule.Handle,
          EventKeeper<ContextModule[]> | ContextModule,
          AfterEvent<ContextModule[]>>,
  ): void {

    const usage = new ContextModuleUsage(slot.context, this._module);

    slot.insert(usage.createHandle());
    slot.setup(({ context, registry }) => usage.setup(context, registry));

    usage.implementBy(implementContextModule(this._module, slot.seed));
  }

}

/**
 * @internal
 */
function implementContextModule(
    module: ContextModule,
    impls: AfterEvent<[ContextModule]>,
): AfterEvent<[ContextModule | undefined]> {
  return impls.do(
      mapAfter_((...candidates) => {

        let impl: ContextModule | undefined;

        for (let i = candidates.length - 1; i >= 0; --i) {
          impl = candidates[i];
          if (impl !== module) {
            break;
          }
        }

        return impl;
      }),
  );
}
