import { Pool, RowDataPacket } from "mysql2/promise";
import selectTemplate, {
  SelectTemplateType,
} from "../../QueryTemplates/SELECT";
import whereTemplate, {
  WhereTemplateType,
} from "../../QueryTemplates/WHERE.TS";
import { WhereOperatorType } from "../../QueryTemplates/WHERE.TS";
import MySqlUtils from "../ModelManager/MySqlUtils";
import { Model } from "../Model";
import { Relation, RelationType } from "../Relations/Relation";
import { log } from "../../../Logger";
import ModelManagerUtils from "../ModelManager/ModelManagerUtils";

export class QueryBuilder<T extends Model> {
  protected selectQuery: string = "";
  protected relations: string[] = [];
  protected whereQuery: string = "";
  protected groupByQuery: string = "";
  protected orderByQuery: string = "";
  protected limitQuery: string = "";
  protected offsetQuery: string = "";

  protected model: new () => Model;
  protected tableName: string;
  protected mysqlConnection: Pool;
  protected logs: boolean;

  protected selectTemplate: SelectTemplateType;
  protected whereTemplate: WhereTemplateType;

  /**
   * @description Constructs a QueryBuilder instance.
   * @param model - The model class associated with the table.
   * @param tableName - The name of the table.
   * @param mysqlConnection - The MySQL connection pool.
   * @param logs - A boolean indicating whether to log queries.
   */
  public constructor(
    model: new () => Model,
    tableName: string,
    mysqlConnection: Pool,
    logs: boolean,
  ) {
    this.model = model;
    this.mysqlConnection = mysqlConnection;
    this.logs = logs;
    this.tableName = tableName;
    this.selectQuery = selectTemplate(this.tableName).selectAll;
    this.selectTemplate = selectTemplate(this.tableName);
    this.whereTemplate = whereTemplate(this.tableName);
  }

  /**
   * @description Executes the query and retrieves the first result.
   * @returns A Promise resolving to the first result or null.
   */
  public async first(): Promise<T | null> {
    let query = this.selectQuery;
    if (this.whereQuery) {
      query += this.whereQuery;
    }

    log(query, this.logs);
    try {
      const [rows] = await this.mysqlConnection.query<RowDataPacket[]>(query);
      const model = MySqlUtils.convertSqlResultToModel(
        rows[0],
        this.model,
      ) as T | null;
      if (!model) {
        return null;
      }
      await this.addRelations(model, this.relations);
      return model;
    } catch (error) {
      throw new Error("Query failed " + error);
    }
  }

  /**
   * @description Executes the query and retrieves multiple results.
   * @returns A Promise resolving to an array of results.
   */
  public async many(): Promise<T[]> {
    let query = this.selectQuery;
    if (this.whereQuery) {
      query += this.whereQuery;
    }

    query += this.groupFooterQuery();

    log(query, this.logs);
    try {
      const [rows] = await this.mysqlConnection.query<RowDataPacket[]>(query);
      const modelPromises = rows.map(async (row) => {
        const model = MySqlUtils.convertSqlResultToModel(row, this.model) as T;
        await this.addRelations(model, this.relations);
        return model;
      });

      return Promise.all(modelPromises);
    } catch (error) {
      throw new Error("Query failed " + error);
    }
  }

  /**
   * @description Columns are customizable with aliases. By default, without this function, all columns are selected
   * @param columns
   */
  public select(...columns: string[]) {
    const select = selectTemplate(this.tableName);
    this.selectQuery = select.selectColumns(...columns);
  }

  /**
   * @description Adds a WHERE condition to the query.
   * @param column - The column to filter.
   * @param operator - The comparison operator.
   * @param value - The value to compare against.
   * @returns The QueryBuilder instance for chaining.
   */
  public where(
    column: string,
    operator: WhereOperatorType,
    value: string | number | boolean | Date,
  ): this {
    if (this.whereQuery) {
      this.whereQuery += this.whereTemplate.andWhere(
        column,
        value.toString(),
        operator,
      );
      return this;
    }
    this.whereQuery = this.whereTemplate.where(
      column,
      value.toString(),
      operator,
    );
    return this;
  }

  /**
   * @description Adds an AND WHERE condition to the query.
   * @param column - The column to filter.
   * @param operator - The comparison operator.
   * @param value - The value to compare against.
   * @returns The QueryBuilder instance for chaining.
   */
  public andWhere(
    column: string,
    operator: WhereOperatorType,
    value: string | number | boolean | Date,
  ): this {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.where(
        column,
        value.toString(),
        operator,
      );
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).andWhere(
      column,
      value.toString(),
      operator,
    );
    return this;
  }

  /**
   * @description Adds an OR WHERE condition to the query.
   * @param column - The column to filter.
   * @param operator - The comparison operator.
   * @param value - The value to compare against.
   * @returns The QueryBuilder instance for chaining.
   */
  public orWhere(
    column: string,
    operator: WhereOperatorType,
    value: string | number | boolean | Date,
  ): this {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.where(
        column,
        value.toString(),
        operator,
      );
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).orWhere(
      column,
      value.toString(),
      operator,
    );
    return this;
  }

  /**
   * @description Adds a WHERE BETWEEN condition to the query.
   * @param column - The column to filter.
   * @param min - The minimum value for the range.
   * @param max - The maximum value for the range.
   * @returns The QueryBuilder instance for chaining.
   */
  public whereBetween(column: string, min: string, max: string): this {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereBetween(column, min, max);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).whereBetween(
      column,
      min,
      max,
    );
    return this;
  }

  /**
   * @description Adds an AND WHERE BETWEEN condition to the query.
   * @param column - The column to filter.
   * @param min - The minimum value for the range.
   * @param max - The maximum value for the range.
   * @returns The QueryBuilder instance for chaining.
   */
  public andWhereBetween(column: string, min: string, max: string): this {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereBetween(column, min, max);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).andWhereBetween(
      column,
      min,
      max,
    );
    return this;
  }

  /**
   * @description Adds an OR WHERE BETWEEN condition to the query.
   * @param column - The column to filter.
   * @param min - The minimum value for the range.
   * @param max - The maximum value for the range.
   * @returns The QueryBuilder instance for chaining.
   */
  public orWhereBetween(column: string, min: string, max: string): this {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereBetween(column, min, max);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).orWhereBetween(
      column,
      min,
      max,
    );
    return this;
  }

  /**
   * @description Adds a WHERE NOT BETWEEN condition to the query.
   * @param column - The column to filter.
   * @param min - The minimum value for the range.
   * @param max - The maximum value for the range.
   * @returns The QueryBuilder instance for chaining.
   */
  public whereNotBetween(column: string, min: string, max: string): this {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.andWhereNotBetween(column, min, max);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).whereNotBetween(
      column,
      min,
      max,
    );
    return this;
  }

  /**
   * @description Adds an OR WHERE NOT BETWEEN condition to the query.
   * @param column - The column to filter.
   * @param min - The minimum value for the range.
   * @param max - The maximum value for the range.
   * @returns The QueryBuilder instance for chaining.
   */
  public orWhereNotBetween(column: string, min: string, max: string): this {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereNotBetween(column, min, max);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).orWhereNotBetween(
      column,
      min,
      max,
    );
    return this;
  }

  /**
   * @description Adds a WHERE IN condition to the query.
   * @param column - The column to filter.
   * @param values - An array of values to match against.
   * @returns The QueryBuilder instance for chaining.
   */
  public whereIn(column: string, values: string[]): this {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereIn(column, values);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).whereIn(column, values);
    return this;
  }

  /**
   * @description Adds an AND WHERE IN condition to the query.
   * @param column - The column to filter.
   * @param values - An array of values to match against.
   * @returns The QueryBuilder instance for chaining.
   */
  public andWhereIn(column: string, values: string[]): this {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereIn(column, values);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).andWhereIn(column, values);
    return this;
  }

  /**
   * @description Adds an OR WHERE IN condition to the query.
   * @param column - The column to filter.
   * @param values - An array of values to match against.
   * @returns The QueryBuilder instance for chaining.
   */
  public orWhereIn(column: string, values: string[]): this {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereIn(column, values);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).orWhereIn(column, values);
    return this;
  }

  /**
   * @description Adds a WHERE NOT IN condition to the query.
   * @param column - The column to filter.
   * @param values - An array of values to exclude.
   * @returns The QueryBuilder instance for chaining.
   */
  public whereNotIn(column: string, values: string[]): this {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.andWhereNotIn(column, values);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).whereNotIn(column, values);
    return this;
  }

  /**
   * @description Adds an OR WHERE NOT IN condition to the query.
   * @param column - The column to filter.
   * @param values - An array of values to exclude.
   * @returns The QueryBuilder instance for chaining.
   */
  public orWhereNotIn(column: string, values: string[]): this {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereNotIn(column, values);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).orWhereNotIn(
      column,
      values,
    );
    return this;
  }

  /**
   * @description Adds a WHERE NULL condition to the query.
   * @param column - The column to filter.
   * @returns The QueryBuilder instance for chaining.
   */
  public whereNull(column: string): this {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.andWhereNull(column);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).whereNull(column);
    return this;
  }

  /**
   * @description Adds an AND WHERE NULL condition to the query.
   * @param column - The column to filter.
   * @returns The QueryBuilder instance for chaining.
   */
  public andWhereNull(column: string): this {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereNull(column);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).andWhereNull(column);
    return this;
  }

  /**
   * @description Adds an OR WHERE NULL condition to the query.
   * @param column - The column to filter.
   * @returns The QueryBuilder instance for chaining.
   */
  public orWhereNull(column: string): this {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereNull(column);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).orWhereNull(column);
    return this;
  }

  /**
   * @description Adds a WHERE NOT NULL condition to the query.
   * @param column - The column to filter.
   * @returns The QueryBuilder instance for chaining.
   */
  public whereNotNull(column: string): this {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.andWhereNotNull(column);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).whereNotNull(column);
    return this;
  }

  /**
   * @description Adds an AND WHERE NOT NULL condition to the query.
   * @param column - The column to filter.
   * @returns The QueryBuilder instance for chaining.
   */
  public andWhereNotNull(column: string): this {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereNotNull(column);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).andWhereNotNull(column);
    return this;
  }

  /**
   * @description Adds an OR WHERE NOT NULL condition to the query.
   * @param column - The column to filter.
   * @returns The QueryBuilder instance for chaining.
   */
  public orWhereNotNull(column: string) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.whereNotNull(column);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).orWhereNotNull(column);
    return this;
  }

  /**
   * @description Adds a raw WHERE condition to the query.
   * @param query - The raw SQL WHERE condition.
   * @returns The QueryBuilder instance for chaining.
   */
  public rawWhere(query: string) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.rawAndWhere(query);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).rawWhere(query);
    return this;
  }

  /**
   * @description Adds a raw AND WHERE condition to the query.
   * @param query - The raw SQL WHERE condition.
   * @returns The QueryBuilder instance for chaining.
   */
  public rawAndWhere(query: string) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.rawWhere(query);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).rawAndWhere(query);
    return this;
  }

  /**
   * @description Adds a raw OR WHERE condition to the query.
   * @param query - The raw SQL WHERE condition.
   * @returns The QueryBuilder instance for chaining.
   */
  public rawOrWhere(query: string) {
    if (!this.whereQuery) {
      this.whereQuery = this.whereTemplate.rawWhere(query);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).rawOrWhere(query);
    return this;
  }

  /**
   * @description Adds GROUP BY conditions to the query.
   * @param columns - The columns to group by.
   * @returns The QueryBuilder instance for chaining.
   */
  public groupBy(...columns: string[]) {
    this.groupByQuery = this.selectTemplate.groupBy(...columns);
    return this;
  }

  /**
   * @description Adds ORDER BY conditions to the query.
   * @param column - The column to order by.
   * @param order - The order direction, either "ASC" or "DESC".
   * @returns The QueryBuilder instance for chaining.
   */
  public orderBy(column: string[], order: "ASC" | "DESC") {
    this.orderByQuery = this.selectTemplate.orderBy(column, order);
    return this;
  }

  /**
   * @description Adds a LIMIT condition to the query.
   * @param limit - The maximum number of rows to return.
   * @returns The QueryBuilder instance for chaining.
   */
  public limit(limit: number) {
    this.limitQuery = this.selectTemplate.limit(limit);
    return this;
  }

  /**
   * @description Adds an OFFSET condition to the query.
   * @param offset - The number of rows to skip.
   * @returns The QueryBuilder instance for chaining.
   */
  public offset(offset: number) {
    this.offsetQuery = this.selectTemplate.offset(offset);
    return this;
  }

  /**
   * @description Fills the returned model with the input relations.
   * @param relations - The relations to fill the model with.
   * @returns The QueryBuilder instance for chaining.
   */
  public withRelations(...relations: string[]) {
    this.relations = [...relations];
    return this;
  }

  protected async addRelations(model: T, relations: string[]): Promise<void> {
    if (relations.length === 0) {
      return;
    }

    relations.map(async (relation) => {
      const relationInstance = model[relation as keyof T] as Relation;
      if (!relationInstance || !relationInstance.type) {
        throw new Error(
          "Model " + model.tableName + " has no relation " + relation,
        );
      }

      const query = ModelManagerUtils.getRelationQuery(model, relationInstance);
      switch (relationInstance.type) {
        case RelationType.belongsTo:
          const [rows] =
            await this.mysqlConnection.query<RowDataPacket[]>(query);
          const relatedModel: Model = MySqlUtils.convertSqlResultToModel(
            rows[0],
            this.model,
          );
          return Object.assign(model, relatedModel);

        case RelationType.hasOne:
        case RelationType.hasMany:
          log(query, this.logs);
          const [rows2] =
            await this.mysqlConnection.query<RowDataPacket[]>(query);
          const models: Model[] = rows2.map((row) =>
            MySqlUtils.convertSqlResultToModel(row, this.model),
          );
          if (models.length === 1) {
            return Object.assign(model, models[0]);
          }

          return Object.assign(model, models);

        default:
          throw new Error("Relation type not supported");
      }
    });
  }

  protected groupFooterQuery(): string {
    return (
      this.groupByQuery + this.orderByQuery + this.limitQuery + this.offsetQuery
    );
  }
}
