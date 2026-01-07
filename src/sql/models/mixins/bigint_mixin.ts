import { Model } from "../model";
import type { AnyConstructor, Constructor } from "./types";

export interface BigIntFields {
  id: number;
}

/**
 * Mixin to add a bigint primary key column with auto-increment.
 * Uses bigint database type but TypeScript number type.
 *
 * @example
 * ```ts
 * class User extends bigIntMixin() {
 *   declare name: string;
 * }
 *
 * // Composable with other mixins
 * class Post extends timestampMixin(bigIntMixin()) {}
 * ```
 */
export function bigIntMixin(): typeof Model & Constructor<BigIntFields>;
export function bigIntMixin<TBase extends AnyConstructor>(
  Base: TBase,
): TBase & Constructor<BigIntFields>;
export function bigIntMixin<TBase extends AnyConstructor>(
  Base?: TBase,
): TBase & Constructor<BigIntFields> {
  const BaseClass = Base ?? Model;

  class BigIntModel extends (BaseClass as AnyConstructor) {
    declare id: number;

    static {
      Model.column("id", {
        primaryKey: true,
        type: "bigint",
        openApi: {
          type: "number",
          required: true,
        },
      });
    }
  }

  return BigIntModel as TBase & Constructor<BigIntFields>;
}

export const BigIntMixin = bigIntMixin;
