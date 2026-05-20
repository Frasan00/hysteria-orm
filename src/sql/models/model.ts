import type { z } from "zod";
import type { ModelQueryBuilder } from "./model_query_builder/model_query_builder";
import type { ModelWithoutRelations } from "./model_types";
import { Entity } from "../../entity";
import { baseSoftDeleteDate } from "../../utils/date_utils";
import {
  getChecks,
  getIndexes,
  getModelColumns,
  getPrimaryKey,
  getRelationsMetadata,
  getUniques,
} from "./decorators/model_decorators";
import {
  CheckType,
  ColumnType,
  IndexType,
  LazyRelationType,
  UniqueType,
} from "./decorators/model_decorators_types";
import { ModelColumnCache } from "./model_column_cache";
import { ValidationError } from "../../errors/hysteria_error";

/**
 * @description Represents a Table in the Database
 * @internal Base class for models created via `defineModel`. Not meant for direct use.
 */
export abstract class Model<T extends Model<T> = any> extends Entity {
  declare private "*": string;

  /**
   * @description The zod instance to use for creating zod schemas, if not set, toZodSchema will throw an error
   */
  static zodEngine: typeof z | null = null;

  /**
   * @description The column used to soft delete a record, default is deletedAt
   */
  static softDeleteColumn: string = "deletedAt";

  /**
   * @description The value used to soft delete a record, default is the current date and time
   * @default format: "YYYY-MM-DD HH:mm:ss" in UTC timezone
   */
  static softDeleteValue: boolean | string = baseSoftDeleteDate();

  /**
   * @description Getter for the table name of the model.
   * With defineModel, the table is always set explicitly.
   */
  static get table(): string {
    const descriptor = Object.getOwnPropertyDescriptor(this, "table");
    if (descriptor && "value" in descriptor) {
      return descriptor.value;
    }

    throw new Error(
      `Table name not set for model "${this.name}". Use defineModel() to create models.`,
    );
  }

  /**
   * @description Setter for the table name of the model
   */
  static set table(value: string) {
    Object.defineProperty(this, "table", {
      value,
      writable: true,
      enumerable: true,
      configurable: true,
    });
  }

  /**
   * @description Getter for the primary key of the model
   */
  static get primaryKey(): string | undefined {
    return getPrimaryKey(this);
  }

  constructor(initialData?: Partial<ModelWithoutRelations<T>>) {
    super();
    if (initialData) {
      for (const key in initialData) {
        Object.assign(this, { [key]: (initialData as any)[key] });
      }
    }
  }

  // #region Lifecycle hooks

  static beforeFetch?(
    queryBuilder: ModelQueryBuilder<any>,
  ): Promise<void> | void;

  static beforeInsert?(data: any): Promise<void> | void;

  static beforeInsertMany?(data: any[]): Promise<void> | void;

  static beforeUpdate?(
    queryBuilder: ModelQueryBuilder<any>,
  ): Promise<void> | void;

  static beforeDelete?(
    queryBuilder: ModelQueryBuilder<any>,
  ): Promise<void> | void;

  static afterFetch?(data: any[]): Promise<any[]> | any[];

  // #endregion Lifecycle hooks

  static getColumns(): ColumnType[] {
    let cached = ModelColumnCache.columns.get(this);
    if (!cached) {
      cached = getModelColumns(this);
      ModelColumnCache.columns.set(this, cached);
    }
    return cached;
  }

  /**
   * @description Returns a cached Map of model column name → ColumnType for O(1) lookup.
   * Computed once per model class and reused across all queries.
   */
  static getColumnsByName(): Map<string, ColumnType> {
    let cached = ModelColumnCache.byName.get(this);
    if (!cached) {
      cached = new Map(this.getColumns().map((col) => [col.columnName, col]));
      ModelColumnCache.byName.set(this, cached);
    }
    return cached;
  }

  /**
   * @description Returns a cached Map of database column name → ColumnType for O(1) lookup.
   * Computed once per model class and reused across all queries.
   */
  static getColumnsByDatabaseName(): Map<string, ColumnType> {
    let cached = ModelColumnCache.byDatabaseName.get(this);
    if (!cached) {
      cached = new Map(this.getColumns().map((col) => [col.databaseName, col]));
      ModelColumnCache.byDatabaseName.set(this, cached);
    }
    return cached;
  }

  static getRelations(): LazyRelationType[] {
    return getRelationsMetadata(this);
  }

  static getIndexes(): IndexType[] {
    return getIndexes(this);
  }

  static getUniques(): UniqueType[] {
    return getUniques(this);
  }

  static getChecks(): CheckType[] {
    return getChecks(this);
  }

  static async validate(
    data: any,
  ): Promise<{ valid: boolean; errors?: Record<string, string[]> }> {
    const columns = this.getColumns();
    const errors: Record<string, string[]> = {};
    const primaryKey = this.primaryKey;
    const operation: "insert" | "update" =
      primaryKey && data?.[primaryKey] !== undefined ? "update" : "insert";

    for (const col of columns) {
      const validators = col.validate;
      if (!validators) continue;
      const value = data ? data[col.columnName] : undefined;
      const vList = Array.isArray(validators) ? validators : [validators];
      for (const v of vList) {
        try {
          const res = await v(value, {
            model: this,
            column: col.columnName,
            operation,
            data,
          });
          if (!(res && res.valid)) {
            const msg = (res && res.message) || "Validation failed";
            (errors[col.columnName] ||= []).push(msg);
          }
        } catch {
          (errors[col.columnName] ||= []).push("Validation error");
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError(errors);
    }
    return { valid: true };
  }
}
