import { HysteriaError } from "../../errors/hysteria_error";
import { JoinNode } from "../ast/query/node/join";
import type {
  WhereGroupNode,
  WhereNode,
  WhereSubqueryNode,
} from "../ast/query/node/where";
import { BinaryOperatorType } from "../ast/query/node/where";
import { Model } from "../models/model";
import { ModelKey } from "../models/model_manager/model_manager_types";
import { SqlDataSource } from "../sql_data_source";
import { FooterQueryBuilder } from "./footer_query_builder";
import { JoinOnQueryBuilder } from "./join_on_query_builder";
import { JoinableColumn } from "./query_builder_types";

/**
 * @description Callback type for join conditions
 */
export type JoinOnCallback = (query: JoinOnQueryBuilder) => void;

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
  joinRaw(query: string): this {
    this.joinNodes.push(
      new JoinNode(
        query,
        "",
        "",
        "inner",
        {
          operator: "=",
        },
        true,
      ),
    );
    return this;
  }

  /**
   * @description Join a table with the current model, join clause is not necessary and will be added automatically
   */
  leftJoinRaw(query: string): this {
    this.joinNodes.push(
      new JoinNode(
        query,
        "",
        "",
        "left",
        {
          operator: "=",
        },
        true,
      ),
    );
    return this;
  }

  /**
   * @description Join a table with the current model, join clause is not necessary and will be added automatically
   */
  rightJoinRaw(query: string): this {
    this.joinNodes.push(
      new JoinNode(
        query,
        "",
        "",
        "right",
        {
          operator: "=",
        },
        true,
      ),
    );
    return this;
  }

  /**
   * @description Join a table with the current model, join clause is not necessary and will be added automatically
   */
  fullJoinRaw(query: string): this {
    this.joinNodes.push(
      new JoinNode(query, "", "", "full", { operator: "=" }, true),
    );

    return this;
  }

  /**
   * @description Join a table with the current model, join clause is not necessary and will be added automatically
   */
  crossJoinRaw(query: string): this {
    this.joinNodes.push(
      new JoinNode(query, "", "", "cross", { operator: "=" }, true),
    );

    return this;
  }

  /**
   * @description Join a table with the current model, join clause is not necessary and will be added automatically
   */
  naturalJoinRaw(query: string): this {
    this.joinNodes.push(
      new JoinNode(query, "", "", "natural", { operator: "=" }, true),
    );

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
  innerJoin<R extends typeof Model>(
    relationModel: R,
    referencingColumn: ModelKey<InstanceType<R>>,
    primaryColumn: ModelKey<T>,
    operator?: BinaryOperatorType,
  ): this;
  innerJoin<R extends typeof Model>(
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
  innerJoin<R extends typeof Model>(
    relationModel: R,
    referencingColumn: ModelKey<InstanceType<R>>,
    primaryColumn: ModelKey<T>,
    operator: BinaryOperatorType,
    callback: JoinOnCallback,
  ): this;
  innerJoin<R extends typeof Model>(
    relationModel: R,
    referencingColumn: ModelKey<InstanceType<R>>,
    primaryColumn: ModelKey<T>,
    callback: JoinOnCallback,
  ): this;
  innerJoin<R extends typeof Model>(
    relationTable: string | R,
    referencingColumnOrPrimaryColumn:
      | JoinableColumn
      | ModelKey<InstanceType<R>>
      | ModelKey<T>,
    primaryColumn?: JoinableColumn | ModelKey<T>,
    operatorOrCallback?: BinaryOperatorType | JoinOnCallback,
    callback?: JoinOnCallback,
  ): this {
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
      typeof relationTable === "string" ? relationTable : relationTable.table,
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
  join<R extends typeof Model>(
    relationModel: R,
    referencingColumn: ModelKey<InstanceType<R>>,
    primaryColumn: ModelKey<T>,
    operator?: BinaryOperatorType,
  ): this;
  join<R extends typeof Model>(
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
  join<R extends typeof Model>(
    relationModel: R,
    referencingColumn: ModelKey<InstanceType<R>>,
    primaryColumn: ModelKey<T>,
    operator: BinaryOperatorType,
    callback: JoinOnCallback,
  ): this;
  join<R extends typeof Model>(
    relationModel: R,
    referencingColumn: ModelKey<InstanceType<R>>,
    primaryColumn: ModelKey<T>,
    callback: JoinOnCallback,
  ): this;
  join<R extends typeof Model>(
    relationTable: string | R,
    referencingColumnOrPrimaryColumn:
      | JoinableColumn
      | ModelKey<InstanceType<R>>
      | ModelKey<T>,
    primaryColumn?: JoinableColumn | ModelKey<T>,
    operatorOrCallback?: BinaryOperatorType | JoinOnCallback,
    callback?: JoinOnCallback,
  ): this {
    let primaryColumnValue: string | ModelKey<T> | undefined = primaryColumn;
    let op: BinaryOperatorType | undefined = "=";
    let cb: JoinOnCallback | undefined;

    // Determine if we have a callback
    if (typeof operatorOrCallback === "function") {
      cb = operatorOrCallback as JoinOnCallback;
    } else if (typeof operatorOrCallback === "string") {
      op = operatorOrCallback as BinaryOperatorType;
      cb = callback;
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
        typeof relationTable === "string" ? relationTable : relationTable.table,
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
  leftJoin<R extends typeof Model>(
    relationModel: R,
    referencingColumn: ModelKey<InstanceType<R>>,
    primaryColumn: ModelKey<T>,
    operator?: BinaryOperatorType,
  ): this;
  leftJoin<R extends typeof Model>(
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
  leftJoin<R extends typeof Model>(
    relationModel: R,
    referencingColumn: ModelKey<InstanceType<R>>,
    primaryColumn: ModelKey<T>,
    operator: BinaryOperatorType,
    callback: JoinOnCallback,
  ): this;
  leftJoin<R extends typeof Model>(
    relationModel: R,
    referencingColumn: ModelKey<InstanceType<R>>,
    primaryColumn: ModelKey<T>,
    callback: JoinOnCallback,
  ): this;
  leftJoin<R extends typeof Model>(
    relationTable: string | R,
    referencingColumnOrPrimaryColumn:
      | JoinableColumn
      | ModelKey<InstanceType<R>>
      | ModelKey<T>,
    primaryColumn?: JoinableColumn | ModelKey<T>,
    operatorOrCallback?: BinaryOperatorType | JoinOnCallback,
    callback?: JoinOnCallback,
  ): this {
    let primaryColumnValue: string | ModelKey<T> | undefined = primaryColumn;
    let op: BinaryOperatorType | undefined = "=";
    let cb: JoinOnCallback | undefined;

    // Determine if we have a callback
    if (typeof operatorOrCallback === "function") {
      cb = operatorOrCallback as JoinOnCallback;
    } else if (typeof operatorOrCallback === "string") {
      op = operatorOrCallback as BinaryOperatorType;
      cb = callback;
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
        typeof relationTable === "string" ? relationTable : relationTable.table,
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
  rightJoin<R extends typeof Model>(
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
  rightJoin<R extends typeof Model>(
    relationTable: string | R,
    referencingColumnOrPrimaryColumn:
      | ModelKey<InstanceType<R>>
      | JoinableColumn
      | ModelKey<T>,
    primaryColumn?: JoinableColumn | ModelKey<T>,
    operatorOrCallback?: BinaryOperatorType | JoinOnCallback,
    callback?: JoinOnCallback,
  ): this {
    let primaryColumnValue: string | ModelKey<T> | undefined = primaryColumn;
    let op: BinaryOperatorType | undefined = "=";
    let cb: JoinOnCallback | undefined;

    // Determine if we have a callback
    if (typeof operatorOrCallback === "function") {
      cb = operatorOrCallback as JoinOnCallback;
    } else if (typeof operatorOrCallback === "string") {
      op = operatorOrCallback as BinaryOperatorType;
      cb = callback;
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
        typeof relationTable === "string" ? relationTable : relationTable.table,
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
  fullJoin<R extends typeof Model>(
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
  fullJoin<R extends typeof Model>(
    relationTable: string | R,
    referencingColumnOrPrimaryColumn:
      | ModelKey<InstanceType<R>>
      | JoinableColumn
      | ModelKey<T>,
    primaryColumn?: JoinableColumn | ModelKey<T>,
    operatorOrCallback?: BinaryOperatorType | JoinOnCallback,
    callback?: JoinOnCallback,
  ): this {
    let primaryColumnValue: string | ModelKey<T> | undefined = primaryColumn;
    let op: BinaryOperatorType | undefined = "=";
    let cb: JoinOnCallback | undefined;

    // Determine if we have a callback
    if (typeof operatorOrCallback === "function") {
      cb = operatorOrCallback as JoinOnCallback;
    } else if (typeof operatorOrCallback === "string") {
      op = operatorOrCallback as BinaryOperatorType;
      cb = callback;
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
        typeof relationTable === "string" ? relationTable : relationTable.table,
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
}
