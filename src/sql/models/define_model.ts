import {
  belongsTo,
  check,
  column,
  hasMany,
  hasOne,
  index,
  manyToMany,
  unique,
} from "./decorators/model_decorators";
import type { BaseModelRelationType } from "./decorators/model_decorators";
import type {
  AsymmetricEncryptionOptions,
  ColumnOptions,
  DateColumnOptions,
  DatetimeColumnOptions,
  ManyToManyOptions,
  ManyToManyStringOptions,
  SymmetricEncryptionOptions,
  ThroughModel,
} from "./decorators/model_decorators_types";
import { Model } from "./model";
import type {
  CheckDefinition,
  ColNamespace,
  ColumnDef,
  DefinedModel,
  IndexDefinition,
  ModelDefinition,
  RelationConstraintOptions,
  RelationDef,
  RelNamespace,
  UniqueDefinition,
} from "./define_model_types";

// ---------------------------------------------------------------------------
// Internal helper – creates a ColumnDef wrapping a decorator apply function
// ---------------------------------------------------------------------------

function makeColumnDef<T>(
  apply: (target: Object, propertyKey: string) => void,
): ColumnDef<T> {
  return {
    _phantom: undefined as unknown as T,
    _apply: apply,
  };
}

function makeRelationDef<T>(
  apply: (target: Object, propertyKey: string) => void,
): RelationDef<T> {
  return {
    _phantom: undefined as unknown as T,
    _apply: apply,
  };
}

// ---------------------------------------------------------------------------
// col – column descriptor namespace
// ---------------------------------------------------------------------------

function colBase(options: ColumnOptions = {}): ColumnDef<any> {
  return makeColumnDef((target, key) => {
    column(options)(target, key);
  });
}

colBase.primary = function colPrimary(
  options: Omit<ColumnOptions, "primaryKey"> = {},
): ColumnDef<any> {
  return makeColumnDef((target, key) => {
    column.primary(options)(target, key);
  });
};

colBase.string = function colString(
  options: Omit<ColumnOptions, "type"> & { length?: number } = {},
): ColumnDef<string | null | undefined> {
  return makeColumnDef((target, key) => {
    column.string(options)(target as any, key);
  });
};

colBase.text = function colText(
  options: Omit<ColumnOptions, "type"> = {},
): ColumnDef<string | null | undefined> {
  return makeColumnDef((target, key) => {
    column.text(options)(target as any, key);
  });
};

colBase.integer = function colInteger(
  options: Omit<ColumnOptions, "serialize"> = {},
): ColumnDef<number | null | undefined> {
  return makeColumnDef((target, key) => {
    column.integer(options)(target as any, key);
  });
};

colBase.bigInteger = function colBigInteger(
  options: Omit<ColumnOptions, "serialize"> = {},
): ColumnDef<number | bigint | null | undefined> {
  return makeColumnDef((target, key) => {
    column.bigInteger(options)(target as any, key);
  });
};

colBase.float = function colFloat(
  options: Omit<ColumnOptions, "serialize"> = {},
): ColumnDef<number | null | undefined> {
  return makeColumnDef((target, key) => {
    column.float(options)(target as any, key);
  });
};

colBase.decimal = function colDecimal(
  options: Omit<ColumnOptions, "serialize"> & {
    precision?: number;
    scale?: number;
  } = {},
): ColumnDef<number | null | undefined> {
  return makeColumnDef((target, key) => {
    column.decimal(options)(target as any, key);
  });
};

colBase.increment = function colIncrement(
  options: Omit<ColumnOptions, "serialize" | "primaryKey" | "nullable"> = {},
): ColumnDef<number | null | undefined> {
  return makeColumnDef((target, key) => {
    column.increment(options)(target as any, key);
  });
};

colBase.bigIncrement = function colBigIncrement(
  options: Omit<ColumnOptions, "serialize" | "primaryKey" | "nullable"> = {},
): ColumnDef<number | null | undefined> {
  return makeColumnDef((target, key) => {
    column.bigIncrement(options)(target as any, key);
  });
};

colBase.boolean = function colBoolean(
  options: Omit<ColumnOptions, "prepare" | "serialize"> = {},
): ColumnDef<boolean | null | undefined> {
  return makeColumnDef((target, key) => {
    column.boolean(options)(target as any, key);
  });
};

colBase.date = function colDate(
  options: Omit<DateColumnOptions, "format"> = {},
): ColumnDef<Date | string | null | undefined> {
  return makeColumnDef((target, key) => {
    column.date(options)(target as any, key);
  });
};

colBase.datetime = function colDatetime(
  options: DatetimeColumnOptions = {},
): ColumnDef<Date | string | null | undefined> {
  return makeColumnDef((target, key) => {
    column.datetime(options)(target as any, key);
  });
};

colBase.timestamp = function colTimestamp(
  options: DatetimeColumnOptions = {},
): ColumnDef<Date | string | null | undefined> {
  return makeColumnDef((target, key) => {
    column.timestamp(options)(target as any, key);
  });
};

colBase.time = function colTime(
  options: Omit<DateColumnOptions, "format"> = {},
): ColumnDef<Date | string | null | undefined> {
  return makeColumnDef((target, key) => {
    column.time(options)(target as any, key);
  });
};

colBase.json = function colJson(
  options: Omit<ColumnOptions, "prepare" | "serialize"> = {},
): ColumnDef<unknown> {
  return makeColumnDef((target, key) => {
    column.json(options)(target as any, key);
  });
};

colBase.uuid = function colUuid(
  options: Omit<ColumnOptions, "prepare"> = {},
): ColumnDef<string | null | undefined> {
  return makeColumnDef((target, key) => {
    column.uuid(options)(target as any, key);
  });
};

colBase.ulid = function colUlid(
  options: Omit<ColumnOptions, "prepare"> = {},
): ColumnDef<string | null | undefined> {
  return makeColumnDef((target, key) => {
    column.ulid(options)(target as any, key);
  });
};

colBase.binary = function colBinary(
  options: Omit<ColumnOptions, "type"> = {},
): ColumnDef<Buffer | Uint8Array | string | null | undefined> {
  return makeColumnDef((target, key) => {
    column.binary(options)(target as any, key);
  });
};

colBase.enum = function colEnum<const V extends readonly string[]>(
  values: V,
  options: Omit<ColumnOptions, "type"> = {},
): ColumnDef<V[number] | null | undefined> {
  return makeColumnDef((target, key) => {
    column.enum(values, options)(target as any, key);
  });
};

colBase.encryption = {
  symmetric(
    options: Omit<SymmetricEncryptionOptions, "prepare" | "serialize">,
  ): ColumnDef<string | null | undefined> {
    return makeColumnDef((target, key) => {
      column.encryption.symmetric(options)(target as any, key);
    });
  },
  asymmetric(
    options: Omit<AsymmetricEncryptionOptions, "prepare" | "serialize">,
  ): ColumnDef<string | null | undefined> {
    return makeColumnDef((target, key) => {
      column.encryption.asymmetric(options)(target as any, key);
    });
  },
};

export const col: ColNamespace = colBase as ColNamespace;

// ---------------------------------------------------------------------------
// rel – relation descriptor namespace
// ---------------------------------------------------------------------------

type AnyModelClass = abstract new (...args: any[]) => Model;

export const rel: RelNamespace = {
  hasOne<M extends AnyModelClass>(
    model: () => M,
    foreignKey?: string,
  ): RelationDef<InstanceType<M> | null | undefined> {
    return makeRelationDef((target, key) => {
      hasOne(model as unknown as () => typeof Model, foreignKey)(
        target as any,
        key,
      );
    });
  },

  hasMany<M extends AnyModelClass>(
    model: () => M,
    foreignKey?: string,
  ): RelationDef<InstanceType<M>[] | null | undefined> {
    return makeRelationDef((target, key) => {
      hasMany(model as unknown as () => typeof Model, foreignKey)(
        target as any,
        key,
      );
    });
  },

  belongsTo<M extends AnyModelClass>(
    model: () => M,
    foreignKey?: string,
    options?: RelationConstraintOptions,
  ): RelationDef<InstanceType<M> | null | undefined> {
    return makeRelationDef((target, key) => {
      belongsTo(
        model as unknown as () => typeof Model,
        foreignKey,
        options as BaseModelRelationType,
      )(target as any, key);
    });
  },

  manyToMany<
    M extends AnyModelClass,
    T extends typeof Model = typeof Model,
    TM extends ThroughModel<T> = ThroughModel<T>,
  >(
    model: () => M,
    throughModel: TM,
    throughModelKeys?: TM extends string
      ? ManyToManyStringOptions
      : ManyToManyOptions<T, TM>,
    options?: RelationConstraintOptions,
  ): RelationDef<InstanceType<M>[] | null | undefined> {
    return makeRelationDef((target, key) => {
      manyToMany(
        model as unknown as () => typeof Model,
        throughModel as string | (() => typeof Model),
        throughModelKeys as ManyToManyStringOptions,
        options as BaseModelRelationType,
      )(target as any, key);
    });
  },
};

// ---------------------------------------------------------------------------
// defineModel
// ---------------------------------------------------------------------------

/**
 * Creates a fully-typed Model subclass programmatically without decorators.
 *
 * The returned class is a real `typeof Model` subclass that works with all
 * existing infrastructure: `SqlDataSource`, `ModelManager`, `ModelQueryBuilder`,
 * `SchemaDiff` (automatic migrations), hooks, etc.
 *
 * @example
 * ```typescript
 * import { defineModel, col, rel } from "hysteria-orm";
 *
 * const User = defineModel("users", {
 *   columns: {
 *     id: col.increment(),
 *     name: col.string(),
 *     email: col.string({ nullable: false }),
 *     isActive: col.boolean(),
 *     createdAt: col.datetime({ autoCreate: true }),
 *     updatedAt: col.datetime({ autoCreate: true, autoUpdate: true }),
 *   },
 *   relations: {
 *     posts: rel.hasMany(() => Post, "userId"),
 *     profile: rel.hasOne(() => Profile),
 *   },
 *   indexes: [["email"]],
 *   uniques: [["email"]],
 *   hooks: {
 *     beforeFetch(qb) { qb.whereNull("deleted_at"); },
 *   },
 * });
 * ```
 */
export function defineModel<
  C extends Record<string, ColumnDef>,
  R extends Record<string, RelationDef> = {},
>(table: string, definition: ModelDefinition<C, R>): DefinedModel<C, R> {
  const { columns, relations, indexes, uniques, checks, hooks, options } =
    definition;

  // 1. Create the anonymous Model subclass
  class DefinedModelClass extends Model {}

  // 2. Set the table name
  DefinedModelClass.table = table;

  // 3. Apply options
  if (options?.modelCaseConvention) {
    DefinedModelClass.modelCaseConvention = options.modelCaseConvention;
  }
  if (options?.databaseCaseConvention) {
    DefinedModelClass.databaseCaseConvention = options.databaseCaseConvention;
  }
  if (options?.softDeleteColumn) {
    DefinedModelClass.softDeleteColumn = options.softDeleteColumn;
  }
  if (options?.softDeleteValue !== undefined) {
    DefinedModelClass.softDeleteValue = options.softDeleteValue;
  }

  // 4. Register columns
  for (const [columnName, colDef] of Object.entries(columns)) {
    colDef._apply(DefinedModelClass.prototype, columnName);
  }

  // 5. Register relations
  if (relations) {
    for (const [relationName, relDef] of Object.entries(relations)) {
      relDef._apply(DefinedModelClass.prototype, relationName);
    }
  }

  // 6. Register indexes
  if (indexes) {
    for (const indexDef of indexes) {
      applyIndex(DefinedModelClass, indexDef);
    }
  }

  // 7. Register uniques
  if (uniques) {
    for (const uniqueDef of uniques) {
      applyUnique(DefinedModelClass, uniqueDef);
    }
  }

  // 8. Register checks
  if (checks) {
    for (const checkDef of checks) {
      applyCheck(DefinedModelClass, checkDef);
    }
  }

  // 9. Attach hooks
  if (hooks) {
    if (hooks.beforeFetch) {
      DefinedModelClass.beforeFetch = hooks.beforeFetch;
    }
    if (hooks.afterFetch) {
      DefinedModelClass.afterFetch = hooks.afterFetch;
    }
    if (hooks.beforeInsert) {
      DefinedModelClass.beforeInsert = hooks.beforeInsert;
    }
    if (hooks.beforeInsertMany) {
      DefinedModelClass.beforeInsertMany = hooks.beforeInsertMany;
    }
    if (hooks.beforeUpdate) {
      DefinedModelClass.beforeUpdate = hooks.beforeUpdate;
    }
    if (hooks.beforeDelete) {
      DefinedModelClass.beforeDelete = hooks.beforeDelete;
    }
  }

  return DefinedModelClass as unknown as DefinedModel<C, R>;
}

// ---------------------------------------------------------------------------
// Internal helpers for class-level decorators
// ---------------------------------------------------------------------------

function applyIndex(target: typeof Model, def: IndexDefinition): void {
  if (Array.isArray(def)) {
    index(def)(target as unknown as Function);
  } else {
    index(def.columns, def.name)(target as unknown as Function);
  }
}

function applyUnique(target: typeof Model, def: UniqueDefinition): void {
  if (Array.isArray(def)) {
    unique(def)(target as unknown as Function);
  } else {
    unique(def.columns, def.name)(target as unknown as Function);
  }
}

function applyCheck(target: typeof Model, def: CheckDefinition): void {
  if (typeof def === "string") {
    check(def)(target as unknown as Function);
  } else {
    check(def.expression, def.name)(target as unknown as Function);
  }
}
