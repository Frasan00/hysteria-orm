import { Model } from "../model";
import type { AnyConstructor, Constructor } from "./types";

export interface UuidFields {
  id: string;
}

/**
 * Mixin to add a UUID primary key column.
 * Automatically generates UUID if not provided.
 *
 * @example
 * ```ts
 * class User extends uuidMixin() {
 *   declare name: string;
 * }
 *
 * // Composable with other mixins
 * class Post extends timestampMixin(uuidMixin()) {}
 * ```
 */
export function uuidMixin(): typeof Model & Constructor<UuidFields>;
export function uuidMixin<TBase extends AnyConstructor>(
  Base: TBase,
): TBase & Constructor<UuidFields>;
export function uuidMixin<TBase extends AnyConstructor>(
  Base?: TBase,
): TBase & Constructor<UuidFields> {
  const BaseClass = Base ?? Model;

  class UuidModel extends (BaseClass as AnyConstructor) {
    declare id: string;

    static {
      Model.column("id", {
        primaryKey: true,
        type: "uuid",
        openApi: {
          type: "string",
          format: "uuid",
          required: true,
        },
      });
    }
  }

  return UuidModel as TBase & Constructor<UuidFields>;
}

export const UuidMixin = uuidMixin;
