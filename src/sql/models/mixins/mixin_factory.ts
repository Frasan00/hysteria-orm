import type { ColumnOptions } from "../decorators/model_decorators_types";
import { Model } from "../model";
import type { AnyConstructor, Constructor } from "./types";

/**
 * Column definitions map for the mixin factory.
 * Keys are property names, values are ColumnOptions.
 */
export type MixinColumns<TFields> = {
  [K in keyof TFields]: ColumnOptions;
};

/**
 * Creates a custom mixin function with the specified columns.
 *
 * @example
 * ```ts
 * interface AuditFields {
 *   createdBy: string | null;
 *   updatedBy: string | null;
 * }
 *
 * const auditMixin = createMixin<AuditFields>({
 *   createdBy: { nullable: true },
 *   updatedBy: { nullable: true },
 * });
 *
 * class User extends auditMixin(timestampMixin(uuidMixin())) {
 *   static table = 'users';
 * }
 * ```
 */
export const createMixin = <TFields>(
  columns: MixinColumns<TFields>,
): {
  (): typeof Model & Constructor<TFields>;
  <TBase extends AnyConstructor>(base: TBase): TBase & Constructor<TFields>;
} => {
  const registerColumns = (): void => {
    for (const [columnName, options] of Object.entries(columns)) {
      Model.column(columnName, options as ColumnOptions);
    }
  };

  function mixin(): typeof Model & Constructor<TFields>;
  function mixin<TBase extends AnyConstructor>(
    base: TBase,
  ): TBase & Constructor<TFields>;
  function mixin<TBase extends AnyConstructor>(
    base?: TBase,
  ): TBase & Constructor<TFields> {
    const BaseClass = base ?? Model;

    const MixinClass = class extends (BaseClass as AnyConstructor) {
      static {
        registerColumns();
      }
    };

    return MixinClass as TBase & Constructor<TFields>;
  }

  return mixin;
};

export const MixinFactory = createMixin;
