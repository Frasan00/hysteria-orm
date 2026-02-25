import { Model } from "../model";
import type { AnyConstructor, Constructor } from "./types";
import { column } from "../decorators/model_decorators";
import type { ColumnOptions } from "../decorators/model_decorators_types";

export interface BigIntFields {
  id: number;
}

type BigIntOptions = Parameters<(typeof column)["bigIncrement"]>[0];

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
export function bigIntMixin(
  options?: BigIntOptions,
): typeof Model & Constructor<BigIntFields>;
export function bigIntMixin<TBase extends AnyConstructor>(
  Base: TBase,
  options?: BigIntOptions,
): TBase & Constructor<BigIntFields>;
export function bigIntMixin<TBase extends AnyConstructor>(
  BaseOrOptions?: TBase | BigIntOptions,
  maybeOptions?: BigIntOptions,
): TBase & Constructor<BigIntFields> {
  const isBase = (v: unknown): v is AnyConstructor => typeof v === "function";
  const BaseClass = isBase(BaseOrOptions) ? BaseOrOptions : Model;
  const opts = isBase(BaseOrOptions)
    ? maybeOptions
    : (BaseOrOptions as BigIntOptions | undefined);

  class BigIntModel extends (BaseClass as AnyConstructor) {
    declare id: number;

    static {
      (this as unknown as typeof Model).column("id", {
        openApi: {
          type: "number",
          required: true,
        },
        ...opts,
        primaryKey: true,
      } as ColumnOptions);
    }
  }

  return BigIntModel as TBase & Constructor<BigIntFields>;
}

export const BigIntMixin = bigIntMixin;
