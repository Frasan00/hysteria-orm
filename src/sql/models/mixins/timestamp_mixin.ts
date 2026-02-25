import { Model } from "../model";
import type { AnyConstructor, Constructor } from "./types";
import { column } from "../decorators/model_decorators";

export interface TimestampFields {
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

type DatetimeOptions = Parameters<(typeof column)["datetime"]>[0];

type TimestampOptions = {
  createdAt?: DatetimeOptions;
  updatedAt?: DatetimeOptions;
  deletedAt?: DatetimeOptions;
};

/**
 * Mixin to add timestamp columns for tracking record creation and updates.
 * Adds createdAt, updatedAt, and deletedAt columns.
 * - createdAt: Auto-set on record creation
 * - updatedAt: Auto-set on creation and updates
 * - deletedAt: Nullable, for soft deletes
 *
 * @example
 * ```ts
 * class User extends timestampMixin() {
 *   declare name: string;
 * }
 *
 * // Composable with other mixins
 * class Post extends timestampMixin(uuidMixin()) {}
 *
 * // With per-column options
 * class Post extends timestampMixin(uuidMixin(), { createdAt: { nullable: true } }) {}
 * ```
 */
export function timestampMixin(
  options?: TimestampOptions,
): typeof Model & Constructor<TimestampFields>;
export function timestampMixin<TBase extends AnyConstructor>(
  Base: TBase,
  options?: TimestampOptions,
): TBase & Constructor<TimestampFields>;
export function timestampMixin<TBase extends AnyConstructor>(
  BaseOrOptions?: TBase | TimestampOptions,
  maybeOptions?: TimestampOptions,
): TBase & Constructor<TimestampFields> {
  const isBase = (v: unknown): v is AnyConstructor => typeof v === "function";
  const BaseClass = isBase(BaseOrOptions) ? BaseOrOptions : Model;
  const opts = isBase(BaseOrOptions)
    ? maybeOptions
    : (BaseOrOptions as TimestampOptions | undefined);

  class TimestampModel extends (BaseClass as AnyConstructor) {
    declare createdAt: Date;
    declare updatedAt: Date;
    declare deletedAt: Date | null;

    static {
      Model.datetimeColumn("createdAt", {
        type: "datetime",
        autoCreate: true,
        openApi: {
          type: "string",
          format: "date-time",
          required: true,
        },
        ...opts?.createdAt,
      });

      Model.datetimeColumn("updatedAt", {
        autoUpdate: true,
        openApi: {
          type: "string",
          format: "date-time",
          required: true,
        },
        ...opts?.updatedAt,
      });

      Model.datetimeColumn("deletedAt", {
        nullable: true,
        openApi: {
          type: "string",
          format: "date-time",
          required: false,
        },
        ...opts?.deletedAt,
      });
    }
  }

  return TimestampModel as TBase & Constructor<TimestampFields>;
}

export const TimestampMixin = timestampMixin;
