import { HysteriaError } from "../../errors/hysteria_error";
import { JoinNode } from "../ast/query/node/join";
import type {
  WhereGroupNode,
  WhereNode,
  WhereSubqueryNode,
} from "../ast/query/node/where";
import { BinaryOperatorType } from "../ast/query/node/where";
import type { AnyModelConstructor } from "../models/define_model_types";
import { Model } from "../models/model";
import { ModelKey } from "../models/model_manager/model_manager_types";
import { SqlDataSource } from "../sql_data_source";
import { FooterQueryBuilder } from "./footer_query_builder";
import { JoinOnQueryBuilder } from "./join_on_query_builder";
import { QueryBuilder } from "./query_builder";
import type { SubQueryable } from "./query_builder";
import { JoinableColumn } from "./query_builder_types";

/**
 * @description Callback type for join conditions
 */
export type JoinOnCallback = (query: JoinOnQueryBuilder) => void;

/**
 * @description Callback building the derived table a join reads from. The joined
 * alias is required, since every dialect needs one for a derived table.
 */
export type JoinSubqueryCallback<T extends Model = Model> = (
  qb: QueryBuilder<T>,
) => void | SubQueryable;

// A model constructor is a function too, so the static `table` tells them apart.
const isSubqueryCallback = <T extends Model>(
  value: unknown,
): value is JoinSubqueryCallback<T> =>
  typeof value === "function" && !("table" in value);

export abstract class JoinQueryBuilder<
  T extends Model,
  S extends Record<string, any> = Record<string, any>,
> extends FooterQueryBuilder<T, S> {
  protected joinNodes: JoinNode[];
  protected constructor(model: typeof Model, sqlDataSource: SqlDataSource) {
    super(model, sqlDataSource);
    this.joinNodes = [];
  }

  /**
   * @description Clear the join query
   */
  clearJoin(): this {
    this.joinNodes = [];
    return this;
  }

  /**
   * @description Join a table with the current model, join clause is not necessary and will be added automatically
   */
  joinRaw(query: string, bindings: any[] = []): this {
    const joinNode = new JoinNode(
      query,
      "",
      "",
      "inner",
      {
        operator: "=",
      },
      true,
    );
    joinNode.bindings = bindings;
    this.joinNodes.push(joinNode);

    return this;
  }

  /**
   * @description Join a table with the current model, join clause is not necessary and will be added automatically
   */
  leftJoinRaw(query: string, bindings: any[] = []): this {
    const joinNode = new JoinNode(
      query,
      "",
      "",
      "left",
      {
        operator: "=",
      },
      true,
    );
    joinNode.bindings = bindings;
    this.joinNodes.push(joinNode);

    return this;
  }

  /**
   * @description Join a table with the current model, join clause is not necessary and will be added automatically
   */
  rightJoinRaw(query: string, bindings: any[] = []): this {
    const joinNode = new JoinNode(
      query,
      "",
      "",
      "right",
      {
        operator: "=",
      },
      true,
    );
    joinNode.bindings = bindings;
    this.joinNodes.push(joinNode);

    return this;
  }

  /**
   * @description Join a table with the current model, join clause is not necessary and will be added automatically
   */
  fullJoinRaw(query: string, bindings: any[] = []): this {
    const joinNode = new JoinNode(
      query,
      "",
      "",
      "full",
      {
        operator: "=",
      },
      true,
    );
    joinNode.bindings = bindings;
    this.joinNodes.push(joinNode);

    return this;
  }

  /**
   * @description Join a table with the current model, join clause is not necessary and will be added automatically
   */
  crossJoinRaw(query: string, bindings: any[] = []): this {
    const joinNode = new JoinNode(
      query,
      "",
      "",
      "cross",
      {
        operator: "=",
      },
      true,
    );
    joinNode.bindings = bindings;
    this.joinNodes.push(joinNode);

    return this;
  }

  /**
   * @description Performs a CROSS JOIN against a table (non-raw).
   */
  crossJoin(cb: JoinSubqueryCallback<T>, alias: string): this;
  crossJoin(relationTable: string, alias?: string): this;
  crossJoin<R extends AnyModelConstructor>(relationModel: R): this;
  crossJoin<R extends AnyModelConstructor>(
    relationTable: string | R | JoinSubqueryCallback<T>,
    alias?: string,
  ): this {
    if (isSubqueryCallback<T>(relationTable)) {
      return this.derivedJoin(relationTable, "cross", alias);
    }

    const table =
      typeof relationTable === "string"
        ? relationTable
        : (relationTable as R).table;
    this.joinNodes.push(
      new JoinNode(alias ? `${table} as ${alias}` : table, "", "", "cross", {
        operator: "=",
      }),
    );
    return this;
  }

  /**
   * @description Replaces the ON condition of the most recently added join with a
   * `USING (columns)` clause, e.g. `join("orders").using("user_id")`.
   * @postgres/mysql/mariadb/cockroachdb/sqlite only
   */
  using(...columns: (JoinableColumn | ModelKey<T>)[]): this {
    const lastJoin = this.joinNodes[this.joinNodes.length - 1];
    if (
      !lastJoin ||
      !columns.length ||
      lastJoin.isRawValue ||
      lastJoin.type === "cross" ||
      lastJoin.type === "natural"
    ) {
      throw new HysteriaError("JoinQueryBuilder::using", "USING_REQUIRES_JOIN");
    }

    lastJoin.using = columns.map((column) => String(column));
    return this;
  }

  /**
   * @description Join a table with the current model, join clause is not necessary and will be added automatically
   */
  naturalJoinRaw(query: string, bindings: any[] = []): this {
    const joinNode = new JoinNode(
      query,
      "",
      "",
      "natural",
      {
        operator: "=",
      },
      true,
    );
    joinNode.bindings = bindings;
    this.joinNodes.push(joinNode);

    return this;
  }

  /**
   * @alias join
   * @param relationTable - The table to join
   * @param referencingColumn - The column to reference from the relation table, must be in the format of `table.column`
   * @param primaryColumn - The primary column of the current model, default is caller model primary key if using a Model, if using a Raw Query Builder you must provide the key for the primary table, must be in the format of `table.column`
   * @param operator - The comparison operator to use in the ON clause (default: "=")
   */
  innerJoin(
    cb: JoinSubqueryCallback<T>,
    alias: string,
    referencingColumn: JoinableColumn,
    primaryColumn: JoinableColumn,
    operator?: BinaryOperatorType,
  ): this;
  innerJoin(relationTable: string): this;
  innerJoin(
    relationTable: string,
    referencingColumn: JoinableColumn,
    primaryColumn: JoinableColumn,
    operator?: BinaryOperatorType,
  ): this;
  innerJoin(
    relationTable: string,
    referencingColumn: JoinableColumn,
    primaryColumn?: JoinableColumn,
    operator?: BinaryOperatorType,
  ): this;
  innerJoin<R extends AnyModelConstructor>(
    relationModel: R,
    referencingColumn: ModelKey<InstanceType<R>>,
    primaryColumn: ModelKey<T>,
    operator?: BinaryOperatorType,
  ): this;
  innerJoin<R extends AnyModelConstructor>(
    relationModel: R,
    referencingColumn: ModelKey<InstanceType<R>>,
    primaryColumn?: ModelKey<T>,
    operator?: BinaryOperatorType,
  ): this;
  innerJoin(
    relationTable: string,
    referencingColumn: JoinableColumn,
    primaryColumn: JoinableColumn,
    operator: BinaryOperatorType,
    callback: JoinOnCallback,
  ): this;
  innerJoin(
    relationTable: string,
    referencingColumn: JoinableColumn,
    primaryColumn: JoinableColumn,
    callback: JoinOnCallback,
  ): this;
  innerJoin<R extends AnyModelConstructor>(
    relationModel: R,
    referencingColumn: ModelKey<InstanceType<R>>,
    primaryColumn: ModelKey<T>,
    operator: BinaryOperatorType,
    callback: JoinOnCallback,
  ): this;
  innerJoin<R extends AnyModelConstructor>(
    relationModel: R,
    referencingColumn: ModelKey<InstanceType<R>>,
    primaryColumn: ModelKey<T>,
    callback: JoinOnCallback,
  ): this;
  innerJoin<R extends AnyModelConstructor>(
    relationTable: string | R | JoinSubqueryCallback<T>,
    referencingColumnOrPrimaryColumn?:
      | JoinableColumn
      | ModelKey<InstanceType<R>>
      | ModelKey<T>,
    primaryColumn?: JoinableColumn | ModelKey<T>,
    operatorOrCallback?: BinaryOperatorType | JoinOnCallback,
    callback?: JoinOnCallback | BinaryOperatorType,
  ): this {
    if (isSubqueryCallback<T>(relationTable)) {
      return this.derivedJoin(
        relationTable,
        "inner",
        referencingColumnOrPrimaryColumn,
        primaryColumn,
        operatorOrCallback,
        callback,
      );
    }

    if (referencingColumnOrPrimaryColumn === undefined) {
      return this.join(
        typeof relationTable === "string"
          ? relationTable
          : (relationTable as R).table,
      );
    }

    let primaryColumnValue: string | ModelKey<T> | undefined = primaryColumn;
    const op: BinaryOperatorType | undefined =
      operatorOrCallback as BinaryOperatorType;
    const cb: JoinOnCallback | undefined = (
      typeof operatorOrCallback === "function" ? operatorOrCallback : callback
    ) as JoinOnCallback | undefined;

    if (!primaryColumnValue) {
      if (!this.model.primaryKey) {
        throw new HysteriaError(
          "JoinQueryBuilder::join",
          "MODEL_HAS_NO_PRIMARY_KEY",
        );
      }

      primaryColumnValue = `${this.model.table}.${this.model.primaryKey}`;
    }

    this.join(
      typeof relationTable === "string"
        ? relationTable
        : (relationTable as R).table,
      referencingColumnOrPrimaryColumn as JoinableColumn,
      primaryColumnValue as JoinableColumn,
      op,
      cb as any,
    );

    return this;
  }

  /**
   * @description Join a table with the current model
   * @param relationTable - The table to join
   * @param referencingColumn - The column to reference from the relation table, must be in the format of `table.column`
   * @param primaryColumn - The primary column of the current model, default is caller model primary key if using a Model, if using a Raw Query Builder you must provide the key for the primary table, must be in the format of `table.column`
   * @param operator - The comparison operator to use in the ON clause (default: "=")
   */
  join(
    cb: JoinSubqueryCallback<T>,
    alias: string,
    referencingColumn: JoinableColumn,
    primaryColumn: JoinableColumn,
    operator?: BinaryOperatorType,
  ): this;
  join(relationTable: string): this;
  join(
    relationTable: string,
    referencingColumn: JoinableColumn,
    primaryColumn: JoinableColumn,
    operator?: BinaryOperatorType,
  ): this;
  join(
    relationTable: string,
    referencingColumn: JoinableColumn,
    primaryColumn?: JoinableColumn,
    operator?: BinaryOperatorType,
  ): this;
  join<R extends AnyModelConstructor>(
    relationModel: R,
    referencingColumn: ModelKey<InstanceType<R>>,
    primaryColumn: ModelKey<T>,
    operator?: BinaryOperatorType,
  ): this;
  join<R extends AnyModelConstructor>(
    relationModel: R,
    referencingColumn: ModelKey<InstanceType<R>>,
    primaryColumn?: ModelKey<T>,
    operator?: BinaryOperatorType,
  ): this;
  join(
    relationTable: string,
    referencingColumn: JoinableColumn,
    primaryColumn: JoinableColumn,
    operator: BinaryOperatorType,
    callback: JoinOnCallback,
  ): this;
  join(
    relationTable: string,
    referencingColumn: JoinableColumn,
    primaryColumn: JoinableColumn,
    callback: JoinOnCallback,
  ): this;
  join<R extends AnyModelConstructor>(
    relationModel: R,
    referencingColumn: ModelKey<InstanceType<R>>,
    primaryColumn: ModelKey<T>,
    operator: BinaryOperatorType,
    callback: JoinOnCallback,
  ): this;
  join<R extends AnyModelConstructor>(
    relationModel: R,
    referencingColumn: ModelKey<InstanceType<R>>,
    primaryColumn: ModelKey<T>,
    callback: JoinOnCallback,
  ): this;
  join<R extends AnyModelConstructor>(
    relationTable: string | R | JoinSubqueryCallback<T>,
    referencingColumnOrPrimaryColumn?:
      | JoinableColumn
      | ModelKey<InstanceType<R>>
      | ModelKey<T>,
    primaryColumn?: JoinableColumn | ModelKey<T>,
    operatorOrCallback?: BinaryOperatorType | JoinOnCallback,
    callback?: JoinOnCallback | BinaryOperatorType,
  ): this {
    if (isSubqueryCallback<T>(relationTable)) {
      return this.derivedJoin(
        relationTable,
        "inner",
        referencingColumnOrPrimaryColumn,
        primaryColumn,
        operatorOrCallback,
        callback,
      );
    }

    if (referencingColumnOrPrimaryColumn === undefined) {
      // A join with no ON condition, typically paired with `.using(...)`.
      this.joinNodes.push(
        new JoinNode(
          typeof relationTable === "string"
            ? relationTable
            : (relationTable as R).table,
          "",
          "",
          "inner",
          { operator: "=" },
        ),
      );
      return this;
    }

    let primaryColumnValue: string | ModelKey<T> | undefined = primaryColumn;
    let op: BinaryOperatorType | undefined = "=";
    let cb: JoinOnCallback | undefined;

    // Determine if we have a callback
    if (typeof operatorOrCallback === "function") {
      cb = operatorOrCallback as JoinOnCallback;
    } else if (typeof operatorOrCallback === "string") {
      op = operatorOrCallback as BinaryOperatorType;
      cb = callback as JoinOnCallback | undefined;
    }

    if (!primaryColumnValue) {
      if (!this.model.primaryKey) {
        throw new HysteriaError(
          "JoinQueryBuilder::join",
          "MODEL_HAS_NO_PRIMARY_KEY",
        );
      }
      primaryColumnValue = `${this.model.table}.${this.model.primaryKey}`;
    }

    // Build additional conditions if callback is provided
    let additionalConditions:
      | (WhereNode | WhereGroupNode | WhereSubqueryNode)[]
      | undefined = undefined;

    if (cb) {
      const joinOnQb = new JoinOnQueryBuilder(this.sqlDataSource);
      cb(joinOnQb);
      additionalConditions = joinOnQb.getConditions();
    }

    this.joinNodes.push(
      new JoinNode(
        typeof relationTable === "string"
          ? relationTable
          : (relationTable as R).table,
        referencingColumnOrPrimaryColumn as string,
        primaryColumnValue as string,
        "inner",
        {
          operator: op || "=",
        },
        false,
        additionalConditions,
      ),
    );
    return this;
  }

  /**
   * @description Join a table with the current model
   * @param relationTable - The table to join
   * @param referencingColumn - The column to reference from the relation table, must be in the format of `table.column`
   * @param primaryColumn - The primary column of the current model, default is caller model primary key if using a Model, if using a Raw Query Builder you must provide the key for the primary table, must be in the format of `table.column`
   * @param operator - The comparison operator to use in the ON clause (default: "=")
   */
  leftJoin(
    cb: JoinSubqueryCallback<T>,
    alias: string,
    referencingColumn: JoinableColumn,
    primaryColumn: JoinableColumn,
    operator?: BinaryOperatorType,
  ): this;
  leftJoin(relationTable: string): this;
  leftJoin(
    relationTable: string,
    referencingColumn: JoinableColumn,
    primaryColumn: JoinableColumn,
    operator?: BinaryOperatorType,
  ): this;
  leftJoin(
    relationTable: string,
    referencingColumn: JoinableColumn,
    primaryColumn?: JoinableColumn,
    operator?: BinaryOperatorType,
  ): this;
  leftJoin<R extends AnyModelConstructor>(
    relationModel: R,
    referencingColumn: ModelKey<InstanceType<R>>,
    primaryColumn: ModelKey<T>,
    operator?: BinaryOperatorType,
  ): this;
  leftJoin<R extends AnyModelConstructor>(
    relationModel: R,
    referencingColumn: ModelKey<InstanceType<R>>,
    primaryColumn?: ModelKey<T>,
    operator?: BinaryOperatorType,
  ): this;
  leftJoin(
    relationTable: string,
    referencingColumn: JoinableColumn,
    primaryColumn: JoinableColumn,
    operator: BinaryOperatorType,
    callback: JoinOnCallback,
  ): this;
  leftJoin(
    relationTable: string,
    referencingColumn: JoinableColumn,
    primaryColumn: JoinableColumn,
    callback: JoinOnCallback,
  ): this;
  leftJoin<R extends AnyModelConstructor>(
    relationModel: R,
    referencingColumn: ModelKey<InstanceType<R>>,
    primaryColumn: ModelKey<T>,
    operator: BinaryOperatorType,
    callback: JoinOnCallback,
  ): this;
  leftJoin<R extends AnyModelConstructor>(
    relationModel: R,
    referencingColumn: ModelKey<InstanceType<R>>,
    primaryColumn: ModelKey<T>,
    callback: JoinOnCallback,
  ): this;
  leftJoin<R extends AnyModelConstructor>(
    relationTable: string | R | JoinSubqueryCallback<T>,
    referencingColumnOrPrimaryColumn?:
      | JoinableColumn
      | ModelKey<InstanceType<R>>
      | ModelKey<T>,
    primaryColumn?: JoinableColumn | ModelKey<T>,
    operatorOrCallback?: BinaryOperatorType | JoinOnCallback,
    callback?: JoinOnCallback | BinaryOperatorType,
  ): this {
    if (isSubqueryCallback<T>(relationTable)) {
      return this.derivedJoin(
        relationTable,
        "left",
        referencingColumnOrPrimaryColumn,
        primaryColumn,
        operatorOrCallback,
        callback,
      );
    }

    if (referencingColumnOrPrimaryColumn === undefined) {
      this.joinNodes.push(
        new JoinNode(
          typeof relationTable === "string"
            ? relationTable
            : (relationTable as R).table,
          "",
          "",
          "left",
          { operator: "=" },
        ),
      );
      return this;
    }

    let primaryColumnValue: string | ModelKey<T> | undefined = primaryColumn;
    let op: BinaryOperatorType | undefined = "=";
    let cb: JoinOnCallback | undefined;

    // Determine if we have a callback
    if (typeof operatorOrCallback === "function") {
      cb = operatorOrCallback as JoinOnCallback;
    } else if (typeof operatorOrCallback === "string") {
      op = operatorOrCallback as BinaryOperatorType;
      cb = callback as JoinOnCallback | undefined;
    }

    if (!primaryColumnValue) {
      if (!this.model.primaryKey) {
        throw new HysteriaError(
          "JoinQueryBuilder::join",
          "MODEL_HAS_NO_PRIMARY_KEY",
        );
      }
      primaryColumnValue = `${this.model.table}.${this.model.primaryKey}`;
    }

    // Build additional conditions if callback is provided
    let additionalConditions:
      | (WhereNode | WhereGroupNode | WhereSubqueryNode)[]
      | undefined = undefined;

    if (cb) {
      const joinOnQb = new JoinOnQueryBuilder(this.sqlDataSource);
      cb(joinOnQb);
      additionalConditions = joinOnQb.getConditions();
    }

    this.joinNodes.push(
      new JoinNode(
        typeof relationTable === "string"
          ? relationTable
          : (relationTable as R).table,
        referencingColumnOrPrimaryColumn as string,
        primaryColumnValue as string,
        "left",
        {
          operator: op || "=",
        },
        false,
        additionalConditions,
      ),
    );
    return this;
  }

  /**
   * @description Join a table with the current model
   * @param relationTable - The table to join
   * @param referencingColumn - The column to reference from the relation table
   * @param primaryColumn - The primary column of the current model, default is caller model primary key if using A Model, if using a Raw Query Builder you must provide the key for the primary table
   * @param operator - The comparison operator to use in the ON clause (default: "=")
   */
  rightJoin(
    cb: JoinSubqueryCallback<T>,
    alias: string,
    referencingColumn: JoinableColumn,
    primaryColumn: JoinableColumn,
    operator?: BinaryOperatorType,
  ): this;
  rightJoin(relationTable: string): this;
  rightJoin(
    relationTable: string,
    referencingColumnOrPrimaryColumn: JoinableColumn,
    primaryColumn: JoinableColumn,
    operator?: BinaryOperatorType,
  ): this;
  rightJoin(
    relationTable: string,
    referencingColumnOrPrimaryColumn: JoinableColumn,
    primaryColumn?: JoinableColumn,
    operator?: BinaryOperatorType,
  ): this;
  rightJoin<R extends AnyModelConstructor>(
    relationTable: string | R,
    referencingColumnOrPrimaryColumn:
      | ModelKey<InstanceType<R>>
      | JoinableColumn
      | ModelKey<T>,
    primaryColumn?: JoinableColumn | ModelKey<T>,
    operator?: BinaryOperatorType,
  ): this;
  rightJoin(
    relationTable: string,
    referencingColumnOrPrimaryColumn: JoinableColumn,
    primaryColumn: JoinableColumn,
    operator: BinaryOperatorType,
    callback: JoinOnCallback,
  ): this;
  rightJoin(
    relationTable: string,
    referencingColumnOrPrimaryColumn: JoinableColumn,
    primaryColumn: JoinableColumn,
    callback: JoinOnCallback,
  ): this;
  rightJoin<R extends AnyModelConstructor>(
    relationTable: string | R | JoinSubqueryCallback<T>,
    referencingColumnOrPrimaryColumn?:
      | ModelKey<InstanceType<R>>
      | JoinableColumn
      | ModelKey<T>,
    primaryColumn?: JoinableColumn | ModelKey<T>,
    operatorOrCallback?: BinaryOperatorType | JoinOnCallback,
    callback?: JoinOnCallback | BinaryOperatorType,
  ): this {
    if (isSubqueryCallback<T>(relationTable)) {
      return this.derivedJoin(
        relationTable,
        "right",
        referencingColumnOrPrimaryColumn,
        primaryColumn,
        operatorOrCallback,
        callback,
      );
    }

    if (referencingColumnOrPrimaryColumn === undefined) {
      this.joinNodes.push(
        new JoinNode(
          typeof relationTable === "string"
            ? relationTable
            : (relationTable as R).table,
          "",
          "",
          "right",
          { operator: "=" },
        ),
      );
      return this;
    }

    let primaryColumnValue: string | ModelKey<T> | undefined = primaryColumn;
    let op: BinaryOperatorType | undefined = "=";
    let cb: JoinOnCallback | undefined;

    // Determine if we have a callback
    if (typeof operatorOrCallback === "function") {
      cb = operatorOrCallback as JoinOnCallback;
    } else if (typeof operatorOrCallback === "string") {
      op = operatorOrCallback as BinaryOperatorType;
      cb = callback as JoinOnCallback | undefined;
    }

    if (!primaryColumnValue) {
      if (!this.model.primaryKey) {
        throw new HysteriaError(
          "JoinQueryBuilder::join",
          "MODEL_HAS_NO_PRIMARY_KEY",
        );
      }
      primaryColumnValue = `${this.model.table}.${this.model.primaryKey}`;
    }

    // Build additional conditions if callback is provided
    let additionalConditions:
      | (WhereNode | WhereGroupNode | WhereSubqueryNode)[]
      | undefined = undefined;

    if (cb) {
      const joinOnQb = new JoinOnQueryBuilder(this.sqlDataSource);
      cb(joinOnQb);
      additionalConditions = joinOnQb.getConditions();
    }

    this.joinNodes.push(
      new JoinNode(
        typeof relationTable === "string"
          ? relationTable
          : (relationTable as R).table,
        referencingColumnOrPrimaryColumn as string,
        primaryColumnValue as string,
        "right",
        {
          operator: op || "=",
        },
        false,
        additionalConditions,
      ),
    );
    return this;
  }

  /**
   * @description Perform a FULL OUTER JOIN with another table
   * @param relationTable - The table to join
   * @param referencingColumn - The column to reference from the relation table
   * @param primaryColumn - The primary column of the current model
   * @param operator - The comparison operator to use in the ON clause (default: "=")
   */
  fullJoin(
    cb: JoinSubqueryCallback<T>,
    alias: string,
    referencingColumn: JoinableColumn,
    primaryColumn: JoinableColumn,
    operator?: BinaryOperatorType,
  ): this;
  fullJoin(
    relationTable: string,
    referencingColumnOrPrimaryColumn: JoinableColumn,
    primaryColumn: JoinableColumn,
    operator?: BinaryOperatorType,
  ): this;
  fullJoin(
    relationTable: string,
    referencingColumnOrPrimaryColumn: JoinableColumn,
    primaryColumn?: JoinableColumn,
    operator?: BinaryOperatorType,
  ): this;
  fullJoin<R extends AnyModelConstructor>(
    relationTable: string | R,
    referencingColumnOrPrimaryColumn:
      | ModelKey<InstanceType<R>>
      | JoinableColumn
      | ModelKey<T>,
    primaryColumn?: JoinableColumn | ModelKey<T>,
    operator?: BinaryOperatorType,
  ): this;
  fullJoin(
    relationTable: string,
    referencingColumnOrPrimaryColumn: JoinableColumn,
    primaryColumn: JoinableColumn,
    operator: BinaryOperatorType,
    callback: JoinOnCallback,
  ): this;
  fullJoin(
    relationTable: string,
    referencingColumnOrPrimaryColumn: JoinableColumn,
    primaryColumn: JoinableColumn,
    callback: JoinOnCallback,
  ): this;
  fullJoin<R extends AnyModelConstructor>(
    relationTable: string | R | JoinSubqueryCallback<T>,
    referencingColumnOrPrimaryColumn:
      | ModelKey<InstanceType<R>>
      | JoinableColumn
      | ModelKey<T>,
    primaryColumn?: JoinableColumn | ModelKey<T>,
    operatorOrCallback?: BinaryOperatorType | JoinOnCallback,
    callback?: JoinOnCallback | BinaryOperatorType,
  ): this {
    if (isSubqueryCallback<T>(relationTable)) {
      return this.derivedJoin(
        relationTable,
        "full",
        referencingColumnOrPrimaryColumn,
        primaryColumn,
        operatorOrCallback,
        callback,
      );
    }

    let primaryColumnValue: string | ModelKey<T> | undefined = primaryColumn;
    let op: BinaryOperatorType | undefined = "=";
    let cb: JoinOnCallback | undefined;

    // Determine if we have a callback
    if (typeof operatorOrCallback === "function") {
      cb = operatorOrCallback as JoinOnCallback;
    } else if (typeof operatorOrCallback === "string") {
      op = operatorOrCallback as BinaryOperatorType;
      cb = callback as JoinOnCallback | undefined;
    }

    if (!primaryColumnValue) {
      if (!this.model.primaryKey) {
        throw new HysteriaError(
          "JoinQueryBuilder::join",
          "MODEL_HAS_NO_PRIMARY_KEY",
        );
      }
      primaryColumnValue = `${this.model.table}.${this.model.primaryKey}`;
    }

    // Build additional conditions if callback is provided
    let additionalConditions:
      | (WhereNode | WhereGroupNode | WhereSubqueryNode)[]
      | undefined = undefined;

    if (cb) {
      const joinOnQb = new JoinOnQueryBuilder(this.sqlDataSource);
      cb(joinOnQb);
      additionalConditions = joinOnQb.getConditions();
    }

    this.joinNodes.push(
      new JoinNode(
        typeof relationTable === "string"
          ? relationTable
          : (relationTable as R).table,
        referencingColumnOrPrimaryColumn as string,
        primaryColumnValue as string,
        "full",
        {
          operator: op || "=",
        },
        false,
        additionalConditions,
      ),
    );
    return this;
  }

  /**
   * @description Adds a join whose source is a derived table built by `cb`. The
   * join node carries the alias as its table, so an unqualified ON column on either
   * side still resolves against the derived table and the caller's model.
   */
  private derivedJoin(
    cb: JoinSubqueryCallback<T>,
    type: "inner" | "left" | "right" | "full" | "cross",
    alias: unknown,
    referencingColumn?: unknown,
    primaryColumn?: unknown,
    operator?: unknown,
  ): this {
    const aliasValue = alias ? String(alias) : "";
    if (!aliasValue) {
      throw new HysteriaError(
        "JoinQueryBuilder::join",
        "MISSING_ALIAS_FOR_SUBQUERY",
      );
    }

    const subQueryBuilder = new QueryBuilder<T>(this.model, this.sqlDataSource);
    const cbResult = cb(subQueryBuilder);
    const resolved: SubQueryable =
      cbResult != null && "extractQueryNodes" in cbResult
        ? cbResult
        : subQueryBuilder;

    let primaryColumnValue = primaryColumn ? String(primaryColumn) : "";
    if (referencingColumn && !primaryColumnValue) {
      if (!this.model.primaryKey) {
        throw new HysteriaError(
          "JoinQueryBuilder::join",
          "MODEL_HAS_NO_PRIMARY_KEY",
        );
      }
      primaryColumnValue = `${this.model.table}.${this.model.primaryKey}`;
    }

    const joinNode = new JoinNode(
      aliasValue,
      referencingColumn ? String(referencingColumn) : "",
      primaryColumnValue,
      type,
      { operator: (operator as BinaryOperatorType) || "=" },
    );
    joinNode.subquery = resolved.extractQueryNodes();
    this.joinNodes.push(joinNode);

    return this;
  }

  /**
   * @description Aliases for the three outer joins, spelled the way the SQL standard
   * writes them. Parameters are widened on purpose: `Parameters<>` on an overloaded
   * method resolves to its last overload only, which rejects the shorter call shapes.
   */
  leftOuterJoin(
    relationTable: string | AnyModelConstructor | JoinSubqueryCallback<T>,
    referencingColumn?: string,
    primaryColumn?: string,
    operatorOrCallback?: BinaryOperatorType | JoinOnCallback,
    callback?: JoinOnCallback,
  ): this {
    return (this.leftJoin as (...rest: unknown[]) => this)(
      relationTable,
      referencingColumn,
      primaryColumn,
      operatorOrCallback,
      callback,
    );
  }

  rightOuterJoin(
    relationTable: string | AnyModelConstructor | JoinSubqueryCallback<T>,
    referencingColumn?: string,
    primaryColumn?: string,
    operatorOrCallback?: BinaryOperatorType | JoinOnCallback,
    callback?: JoinOnCallback,
  ): this {
    return (this.rightJoin as (...rest: unknown[]) => this)(
      relationTable,
      referencingColumn,
      primaryColumn,
      operatorOrCallback,
      callback,
    );
  }

  fullOuterJoin(
    relationTable: string | AnyModelConstructor | JoinSubqueryCallback<T>,
    referencingColumn?: string,
    primaryColumn?: string,
    operatorOrCallback?: BinaryOperatorType | JoinOnCallback,
    callback?: JoinOnCallback,
  ): this {
    return (this.fullJoin as (...rest: unknown[]) => this)(
      relationTable,
      referencingColumn,
      primaryColumn,
      operatorOrCallback,
      callback,
    );
  }
}
