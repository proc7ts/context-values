import type { ContextModule } from './context-module';

/**
 * An error indicating context module dependency load failure.
 */
export class ContextModuleDependencyError extends Error {

  /**
   * Constructs context module dependency load error.
   *
   * @param module - A module failed to load.
   * @param reasons - An array of dependency/reason pairs caused the load failure.
   * @param message - An error message.
   */
  constructor(
      readonly module: ContextModule,
      readonly reasons: readonly (readonly [ContextModule, unknown?])[] = [],
      message: string = ContextModuleDependencyError$defaultMessage(module, reasons),
  ) {
    super(message);
  }

}

function ContextModuleDependencyError$defaultMessage(
    module: ContextModule,
    dependencies: readonly (readonly [ContextModule, unknown?])[],
): string {

  const reasons = dependencies.reduce(
      (out, [dep, reason]) => {
        if (out) {
          out += ', ';
        } else {
          out = ': ';
        }
        if (reason !== undefined) {
          out += `${dep} failed to load (${reason})`;
        } else {
          out += `${dep} not loaded`;
        }

        return out;
      },
      '',
  );

  return `Failed to load ${module}${reasons}`;
}
