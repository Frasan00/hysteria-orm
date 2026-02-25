import { Model } from "../model";
import type { AnyConstructor, Constructor } from "./types";
import { column } from "../decorators/model_decorators";
import type { ColumnOptions } from "../decorators/model_decorators_types";

export interface UlidFields {
  id: string;
}

type UlidOptions = Parameters<(typeof column)["ulid"]>[0];

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
export function ulidMixin(
  options?: UlidOptions,
): typeof Model & Constructor<UlidFields>;
export function ulidMixin<TBase extends AnyConstructor>(
  Base: TBase,
  options?: UlidOptions,
): TBase & Constructor<UlidFields>;
export function ulidMixin<TBase extends AnyConstructor>(
  BaseOrOptions?: TBase | UlidOptions,
  maybeOptions?: UlidOptions,
): TBase & Constructor<UlidFields> {
  const isBase = (v: unknown): v is AnyConstructor => typeof v === "function";
  const BaseClass = isBase(BaseOrOptions) ? BaseOrOptions : Model;
  const opts = isBase(BaseOrOptions)
    ? maybeOptions
    : (BaseOrOptions as UlidOptions | undefined);

  class UlidModel extends (BaseClass as AnyConstructor) {
    declare id: string;

    static {
      (this as unknown as typeof Model).ulidColumn("id", {
        type: "ulid",
        openApi: {
          type: "string",
          format: "ulid",
          required: true,
        },
        ...opts,
        primaryKey: true,
      } as ColumnOptions);
    }
  }

  return UlidModel as TBase & Constructor<UlidFields>;
}

export const UlidMixin = ulidMixin;
