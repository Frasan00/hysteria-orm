import { Model } from "../model";
import type { AnyConstructor, Constructor } from "./types";

export interface IncrementFields {
  id: number;
}

/**
 * Mixin to add an auto-incrementing integer primary key column.
 *
 * @example
 * ```ts
 * class User extends incrementMixin() {
 *   declare name: string;
 * }
 *
 * // Composable with other mixins
 * class Post extends timestampMixin(incrementMixin()) {}
 * ```
 */
export function incrementMixin(): typeof Model & Constructor<IncrementFields>;
export function incrementMixin<TBase extends AnyConstructor>(
  Base: TBase,
): TBase & Constructor<IncrementFields>;
export function incrementMixin<TBase extends AnyConstructor>(
  Base?: TBase,
): TBase & Constructor<IncrementFields> {
  const BaseClass = Base ?? Model;

  class IncrementModel extends (BaseClass as AnyConstructor) {
    declare id: number;

    static {
      Model.column("id", {
        type: "increment",
        primaryKey: true,
        openApi: {
          type: "number",
          required: true,
        },
      });
    }
  }

  return IncrementModel as TBase & Constructor<IncrementFields>;
}

export const IncrementMixin = incrementMixin;
