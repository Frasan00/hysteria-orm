import type { BaseModelRelationType } from "./decorators/model_decorators";
import {
  belongsTo as belongsToDecorator,
  check,
  column,
  hasMany as hasManyDecorator,
  hasOne as hasOneDecorator,
  manyToMany as manyToManyDecorator,
  index,
  unique,
  viewStatementKey,
} from "./decorators/model_decorators";
import type {
  ColumnOptions,
  ManyToManyStringOptions,
  ThroughModel,
} from "./decorators/model_decorators_types";
import type {
  AnyModelConstructor,
  CheckDefinition,
  ColAsymmetricOptions,
  ColBigIncrementOptions,
  ColBigIntegerOptions,
  ColBinaryOptions,
  ColBooleanOptions,
  ColCharOptions,
  ColDateOptions,
  ColDatetimeOptions,
  ColDecimalOptions,
  ColEnumOptions,
  ColFloatOptions,
  ColIncrementOptions,
  ColIntegerOptions,
  ColJsonOptions,
  ColJsonbOptions,
  ColMediumIntOptions,
  ColNamespace,
  ColOptions,
  ColPrimaryOptions,
  ColSmallIntOptions,
  ColStringOptions,
  ColSymmetricOptions,
  ColTextOptions,
  ColTimeOptions,
  ColTimestampOptions,
  ColTinyIntOptions,
  ColUlidOptions,
  ColumnDef,
  ColUuidOptions,
  ColVarbinaryOptions,
  CreateSchemaResult,
  DefinedModel,
  DefinedView,
  IndexDefinition,
  ModelDefinition,
  NullableColumn,
  RelationDefinitions,
  RelationHelpers,
  SchemaRelDef,
  TypedPrepare,
  TypedSerialize,
  UniqueDefinition,
  ViewDefinition,
} from "./define_model_types";
import { Model } from "./model";

// ---------------------------------------------------------------------------
// Reserved property names that cannot be used as column names.
// These are ORM-specific statics on Model that would break if overwritten.
// ---------------------------------------------------------------------------

const RESERVED_MODEL_PROPERTIES = new Set([
  // Core statics
  "table",
  "primaryKey",
  "softDeleteColumn",
  "softDeleteValue",
  "modelCaseConvention",
  "databaseCaseConvention",
  // Metadata accessors
  "getColumns",
  "getColumnsByName",
  "getColumnsByDatabaseName",
  "getRelations",
  "getIndexes",
  "getUniques",
  "getChecks",
  // Lifecycle hooks
  "beforeFetch",
  "afterFetch",
  "beforeInsert",
  "beforeInsertMany",
  "beforeUpdate",
  "beforeDelete",
  // Query / mutation (hidden from type but present at runtime)
  "query",
  "all",
  "first",
  "find",
  "findOneOrFail",
  "findOne",
  "findBy",
  "findOneBy",
  "findOneByPrimaryKey",
  "refresh",
  "sync",
  "insert",
  "insertMany",
  "updateRecord",
  "firstOrInsert",
  "upsert",
  "upsertMany",
  "deleteRecord",
  "save",
  "softDelete",
  "truncate",
  "sqlInstance",
  "getTableInfo",
  "getIndexInfo",
  "getTableSchema",
  // JS class essentials
  "prototype",
  "constructor",
]);

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

// ---------------------------------------------------------------------------
// col – column descriptor namespace
// ---------------------------------------------------------------------------

function colBase<T = unknown>(
  options: ColOptions & TypedSerialize<T> & TypedPrepare<T> = {},
): ColumnDef<T> {
  return makeColumnDef((target, key) => {
    column(options as ColumnOptions)(target, key);
  });
}

colBase.primary = function colPrimary<T = string | number>(
  options: ColPrimaryOptions & TypedSerialize<T> & TypedPrepare<T> = {},
): ColumnDef<T> {
  return makeColumnDef((target, key) => {
    column.primary(options)(target, key);
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
    column.string(options ?? {})(target as any, key);
  });
};

colBase.text = function colText<O extends ColTextOptions = ColTextOptions>(
  options?: O &
    TypedSerialize<NullableColumn<string, O>> &
    TypedPrepare<NullableColumn<string, O>>,
): ColumnDef<NullableColumn<string, O>> {
  return makeColumnDef((target, key) => {
    column.text(options ?? {})(target as any, key);
  });
};

colBase.integer = function colInteger<
  O extends ColIntegerOptions = ColIntegerOptions,
>(
  options?: O & TypedPrepare<NullableColumn<number, O>>,
): ColumnDef<NullableColumn<number, O>> {
  return makeColumnDef((target, key) => {
    column.integer(options ?? {})(target as any, key);
  });
};

colBase.bigInteger = function colBigInteger<
  O extends ColBigIntegerOptions = ColBigIntegerOptions,
>(
  options?: O & TypedPrepare<NullableColumn<number, O>>,
): ColumnDef<NullableColumn<number, O>> {
  return makeColumnDef((target, key) => {
    column.bigInteger(options ?? {})(target as any, key);
  });
};

colBase.float = function colFloat<O extends ColFloatOptions = ColFloatOptions>(
  options?: O & TypedPrepare<NullableColumn<number, O>>,
): ColumnDef<NullableColumn<number, O>> {
  return makeColumnDef((target, key) => {
    column.float(options ?? {})(target as any, key);
  });
};

colBase.decimal = function colDecimal<
  O extends ColDecimalOptions = ColDecimalOptions,
>(
  options?: O & TypedPrepare<NullableColumn<number, O>>,
): ColumnDef<NullableColumn<number, O>> {
  return makeColumnDef((target, key) => {
    column.decimal(options ?? {})(target as any, key);
  });
};

colBase.increment = function colIncrement(
  options: ColIncrementOptions & TypedPrepare<number> = {},
): ColumnDef<number> {
  return makeColumnDef((target, key) => {
    column.increment(options)(target as any, key);
  });
};

colBase.bigIncrement = function colBigIncrement(
  options: ColBigIncrementOptions & TypedPrepare<number> = {},
): ColumnDef<number> {
  return makeColumnDef((target, key) => {
    column.bigIncrement(options)(target as any, key);
  });
};

colBase.boolean = function colBoolean<
  O extends ColBooleanOptions = ColBooleanOptions,
>(options?: O): ColumnDef<NullableColumn<boolean, O>> {
  return makeColumnDef((target, key) => {
    column.boolean(options ?? {})(target as any, key);
  });
};

function colDateFn(options?: ColDateOptions): ColumnDef<any> {
  return makeColumnDef((target, key) => {
    column.date(options ?? {}, false)(target as any, key);
  });
}
colDateFn.string = function colDateString(
  options?: ColDateOptions,
): ColumnDef<any> {
  return makeColumnDef((target, key) => {
    column.date(options ?? {}, true)(target as any, key);
  });
};
colBase.date = colDateFn;

function colDatetimeFn(options?: ColDatetimeOptions): ColumnDef<any> {
  return makeColumnDef((target, key) => {
    column.datetime(options ?? {}, false)(target as any, key);
  });
}
colDatetimeFn.string = function colDatetimeString(
  options?: ColDatetimeOptions,
): ColumnDef<any> {
  return makeColumnDef((target, key) => {
    column.datetime(options ?? {}, true)(target as any, key);
  });
};
colBase.datetime = colDatetimeFn;

function colTimestampFn(options?: ColTimestampOptions): ColumnDef<any> {
  return makeColumnDef((target, key) => {
    column.timestamp(options ?? {}, false)(target as any, key);
  });
}
colTimestampFn.string = function colTimestampString(
  options?: ColTimestampOptions,
): ColumnDef<any> {
  return makeColumnDef((target, key) => {
    column.timestamp(options ?? {}, true)(target as any, key);
  });
};
colBase.timestamp = colTimestampFn;

function colTimeFn(options?: ColTimeOptions): ColumnDef<any> {
  return makeColumnDef((target, key) => {
    column.time(options ?? {}, false)(target as any, key);
  });
}
colTimeFn.string = function colTimeString(
  options?: ColTimeOptions,
): ColumnDef<any> {
  return makeColumnDef((target, key) => {
    column.time(options ?? {}, true)(target as any, key);
  });
};
colBase.time = colTimeFn;

colBase.json = function colJson<T = unknown>(
  options?: ColJsonOptions,
): ColumnDef<T> {
  return makeColumnDef((target, key) => {
    column.json({ type: "json" as any, ...(options ?? {}) })(
      target as any,
      key,
    );
  });
};

colBase.jsonb = function colJsonb<T = unknown>(
  options?: ColJsonbOptions,
): ColumnDef<T> {
  return makeColumnDef((target, key) => {
    column.json(options ?? {})(target as any, key);
  });
};

colBase.uuid = function colUuid<O extends ColUuidOptions = ColUuidOptions>(
  options?: O & TypedSerialize<NullableColumn<string, O>>,
): ColumnDef<NullableColumn<string, O>> {
  return makeColumnDef((target, key) => {
    column.uuid(options ?? {})(target as any, key);
  });
};

colBase.ulid = function colUlid<O extends ColUlidOptions = ColUlidOptions>(
  options?: O & TypedSerialize<NullableColumn<string, O>>,
): ColumnDef<NullableColumn<string, O>> {
  return makeColumnDef((target, key) => {
    column.ulid(options ?? {})(target as any, key);
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
    column.binary(options ?? {})(target as any, key);
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
    column.enum(values, options ?? {})(target as any, key);
  });
};

colBase.nativeEnum = function colNativeEnum<
  E extends Record<string, string | number>,
  O extends ColEnumOptions = ColEnumOptions,
>(
  enumObj: E,
  options?: O &
    TypedSerialize<NullableColumn<E[keyof E], O>> &
    TypedPrepare<NullableColumn<E[keyof E], O>>,
): ColumnDef<NullableColumn<E[keyof E], O>> {
  const values = Object.values(enumObj).filter(
    (v): v is string | number => typeof v === "string" || typeof v === "number",
  );
  const hasNumeric = values.some((v) => typeof v === "number");
  const enumValues = hasNumeric
    ? values
        .filter((v): v is number => typeof v === "number")
        .map((v) => String(v))
    : values.filter((v): v is string => typeof v === "string");

  return makeColumnDef((target, key) => {
    column.enum(enumValues as readonly string[], options ?? {})(
      target as any,
      key,
    );
  });
};

colBase.char = function colChar<O extends ColCharOptions = ColCharOptions>(
  options?: O &
    TypedSerialize<NullableColumn<string, O>> &
    TypedPrepare<NullableColumn<string, O>>,
): ColumnDef<NullableColumn<string, O>> {
  return makeColumnDef((target, key) => {
    column.string({ ...options, type: "char" } as any)(target as any, key);
  });
};

colBase.varbinary = function colVarbinary<
  O extends ColVarbinaryOptions = ColVarbinaryOptions,
>(
  options?: O &
    TypedSerialize<NullableColumn<Buffer | Uint8Array | string, O>> &
    TypedPrepare<NullableColumn<Buffer | Uint8Array | string, O>>,
): ColumnDef<NullableColumn<Buffer | Uint8Array | string, O>> {
  return makeColumnDef((target, key) => {
    column({ type: "varbinary", ...options } as any)(target as any, key);
  });
};

colBase.tinyint = function colTinyInt<
  O extends ColTinyIntOptions = ColTinyIntOptions,
>(
  options?: O & TypedPrepare<NullableColumn<number, O>>,
): ColumnDef<NullableColumn<number, O>> {
  return makeColumnDef((target, key) => {
    column.integer({ ...options, type: "tinyint" } as any)(target as any, key);
  });
};

colBase.smallint = function colSmallInt<
  O extends ColSmallIntOptions = ColSmallIntOptions,
>(
  options?: O & TypedPrepare<NullableColumn<number, O>>,
): ColumnDef<NullableColumn<number, O>> {
  return makeColumnDef((target, key) => {
    column.integer({ ...options, type: "smallint" } as any)(target as any, key);
  });
};

colBase.mediumint = function colMediumInt<
  O extends ColMediumIntOptions = ColMediumIntOptions,
>(
  options?: O & TypedPrepare<NullableColumn<number, O>>,
): ColumnDef<NullableColumn<number, O>> {
  return makeColumnDef((target, key) => {
    column.integer({ ...options, type: "mediumint" } as any)(
      target as any,
      key,
    );
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
// defineModel
// ---------------------------------------------------------------------------

/**
 * Creates a fully-typed Model subclass programmatically without decorators.
 *
 * The returned class is a real `typeof Model` subclass that works with all
 * existing infrastructure: `SqlDataSource`, `ModelManager`, `ModelQueryBuilder`,
 * `SchemaDiff` (automatic migrations), hooks, etc.
 *
 * Use `defineRelations` + `createSchema` to define relations between models.
 *
 * @example
 * ```typescript
 * import { defineModel, col } from "hysteria-orm";
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
 *   indexes: [["email"]],
 *   uniques: [["email"]],
 *   hooks: {
 *     beforeFetch(qb) { qb.whereNull("deleted_at"); },
 *   },
 * });
 *
 * // Type-safe column references directly on the model
 * // User.id → "users.id", User.email → "users.email", etc.
 * sql.from(User)
 *   .select(User.id, [User.email, "userEmail"])
 *   .where(User.id, ">", 5)
 *   .orderBy(User.email, "asc");
 * ```
 */
export function defineModel<
  T extends string,
  C extends Record<string, ColumnDef>,
>(table: T, definition: ModelDefinition<T, C>): DefinedModel<T, C, {}> {
  const { columns, indexes, uniques, checks, hooks, options } = definition;

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

  // 4. Register columns and attach column references as static properties
  for (const [columnName, colDef] of Object.entries(columns)) {
    colDef._apply(DefinedModelClass.prototype, columnName);

    if (RESERVED_MODEL_PROPERTIES.has(columnName)) {
      throw new Error(
        `defineModel("${table}"): column name "${columnName}" conflicts with an existing model property. Please rename this column.`,
      );
    }
    Object.defineProperty(DefinedModelClass, columnName, {
      value: `${table}.${columnName}`,
      writable: false,
      enumerable: true,
      configurable: true,
    });
  }

  // 5. Register indexes
  if (indexes) {
    for (const indexDef of indexes) {
      applyIndex(DefinedModelClass, indexDef);
    }
  }

  // 6. Register uniques
  if (uniques) {
    for (const uniqueDef of uniques) {
      applyUnique(DefinedModelClass, uniqueDef);
    }
  }

  // 7. Register checks
  if (checks) {
    for (const checkDef of checks) {
      applyCheck(DefinedModelClass, checkDef);
    }
  }

  // 8. Attach hooks
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

  return DefinedModelClass as unknown as DefinedModel<T, C, {}>;
}

// ---------------------------------------------------------------------------
// defineRelations
// ---------------------------------------------------------------------------

/**
 * Declares relations for a model without mutating it.
 * Returns a `RelationDefinitions` object to be passed to `createSchema`.
 *
 * @example
 * ```typescript
 * const UserRelations = defineRelations(User, ({ hasMany, belongsTo, manyToMany }) => ({
 *   posts: hasMany(Post, { foreignKey: "userId" }),
 *   addresses: manyToMany(Address, {
 *     through: UserAddress,
 *     leftForeignKey: "userId",
 *     rightForeignKey: "addressId",
 *   }),
 * }));
 * ```
 */
export function defineRelations<
  Source extends { readonly table: string; new (...args: any[]): Model },
  R extends Record<string, SchemaRelDef>,
>(
  model: Source,
  callback: (helpers: RelationHelpers<Source>) => R,
): RelationDefinitions<Source, R> {
  const helpers: RelationHelpers<Source> = {
    hasOne(target, opts) {
      return {
        _kind: "hasOne",
        _target: target,
        _foreignKey: opts.foreignKey as string,
        _phantom: undefined,
      } as any;
    },
    hasMany(target, opts) {
      return {
        _kind: "hasMany",
        _target: target,
        _foreignKey: opts.foreignKey as string,
        _phantom: undefined,
      } as any;
    },
    belongsTo(target, opts) {
      const { foreignKey, ...constraintOptions } = opts;
      return {
        _kind: "belongsTo",
        _target: target,
        _foreignKey: foreignKey as string,
        _constraintOptions: constraintOptions,
        _phantom: undefined,
      } as any;
    },
    manyToMany(target: any, opts: any) {
      const { through, leftForeignKey, rightForeignKey, ...constraintOptions } =
        opts;
      const throughModel =
        typeof through === "string"
          ? through
          : ((() => through) as () => AnyModelConstructor);
      return {
        _kind: "manyToMany",
        _target: target,
        _foreignKey: leftForeignKey as string,
        _throughModel: throughModel,
        _throughModelKeys: {
          leftForeignKey: leftForeignKey as string,
          rightForeignKey: rightForeignKey as string,
        },
        _constraintOptions: constraintOptions,
        _phantom: undefined,
      } as any;
    },
  };

  const defs = callback(helpers);
  return { _source: model, _defs: defs } as RelationDefinitions<Source, R>;
}

// ---------------------------------------------------------------------------
// createSchema
// ---------------------------------------------------------------------------

/**
 * Combines models and relation definitions, registers relations on model
 * prototypes via decorators, and returns a fully-typed schema record.
 *
 * @example
 * ```typescript
 * export const schema = createSchema(
 *   { users: User, posts: Post, addresses: Address, user_addresses: UserAddress },
 *   { users: UserRelations, posts: PostRelations },
 * );
 * // schema.users, schema.posts, etc. are augmented DefinedModel types
 * ```
 */
export function createSchema<
  M extends Record<string, AnyModelConstructor>,
  R extends { [K in keyof M]?: RelationDefinitions<any, any> },
>(models: M, relations?: R): CreateSchemaResult<M, R> {
  for (const [key, relDefs] of Object.entries(relations || {})) {
    if (!relDefs) continue;
    const model = models[key];
    if (!model) {
      throw new Error(
        `createSchema: relation key "${key}" does not match any model in the models record`,
      );
    }

    const defs = (relDefs as RelationDefinitions<any, any>)._defs;
    for (const [relName, def] of Object.entries(defs) as [
      string,
      SchemaRelDef,
    ][]) {
      const target = def._target;
      const fk = def._foreignKey;

      switch (def._kind) {
        case "hasOne":
          hasOneDecorator(() => target as unknown as typeof Model, fk)(
            model.prototype,
            relName,
          );
          break;
        case "hasMany":
          hasManyDecorator(() => target as unknown as typeof Model, fk)(
            model.prototype,
            relName,
          );
          break;
        case "belongsTo":
          belongsToDecorator(
            () => target as unknown as typeof Model,
            fk,
            def._constraintOptions as BaseModelRelationType,
          )(model.prototype, relName);
          break;
        case "manyToMany": {
          const throughModel = def._throughModel!;
          const throughModelKeys = def._throughModelKeys!;
          manyToManyDecorator(
            () => target as unknown as typeof Model,
            throughModel as string | (() => typeof Model),
            throughModelKeys as ManyToManyStringOptions,
            def._constraintOptions as BaseModelRelationType,
          )(model.prototype, relName);
          break;
        }
      }
    }
  }

  return models as CreateSchemaResult<M, R>;
}

// ---------------------------------------------------------------------------
// defineView
// ---------------------------------------------------------------------------

/**
 * Creates a fully-typed read-only Model subclass backed by a SQL view.
 *
 * The returned class works with `sql.from(View).many()` and other read operations.
 * Mutation operations (insert, update, delete) are not intended for views.
 *
 * @example
 * ```typescript
 * import { defineView, col } from "hysteria-orm";
 *
 * const UserStats = defineView("user_stats", {
 *   columns: {
 *     id: col.integer(),
 *     total: col.integer(),
 *   },
 *   statement(query) {
 *     query
 *       .selectRaw("COUNT(*) as total")
 *       .selectRaw("1 as id")
 *       .from("users");
 *   },
 * });
 * ```
 */
export function defineView<
  T extends string,
  C extends Record<string, ColumnDef>,
>(table: T, definition: ViewDefinition<C>): DefinedView<T, C> {
  const { columns, statement, hooks, options } = definition;

  class DefinedViewClass extends Model {}

  DefinedViewClass.table = table;

  // Store the view statement for schema diff / migration tooling
  (DefinedViewClass as any)[viewStatementKey] = statement;

  if (options?.modelCaseConvention) {
    DefinedViewClass.modelCaseConvention = options.modelCaseConvention;
  }
  if (options?.databaseCaseConvention) {
    DefinedViewClass.databaseCaseConvention = options.databaseCaseConvention;
  }

  for (const [columnName, colDef] of Object.entries(columns)) {
    colDef._apply(DefinedViewClass.prototype, columnName);

    if (RESERVED_MODEL_PROPERTIES.has(columnName)) {
      throw new Error(
        `defineView("${table}"): column name "${columnName}" conflicts with an existing model property. Please rename this column.`,
      );
    }
    Object.defineProperty(DefinedViewClass, columnName, {
      value: `${table}.${columnName}`,
      writable: false,
      enumerable: true,
      configurable: true,
    });
  }

  if (hooks) {
    if (hooks.beforeFetch) {
      DefinedViewClass.beforeFetch = hooks.beforeFetch;
    }
    if (hooks.afterFetch) {
      DefinedViewClass.afterFetch = hooks.afterFetch;
    }
  }

  return DefinedViewClass as unknown as DefinedView<T, C>;
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
