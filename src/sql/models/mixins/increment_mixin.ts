import { Model } from "../model";
import type { AnyConstructor, Constructor } from "./types";
import { column } from "../decorators/model_decorators";
import type { ColumnOptions } from "../decorators/model_decorators_types";

export interface IncrementFields {
  id: number;
}

type IncrementOptions = Parameters<(typeof column)["increment"]>[0];

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
export function incrementMixin(
  options?: IncrementOptions,
): typeof Model & Constructor<IncrementFields>;
export function incrementMixin<TBase extends AnyConstructor>(
  Base: TBase,
  options?: IncrementOptions,
): TBase & Constructor<IncrementFields>;
export function incrementMixin<TBase extends AnyConstructor>(
  BaseOrOptions?: TBase | IncrementOptions,
  maybeOptions?: IncrementOptions,
): TBase & Constructor<IncrementFields> {
  const isBase = (v: unknown): v is AnyConstructor => typeof v === "function";
  const BaseClass = isBase(BaseOrOptions) ? BaseOrOptions : Model;
  const opts = isBase(BaseOrOptions)
    ? maybeOptions
    : (BaseOrOptions as IncrementOptions | undefined);

  class IncrementModel extends (BaseClass as AnyConstructor) {
    declare id: number;

    static {
      Model.column("id", {
        type: "increment",
        openApi: {
          type: "number",
          required: true,
        },
        ...opts,
        primaryKey: true,
      } as ColumnOptions);
    }
  }

  return IncrementModel as TBase & Constructor<IncrementFields>;
}

export const IncrementMixin = incrementMixin;
