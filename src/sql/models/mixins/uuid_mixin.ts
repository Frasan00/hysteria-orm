import { Model } from "../model";
import type { AnyConstructor, Constructor } from "./types";
import { column } from "../decorators/model_decorators";
import type { ColumnOptions } from "../decorators/model_decorators_types";

export interface UuidFields {
  id: string;
}

type UuidOptions = Parameters<(typeof column)["uuid"]>[0];

/**
 * Mixin to add a UUID primary key column.
 * Automatically generates UUID if not provided.
 *
 * @example
 * ```ts
 * class User extends uuidMixin() {
 *   declare name: string;
 * }

 * // Composable with other mixins
 * class Post extends timestampMixin(uuidMixin()) {}
 * ```
 */
export function uuidMixin(
  options?: UuidOptions,
): typeof Model & Constructor<UuidFields>;
export function uuidMixin<TBase extends AnyConstructor>(
  Base: TBase,
  options?: UuidOptions,
): TBase & Constructor<UuidFields>;
export function uuidMixin<TBase extends AnyConstructor>(
  BaseOrOptions?: TBase | UuidOptions,
  maybeOptions?: UuidOptions,
): TBase & Constructor<UuidFields> {
  const isBase = (v: unknown): v is AnyConstructor => typeof v === "function";
  const BaseClass = isBase(BaseOrOptions) ? BaseOrOptions : Model;
  const opts = isBase(BaseOrOptions)
    ? maybeOptions
    : (BaseOrOptions as UuidOptions | undefined);

  class UuidModel extends (BaseClass as AnyConstructor) {
    declare id: string;

    static {
      (this as unknown as typeof Model).uuidColumn("id", {
        type: "uuid",
        openApi: {
          type: "string",
          format: "uuid",
          required: true,
        },
        ...opts,
        primaryKey: true,
      } as ColumnOptions);
    }
  }

  return UuidModel as TBase & Constructor<UuidFields>;
}

export const UuidMixin = uuidMixin;
