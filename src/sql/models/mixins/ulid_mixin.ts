import { Model } from "../model";
import type { AnyConstructor, Constructor } from "./types";

export interface UlidFields {
  id: string;
}

/**
 * Mixin to add a ULID primary key column.
 * ULID = Universally Unique Lexicographically Sortable Identifier.
 * Automatically generates ULID if not provided.
 *
 * @example
 * ```ts
 * class User extends ulidMixin() {
 *   declare name: string;
 * }
 *
 * // Composable with other mixins
 * class Post extends timestampMixin(ulidMixin()) {}
 * ```
 */
export function ulidMixin(): typeof Model & Constructor<UlidFields>;
export function ulidMixin<TBase extends AnyConstructor>(
  Base: TBase,
): TBase & Constructor<UlidFields>;
export function ulidMixin<TBase extends AnyConstructor>(
  Base?: TBase,
): TBase & Constructor<UlidFields> {
  const BaseClass = Base ?? Model;

  class UlidModel extends (BaseClass as AnyConstructor) {
    declare id: string;

    static {
      Model.column("id", {
        primaryKey: true,
        type: "ulid",
        openApi: {
          type: "string",
          format: "ulid",
          required: true,
        },
      });
    }
  }

  return UlidModel as TBase & Constructor<UlidFields>;
}

export const UlidMixin = ulidMixin;
