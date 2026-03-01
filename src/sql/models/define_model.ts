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
  ColumnOptions,
  ManyToManyStringOptions,
  ThroughModel,
} from "./decorators/model_decorators_types";
import type { AnyModelConstructor } from "./define_model_types";
import { Model } from "./model";
import type {
  CheckDefinition,
  ColAsymmetricOptions,
  ColBigIncrementOptions,
  ColBigIntegerOptions,
  ColBinaryOptions,
  ColBooleanOptions,
  ColDateOptions,
  ColDatetimeOptions,
  ColDecimalOptions,
  ColEnumOptions,
  ColFloatOptions,
  ColJsonOptions,
  ColIncrementOptions,
  ColIntegerOptions,
  ColNamespace,
  ColOptions,
  ColPrimaryOptions,
  ColStringOptions,
  ColSymmetricOptions,
  ColTextOptions,
  ColTimeOptions,
  ColTimestampOptions,
  ColUlidOptions,
  ColUuidOptions,
  ColumnDef,
  DefinedModel,
  IndexDefinition,
  ModelDefinition,
  NullableColumn,
  RelationConstraintOptions,
  RelationDef,
  RelationNullableOption,
  RelNamespace,
  TypedPrepare,
  TypedSerialize,
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

function colBase<T = unknown>(
  options: ColOptions & TypedSerialize<T> & TypedPrepare<T> = {} as any,
): ColumnDef<T> {
  return makeColumnDef((target, key) => {
    column(options as ColumnOptions)(target, key);
  });
}

colBase.primary = function colPrimary<T = string | number>(
  options: ColPrimaryOptions & TypedSerialize<T> & TypedPrepare<T> = {} as any,
): ColumnDef<T> {
  return makeColumnDef((target, key) => {
    column.primary(options as any)(target, key);
  });
};

colBase.string = function colString<
  O extends ColStringOptions = ColStringOptions,
>(
  options?: O &
    TypedSerialize<NullableColumn<string, O>> &
    TypedPrepare<NullableColumn<string, O>>,
): ColumnDef<NullableColumn<string, O>> {
  return makeColumnDef((target, key) => {
    column.string((options ?? {}) as any)(target as any, key);
  });
};

colBase.text = function colText<O extends ColTextOptions = ColTextOptions>(
  options?: O &
    TypedSerialize<NullableColumn<string, O>> &
    TypedPrepare<NullableColumn<string, O>>,
): ColumnDef<NullableColumn<string, O>> {
  return makeColumnDef((target, key) => {
    column.text((options ?? {}) as any)(target as any, key);
  });
};

colBase.integer = function colInteger<
  O extends ColIntegerOptions = ColIntegerOptions,
>(
  options?: O & TypedPrepare<NullableColumn<number, O>>,
): ColumnDef<NullableColumn<number, O>> {
  return makeColumnDef((target, key) => {
    column.integer((options ?? {}) as any)(target as any, key);
  });
};

colBase.bigInteger = function colBigInteger<
  O extends ColBigIntegerOptions = ColBigIntegerOptions,
>(
  options?: O & TypedPrepare<NullableColumn<number, O>>,
): ColumnDef<NullableColumn<number, O>> {
  return makeColumnDef((target, key) => {
    column.bigInteger((options ?? {}) as any)(target as any, key);
  });
};

colBase.float = function colFloat<O extends ColFloatOptions = ColFloatOptions>(
  options?: O & TypedPrepare<NullableColumn<number, O>>,
): ColumnDef<NullableColumn<number, O>> {
  return makeColumnDef((target, key) => {
    column.float((options ?? {}) as any)(target as any, key);
  });
};

colBase.decimal = function colDecimal<
  O extends ColDecimalOptions = ColDecimalOptions,
>(
  options?: O & TypedPrepare<NullableColumn<number, O>>,
): ColumnDef<NullableColumn<number, O>> {
  return makeColumnDef((target, key) => {
    column.decimal((options ?? {}) as any)(target as any, key);
  });
};

colBase.increment = function colIncrement(
  options: ColIncrementOptions & TypedPrepare<number> = {} as any,
): ColumnDef<number> {
  return makeColumnDef((target, key) => {
    column.increment(options as any)(target as any, key);
  });
};

colBase.bigIncrement = function colBigIncrement(
  options: ColBigIncrementOptions & TypedPrepare<number> = {} as any,
): ColumnDef<number> {
  return makeColumnDef((target, key) => {
    column.bigIncrement(options as any)(target as any, key);
  });
};

colBase.boolean = function colBoolean<
  O extends ColBooleanOptions = ColBooleanOptions,
>(options?: O): ColumnDef<NullableColumn<boolean, O>> {
  return makeColumnDef((target, key) => {
    column.boolean((options ?? {}) as any)(target as any, key);
  });
};

colBase.date = function colDate<T extends Date | string = Date>(
  options?: ColDateOptions,
): ColumnDef<T> {
  return makeColumnDef((target, key) => {
    column.date((options ?? {}) as any)(target as any, key);
  });
};

colBase.datetime = function colDatetime<T extends Date | string = Date>(
  options?: ColDatetimeOptions,
): ColumnDef<T> {
  return makeColumnDef((target, key) => {
    column.datetime((options ?? {}) as any)(target as any, key);
  });
};

colBase.timestamp = function colTimestamp<T extends Date | string = Date>(
  options?: ColTimestampOptions,
): ColumnDef<T> {
  return makeColumnDef((target, key) => {
    column.timestamp((options ?? {}) as any)(target as any, key);
  });
};

colBase.time = function colTime<T extends Date | string = Date>(
  options?: ColTimeOptions,
): ColumnDef<T> {
  return makeColumnDef((target, key) => {
    column.time((options ?? {}) as any)(target as any, key);
  });
};

colBase.json = function colJson<T = unknown>(
  options?: ColJsonOptions,
): ColumnDef<T> {
  return makeColumnDef((target, key) => {
    column.json((options ?? {}) as any)(target as any, key);
  });
};

colBase.uuid = function colUuid<O extends ColUuidOptions = ColUuidOptions>(
  options?: O & TypedSerialize<NullableColumn<string, O>>,
): ColumnDef<NullableColumn<string, O>> {
  return makeColumnDef((target, key) => {
    column.uuid((options ?? {}) as any)(target as any, key);
  });
};

colBase.ulid = function colUlid<O extends ColUlidOptions = ColUlidOptions>(
  options?: O & TypedSerialize<NullableColumn<string, O>>,
): ColumnDef<NullableColumn<string, O>> {
  return makeColumnDef((target, key) => {
    column.ulid((options ?? {}) as any)(target as any, key);
  });
};

colBase.binary = function colBinary<
  O extends ColBinaryOptions = ColBinaryOptions,
>(
  options?: O &
    TypedSerialize<NullableColumn<Buffer | Uint8Array | string, O>> &
    TypedPrepare<NullableColumn<Buffer | Uint8Array | string, O>>,
): ColumnDef<NullableColumn<Buffer | Uint8Array | string, O>> {
  return makeColumnDef((target, key) => {
    column.binary((options ?? {}) as any)(target as any, key);
  });
};

colBase.enum = function colEnum<
  const V extends readonly string[],
  O extends ColEnumOptions = ColEnumOptions,
>(
  values: V,
  options?: O &
    TypedSerialize<NullableColumn<V[number], O>> &
    TypedPrepare<NullableColumn<V[number], O>>,
): ColumnDef<NullableColumn<V[number], O>> {
  return makeColumnDef((target, key) => {
    column.enum(values, (options ?? {}) as any)(target as any, key);
  });
};

colBase.encryption = {
  symmetric<O extends ColSymmetricOptions = ColSymmetricOptions>(
    options: O,
  ): ColumnDef<NullableColumn<string, O>> {
    return makeColumnDef((target, key) => {
      column.encryption.symmetric(options)(target as any, key);
    });
  },
  asymmetric<O extends ColAsymmetricOptions = ColAsymmetricOptions>(
    options: O,
  ): ColumnDef<NullableColumn<string, O>> {
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
    model: (self: AnyModelClass) => M,
    foreignKey?: string,
    _options?: RelationNullableOption,
  ): RelationDef<InstanceType<M>> {
    return makeRelationDef((target, key) => {
      const resolvedModel = () => model(target.constructor as AnyModelClass);
      hasOne(resolvedModel as unknown as () => typeof Model, foreignKey)(
        target as any,
        key,
      );
    });
  },

  hasMany<M extends AnyModelClass>(
    model: (self: AnyModelClass) => M,
    foreignKey?: string,
    _options?: RelationNullableOption,
  ): RelationDef<InstanceType<M>[]> {
    return makeRelationDef((target, key) => {
      const resolvedModel = () => model(target.constructor as AnyModelClass);
      hasMany(resolvedModel as unknown as () => typeof Model, foreignKey)(
        target as any,
        key,
      );
    });
  },

  belongsTo<M extends AnyModelClass>(
    model: (self: AnyModelClass) => M,
    foreignKey?: string,
    options?: RelationConstraintOptions & RelationNullableOption,
  ): RelationDef<InstanceType<M>> {
    return makeRelationDef((target, key) => {
      const resolvedModel = () => model(target.constructor as AnyModelClass);
      belongsTo(
        resolvedModel as unknown as () => typeof Model,
        foreignKey,
        options as BaseModelRelationType,
      )(target as any, key);
    });
  },

  manyToMany<
    M extends AnyModelClass,
    T extends AnyModelConstructor = AnyModelConstructor,
    TM extends ThroughModel<T> = ThroughModel<T>,
  >(
    model: (self: AnyModelClass) => M,
    throughModel: TM,
    throughModelKeys?: TM extends string
      ? ManyToManyStringOptions
      : { leftForeignKey?: string; rightForeignKey?: string },
    options?: RelationConstraintOptions & RelationNullableOption,
  ): RelationDef<InstanceType<M>[]> {
    return makeRelationDef((target, key) => {
      const resolvedModel = () => model(target.constructor as AnyModelClass);
      manyToMany(
        resolvedModel as unknown as () => typeof Model,
        throughModel as string | (() => typeof Model),
        throughModelKeys as ManyToManyStringOptions,
        options as BaseModelRelationType,
      )(target as any, key);
    });
  },
} as RelNamespace;

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
