import { ContextKey, ContextKey__symbol } from '../context-key';
import { ContextStaging } from '../context-staging';
import type { ContextValues } from '../context-values';
import { SingleContextKey } from '../single-context-key';
import type { ContextModule } from './context-module';

export const ContextModuleLoader__key = (/*#__PURE__*/ new SingleContextKey(
    'context-module-loader',
    {
      byDefault(context: ContextValues) {
        return new ContextModuleLoader$(context);
      },
    },
));

/**
 * A service that loads and sets up context modules.
 */
export class ContextModuleLoader {

  /**
   * A key of context value containing a {@link ContextModuleLoader context module loader} to use.
   *
   * By default, each module setup is performed as an {@link ContextStaging.now immediate task}. Thus post-setup tasks
   * could be {@link ContextStaging.later postponed} after the module and all of its dependencies setup completes.
   */
  static get [ContextKey__symbol](): ContextKey<ContextModuleLoader> {
    return ContextModuleLoader__key;
  }

  /**
   * Loads the module.
   *
   * This method is responsible for {@link ContextModule.setup setting up the module}.
   *
   * @param setup - Context module setup.
   *
   * @returns A promise resolved when the module is set up asynchronously.
   */
  async loadModule(setup: ContextModule.Setup): Promise<void> {
    await setup.module.setup(setup);
  }

}

class ContextModuleLoader$ extends ContextModuleLoader {

  private readonly _staging: ContextStaging;

  constructor(context: ContextValues) {
    super();
    this._staging = context.get(ContextStaging);
  }

  async loadModule(setup: ContextModule.Setup): Promise<void> {
    await this._staging.now(() => super.loadModule(setup));
  }

}
