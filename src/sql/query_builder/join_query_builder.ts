import { HysteriaError } from "../../errors/hysteria_error";
import { Model } from "../models/model";
import { ModelKey } from "../models/model_manager/model_manager_types";
import joinTemplate from "../resources/query/JOIN";
import { BinaryOperatorType } from "../resources/query/WHERE";
import { SqlDataSource } from "../sql_data_source";
import { FooterQueryBuilder } from "./footer_query_builder";

export abstract class JoinQueryBuilder<
  T extends Model,
> extends FooterQueryBuilder<T> {
  protected joinQuery: string;
  protected joinsToReplaceInRawQueryRegex =
    /JOIN|LEFT JOIN|RIGHT JOIN|FULL JOIN|CROSS JOIN|NATURAL JOIN|OUTER JOIN|OUTER LEFT JOIN|OUTER RIGHT JOIN|OUTER FULL JOIN|OUTER CROSS JOIN|OUTER NATURAL JOIN|OUTER|OUTER LEFT|OUTER RIGHT|OUTER FULL|OUTER CROSS|OUTER NATURAL/i;

  protected constructor(model: typeof Model, sqlDataSource: SqlDataSource) {
    super(model, sqlDataSource);
    this.joinQuery = "";
  }

  /**
   * @description Clear the join query
   */
  clearJoin(): this {
    this.joinQuery = "";
    return this;
  }

  /**
   * @description Join a table with the current model, join clause is not necessary and will be added automatically
   */
  joinRaw(query: string): this {
    this.joinQuery += `JOIN ${query.replace(this.joinsToReplaceInRawQueryRegex, "").trim()} `;
    return this;
  }

  /**
   * @description Join a table with the current model, join clause is not necessary and will be added automatically
   */
  leftJoinRaw(query: string): this {
    this.joinQuery += `LEFT JOIN ${query.replace(this.joinsToReplaceInRawQueryRegex, "").trim()} `;
    return this;
  }

  /**
   * @description Join a table with the current model, join clause is not necessary and will be added automatically
   */
  rightJoinRaw(query: string): this {
    this.joinQuery += `RIGHT JOIN ${query.replace(this.joinsToReplaceInRawQueryRegex, "").trim()} `;
    return this;
  }

  /**
   * @alias join
   * @param relationTable - The table to join
   * @param referencingColumn - The column to reference from the relation table
   * @param primaryColumn - The primary column of the current model, default is caller model primary key if using A Model, if using a Raw Query Builder you must provide the key for the primary table
   * @param operator - The comparison operator to use in the ON clause (default: "=")
   */
  innerJoin(
    relationTable: string,
    referencingColumn: string,
    primaryColumn: string,
    operator?: BinaryOperatorType,
  ): this;
  innerJoin(
    relationTable: string,
    referencingColumn: string,
    primaryColumn?: string,
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
  innerJoin<R extends typeof Model>(
    relationTable: string | R,
    referencingColumnOrPrimaryColumn: string | ModelKey<R> | ModelKey<T>,
    primaryColumn?: string | ModelKey<T>,
    operator?: BinaryOperatorType,
  ): this {
    let primaryColumnValue: string | ModelKey<T> | undefined = primaryColumn;
    let op: BinaryOperatorType | undefined = operator;

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
      referencingColumnOrPrimaryColumn as string,
      primaryColumnValue as string,
      op,
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
  join(
    relationTable: string,
    referencingColumn: string,
    primaryColumn: string,
    operator?: BinaryOperatorType,
  ): this;
  join(
    relationTable: string,
    referencingColumn: string,
    primaryColumn?: string,
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
  join<R extends typeof Model>(
    relationTable: string | R,
    referencingColumnOrPrimaryColumn: string | ModelKey<R> | ModelKey<T>,
    primaryColumn?: string | ModelKey<T>,
    operator?: BinaryOperatorType,
  ): this {
    let primaryColumnValue: string | ModelKey<T> | undefined = primaryColumn;
    let op: BinaryOperatorType | undefined = operator;

    if (!primaryColumnValue) {
      if (!this.model.primaryKey) {
        throw new HysteriaError(
          "JoinQueryBuilder::join",
          "MODEL_HAS_NO_PRIMARY_KEY",
        );
      }
      primaryColumnValue = `${this.model.table}.${this.model.primaryKey}`;
    }

    const join = joinTemplate(
      this.model,
      typeof relationTable === "string" ? relationTable : relationTable.table,
      primaryColumnValue as string,
      referencingColumnOrPrimaryColumn as string,
      op || "=",
    );

    this.joinQuery += join.innerJoin();
    return this;
  }

  /**
   * @description Join a table with the current model
   * @param relationTable - The table to join
   * @param referencingColumn - The column to reference from the relation table
   * @param primaryColumn - The primary column of the current model, default is caller model primary key if using A Model, if using a Raw Query Builder you must provide the key for the primary table
   * @param operator - The comparison operator to use in the ON clause (default: "=")
   */
  leftJoin(
    relationTable: string,
    referencingColumn: string,
    primaryColumn: string,
    operator?: BinaryOperatorType,
  ): this;
  leftJoin(
    relationTable: string,
    referencingColumn: string,
    primaryColumn?: string,
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
  leftJoin<R extends typeof Model>(
    relationTable: string | R,
    referencingColumnOrPrimaryColumn: string | ModelKey<R> | ModelKey<T>,
    primaryColumn?: string | ModelKey<T>,
    operator?: BinaryOperatorType,
  ): this {
    let primaryColumnValue: string | ModelKey<T> | undefined = primaryColumn;
    let op: BinaryOperatorType | undefined = operator;

    if (!primaryColumnValue) {
      if (!this.model.primaryKey) {
        throw new HysteriaError(
          "JoinQueryBuilder::join",
          "MODEL_HAS_NO_PRIMARY_KEY",
        );
      }
      primaryColumnValue = `${this.model.table}.${this.model.primaryKey}`;
    }

    const join = joinTemplate(
      this.model,
      typeof relationTable === "string" ? relationTable : relationTable.table,
      primaryColumnValue as string,
      referencingColumnOrPrimaryColumn as string,
      op || "=",
    );

    this.joinQuery += join.leftJoin();
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
    referencingColumn: string,
    primaryColumn: string,
    operator?: BinaryOperatorType,
  ): this;
  rightJoin(
    relationTable: string,
    referencingColumn: string,
    primaryColumn?: string,
    operator?: BinaryOperatorType,
  ): this;
  rightJoin<R extends typeof Model>(
    relationModel: R,
    referencingColumn: ModelKey<InstanceType<R>>,
    primaryColumn: ModelKey<T>,
    operator?: BinaryOperatorType,
  ): this;
  rightJoin<R extends typeof Model>(
    relationModel: R,
    referencingColumn: ModelKey<InstanceType<R>>,
    primaryColumn?: ModelKey<T>,
    operator?: BinaryOperatorType,
  ): this;
  rightJoin<R extends typeof Model>(
    relationTable: string | R,
    referencingColumnOrPrimaryColumn: string | ModelKey<R> | ModelKey<T>,
    primaryColumn?: string | ModelKey<T>,
    operator?: BinaryOperatorType,
  ): this {
    let primaryColumnValue: string | ModelKey<T> | undefined = primaryColumn;
    let op: BinaryOperatorType | undefined = operator;

    if (!primaryColumnValue) {
      if (!this.model.primaryKey) {
        throw new HysteriaError(
          "JoinQueryBuilder::join",
          "MODEL_HAS_NO_PRIMARY_KEY",
        );
      }
      primaryColumnValue = `${this.model.table}.${this.model.primaryKey}`;
    }

    const join = joinTemplate(
      this.model,
      typeof relationTable === "string" ? relationTable : relationTable.table,
      primaryColumnValue as string,
      referencingColumnOrPrimaryColumn as string,
      op || "=",
    );

    this.joinQuery += join.rightJoin();
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
    referencingColumn: string,
    primaryColumn: string,
    operator?: BinaryOperatorType,
  ): this;
  fullJoin(
    relationTable: string,
    referencingColumn: string,
    primaryColumn?: string,
    operator?: BinaryOperatorType,
  ): this;
  fullJoin<R extends typeof Model>(
    relationModel: R,
    referencingColumn: ModelKey<InstanceType<R>>,
    primaryColumn: ModelKey<T>,
    operator?: BinaryOperatorType,
  ): this;
  fullJoin<R extends typeof Model>(
    relationModel: R,
    referencingColumn: ModelKey<InstanceType<R>>,
    primaryColumn?: ModelKey<T>,
    operator?: BinaryOperatorType,
  ): this;
  fullJoin<R extends typeof Model>(
    relationTable: string | R,
    referencingColumnOrPrimaryColumn: string | ModelKey<R> | ModelKey<T>,
    primaryColumn?: string | ModelKey<T>,
    operator?: BinaryOperatorType,
  ): this {
    let primaryColumnValue: string | ModelKey<T> | undefined = primaryColumn;
    let op: BinaryOperatorType | undefined = operator;

    if (!primaryColumnValue) {
      if (!this.model.primaryKey) {
        throw new HysteriaError(
          "JoinQueryBuilder::join",
          "MODEL_HAS_NO_PRIMARY_KEY",
        );
      }
      primaryColumnValue = `${this.model.table}.${this.model.primaryKey}`;
    }

    const join = joinTemplate(
      this.model,
      typeof relationTable === "string" ? relationTable : relationTable.table,
      primaryColumnValue as string,
      referencingColumnOrPrimaryColumn as string,
      op || "=",
    );

    this.joinQuery += join.fullJoin();
    return this;
  }

  /**
   * @description Perform a CROSS JOIN with another table
   * @param relationTable - The table to join
   */
  crossJoin(relationTable: string): this;
  crossJoin<R extends typeof Model>(relationModel: R): this;
  crossJoin<R extends typeof Model>(relationTable: string | R): this {
    const join = joinTemplate(
      this.model,
      typeof relationTable === "string" ? relationTable : relationTable.table,
      "",
      "",
    );

    this.joinQuery += join.crossJoin();
    return this;
  }

  /**
   * @description Perform a NATURAL JOIN with another table
   * @param relationTable - The table to join
   */
  naturalJoin(relationTable: string): this;
  naturalJoin<R extends typeof Model>(relationModel: R): this;
  naturalJoin<R extends typeof Model>(relationTable: string | R): this {
    const join = joinTemplate(
      this.model,
      typeof relationTable === "string" ? relationTable : relationTable.table,
      "",
      "",
    );

    this.joinQuery += join.naturalJoin();
    return this;
  }
}
