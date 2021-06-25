import type { CxModule } from './module';

/**
 * An error indicating context module dependency load failure.
 */
export class CxDependencyError extends Error {

  /**
   * Constructs context module dependency load error.
   *
   * @param module - A module failed to load.
   * @param reasons - An array of dependency/reason pairs caused the load failure.
   * @param message - An error message.
   */
  constructor(
      readonly module: CxModule,
      readonly reasons: readonly (readonly [CxModule, unknown?])[] = [],
      message: string = CxDependencyError$defaultMessage(module, reasons),
  ) {
    super(message);
  }

}

function CxDependencyError$defaultMessage(
    module: CxModule,
    dependencies: readonly (readonly [CxModule, unknown?])[],
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
