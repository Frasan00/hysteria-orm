import { Model } from "../models/model";
import { ModelKey } from "../models/model_manager/model_manager_types";
import selectTemplate from "../resources/query/SELECT";
import { SqlDataSource } from "../sql_data_source";
import { SqlDataSourceType } from "../sql_data_source_types";
import { JoinQueryBuilder } from "./join_query_builder";

export class SelectQueryBuilder<T extends Model> extends JoinQueryBuilder<T> {
  protected dbType: SqlDataSourceType;
  protected modelSelectedColumns: string[] = [];
  protected selectQuery: string;
  protected withQuery?: string;
  protected fromTable: string;
  protected selectTemplate: ReturnType<typeof selectTemplate>;

  constructor(model: typeof Model, sqlDataSource: SqlDataSource) {
    super(model, sqlDataSource);
    this.dbType = sqlDataSource.getDbType();
    this.selectTemplate = selectTemplate(this.dbType, this.model);
    this.fromTable = this.model.table;
    this.selectQuery = this.selectTemplate.selectAll(this.fromTable);
  }

  /**
   * @description Adds a SELECT condition to the query.
   * @description Can be stacked multiple times
   */
  select(...columns: string[]): this;
  select(...columns: (ModelKey<T> | "*")[]): this;
  select(...columns: (ModelKey<T> | "*" | string)[]): this {
    this.modelSelectedColumns = [
      ...this.modelSelectedColumns,
      ...(columns as string[]),
    ];

    this.selectQuery = this.selectTemplate.selectColumns(this.fromTable, [
      ...this.modelSelectedColumns,
    ]);

    return this;
  }

  /**
   * @description Adds a raw select statement to the query, overriding the previous select statements
   * @description It appends a FROM clause if not contained in the statement
   */
  rawSelect(statement: string): this {
    if (!statement.toLowerCase().includes("from")) {
      statement += ` FROM ${this.fromTable}`;
    }

    this.selectQuery = statement;
    return this;
  }

  clearSelect(): this {
    this.modelSelectedColumns = [];
    this.selectQuery = this.selectTemplate.selectAll(this.fromTable);
    return this;
  }

  /**
   * @description Sets the table to select from, by default is the table defined in the Model
   */
  from(table: string): this {
    this.fromTable = table;
    this.selectQuery = this.selectQuery.replace(
      /FROM\s+(\w+)/i,
      `FROM ${this.fromTable}`,
    );

    return this;
  }

  distinct(): this {
    const distinct = this.selectTemplate.distinct;
    this.selectQuery = this.selectQuery.replace(
      /select/i,
      `SELECT ${distinct}`,
    );

    return this;
  }

  distinctOn(...columns: ModelKey<T>[]): this;
  distinctOn(...columns: string[]): this;
  distinctOn(...columns: (string | ModelKey<T>)[]): this {
    const distinctOn = this.selectTemplate.distinctOn(...(columns as string[]));
    this.selectQuery = this.selectQuery.replace(
      /select/i,
      `SELECT ${distinctOn}`,
    );

    return this;
  }
}
