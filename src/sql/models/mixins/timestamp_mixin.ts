import { Model } from "../model";
import type { AnyConstructor, Constructor } from "./types";

export interface TimestampFields {
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

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
 * ```
 */
export function timestampMixin(): typeof Model & Constructor<TimestampFields>;
export function timestampMixin<TBase extends AnyConstructor>(
  Base: TBase,
): TBase & Constructor<TimestampFields>;
export function timestampMixin<TBase extends AnyConstructor>(
  Base?: TBase,
): TBase & Constructor<TimestampFields> {
  const BaseClass = Base ?? Model;

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
      });

      Model.datetimeColumn("updatedAt", {
        autoUpdate: true,
        openApi: {
          type: "string",
          format: "date-time",
          required: true,
        },
      });

      Model.datetimeColumn("deletedAt", {
        nullable: true,
        openApi: {
          type: "string",
          format: "date-time",
          required: false,
        },
      });
    }
  }

  return TimestampModel as TBase & Constructor<TimestampFields>;
}

export const TimestampMixin = timestampMixin;
