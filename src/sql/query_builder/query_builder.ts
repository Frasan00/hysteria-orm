import { format } from "sql-formatter";
import { convertCase } from "../../utils/case_utils";
import { Model } from "../models/model";
import { getModelColumns } from "../models/model_decorators";
import {
  RelationType,
  SelectableType,
} from "../models/model_manager/model_manager_types";
import { MysqlQueryBuilder } from "../mysql/mysql_query_builder";
import { PaginatedData } from "../pagination";
import { PostgresQueryBuilder } from "../postgres/postgres_query_builder";
import selectTemplate from "../resources/query/SELECT";
import { SqlDataSource } from "../sql_data_source";
import { SqlLiteQueryBuilder } from "../sqlite/sql_lite_query_builder";
import { DeleteOptions, SoftDeleteOptions } from "./delete_query_builder_type";
import { UpdateOptions } from "./update_query_builder_types";
import { WhereQueryBuilder } from "./where_query_builder";
import { getSqlDialect } from "../sql_runner/sql_runner";

/**
 * @description The abstract class for query builders for selecting data.
 */
export type ModelQueryBuilder<T extends Model> =
  | MysqlQueryBuilder<T>
  | PostgresQueryBuilder<T>
  | SqlLiteQueryBuilder<T>;

export type ModelInstanceType<O> = O extends typeof Model
  ? InstanceType<O>
  : never;

export type FetchHooks = "beforeFetch" | "afterFetch";

export type OneOptions = {
  ignoreHooks?: FetchHooks[];
};

export type ManyOptions = {
  ignoreHooks?: FetchHooks[];
};

export type RelationQueryBuilder = {
  relation: string;
  selectedColumns?: string[];
  whereQuery?: string;
  params?: any[];
  joinQuery?: string;
  groupByQuery?: string;
  orderByQuery?: string;
  limitQuery?: string;
  offsetQuery?: string;
  havingQuery?: string;
  ignoreAfterFetchHook?: boolean;
};

export abstract class QueryBuilder<
  T extends Model,
> extends WhereQueryBuilder<T> {
  protected selectQuery: string;
  protected modelSelectedColumns: string[];
  protected relations: RelationQueryBuilder[];
  protected groupByQuery: string;
  protected orderByQuery: string;
  protected limitQuery: string;
  protected offsetQuery: string;
  protected havingQuery: string;
  protected selectTemplate: ReturnType<typeof selectTemplate>;

  protected constructor(
    model: typeof Model,
    table: string,
    logs: boolean,
    sqlDataSource: SqlDataSource,
  ) {
    super(model, table, logs, false, sqlDataSource);
    this.sqlDataSource = sqlDataSource;
    this.selectTemplate = selectTemplate(
      this.sqlDataSource.getDbType(),
      this.model,
    );
    this.selectQuery = this.selectTemplate.selectAll;
    this.whereQuery = "";
    this.modelSelectedColumns = [];
    this.relations = [];
    this.groupByQuery = "";
    this.orderByQuery = "";
    this.limitQuery = "";
    this.offsetQuery = "";
    this.havingQuery = "";
  }

  /**
   * @description Executes the query and retrieves the first result.
   */
  abstract one(options?: OneOptions): Promise<T | null>;

  /**
   * @description Executes the query and retrieves the first result.
   * @alias one
   */
  async first(options?: OneOptions): Promise<T | null> {
    return this.one(options);
  }

  /**
   * @description Executes the query and retrieves the first result. Fail if no result is found.
   */
  abstract oneOrFail(options?: {
    ignoreHooks?: OneOptions["ignoreHooks"] & { customError?: Error };
  }): Promise<T>;

  /**
   * @description Executes the query and retrieves the first result. Fail if no result is found.
   * @alias oneOrFail
   */
  async firstOrFail(options?: {
    ignoreHooks?: OneOptions["ignoreHooks"] & { customError?: Error };
  }): Promise<T> {
    return this.oneOrFail(options);
  }

  /**
   * @description Executes the query and retrieves multiple results.
   */
  abstract many(options?: ManyOptions): Promise<T[]>;

  /**
   * @description Updates records in the database.
   */
  abstract update(data: Partial<T>, options?: UpdateOptions): Promise<number>;

  /**
   * @description soft Deletes Records from the database.
   * @default column - 'deletedAt'
   * @default value - The current date and time.
   * @default ignoreBeforeDeleteHook - false
   * @default trx - undefined
   */
  abstract softDelete(options?: SoftDeleteOptions<T>): Promise<number>;

  /**
   * @description Deletes Records from the database for the current query.
   */
  abstract delete(options?: DeleteOptions): Promise<number>;

  /**
   * @description Executes the query and retrieves the count of results, it ignores all select, group by, order by, limit and offset clauses if they are present.
   */
  abstract getCount(options: { ignoreHooks: boolean }): Promise<number>;

  /**
   * @description Executes the query and retrieves the sum of a column, it ignores all select, group by, order by, limit and offset clauses if they are present.
   */
  abstract getSum(
    column: string,
    options: { ignoreHooks: boolean },
  ): Promise<number>;

  /**
   * @description Executes the query and retrieves multiple results.
   */
  abstract paginate(
    page: number,
    limit: number,
    options?: ManyOptions,
  ): Promise<PaginatedData<T>>;

  /**
   * @description Adds a SELECT condition to the query.
   */
  select(...columns: string[]): QueryBuilder<T>;
  select(...columns: (SelectableType<T> | "*")[]): QueryBuilder<T>;
  select(...columns: (SelectableType<T> | "*" | string)[]): QueryBuilder<T> {
    this.selectQuery = this.selectTemplate.selectColumns(
      ...(columns as string[]),
    );

    this.modelSelectedColumns = columns.map((column) =>
      convertCase(column as string, this.model.databaseCaseConvention),
    ) as string[];

    return this;
  }

  distinct(): QueryBuilder<T> {
    const distinct = this.selectTemplate.distinct;
    this.selectQuery = this.selectQuery.replace(
      /select/i,
      `SELECT ${distinct}`,
    );

    return this;
  }

  distinctOn(...columns: string[]): QueryBuilder<T>;
  distinctOn(...columns: SelectableType<T>[]): QueryBuilder<T>;
  distinctOn(...columns: (string | SelectableType<T>)[]): QueryBuilder<T> {
    const distinctOn = this.selectTemplate.distinctOn(...(columns as string[]));

    this.selectQuery = this.selectQuery.replace(
      /select/i,
      `SELECT ${distinctOn}`,
    );

    return this;
  }

  /**
   * @description Adds a relation to the final model.
   */
  abstract with<O extends typeof Model>(
    relation: RelationType<T>,
    relatedModel?: O,
    relatedModelQueryBuilder?: (
      queryBuilder: ModelQueryBuilder<ModelInstanceType<O>>,
    ) => void,
    ignoreHooks?: { beforeFetch?: boolean; afterFetch?: boolean },
  ): ModelQueryBuilder<T>;

  /**
   * @description Build more complex where conditions.
   */
  abstract whereBuilder(
    cb: (queryBuilder: ModelQueryBuilder<T>) => void,
  ): ModelQueryBuilder<T>;

  /**
   * @description Build more complex where conditions.
   */
  abstract andWhereBuilder(
    cb: (queryBuilder: ModelQueryBuilder<T>) => void,
  ): ModelQueryBuilder<T>;

  /**
   * @description Build more complex where conditions.
   */
  abstract orWhereBuilder(
    cb: (queryBuilder: ModelQueryBuilder<T>) => void,
  ): ModelQueryBuilder<T>;

  /**
   * @description Returns a copy of the query builder instance.
   */
  abstract copy(): ModelQueryBuilder<T>;

  /**
   * @description Returns the query and the parameters in an object.
   */
  toSql(): {
    query: string;
    params: any[];
  } {
    const query =
      this.selectQuery +
      this.joinQuery +
      this.whereQuery +
      this.groupByQuery +
      this.havingQuery +
      this.orderByQuery +
      this.limitQuery +
      this.offsetQuery;

    function parsePlaceHolders(
      dbType: string,
      query: string,
      startIndex: number = 1,
    ): string {
      switch (dbType) {
        case "mysql":
        case "sqlite":
        case "mariadb":
          return query.replace(/PLACEHOLDER/g, () => "?");
        case "postgres":
          let index = startIndex;
          return query.replace(/PLACEHOLDER/g, () => `$${index++}`);
        default:
          throw new Error(
            "Unsupported database type, did you forget to set the dbType in the function params?",
          );
      }
    }

    let parsedQuery = parsePlaceHolders(this.sqlDataSource.getDbType(), query);

    parsedQuery = format(parsedQuery, {
      language: getSqlDialect(this.sqlDataSource.getDbType()),
    });
    return { query: parsedQuery, params: this.params };
  }

  protected groupFooterQuery(): string {
    return (
      this.groupByQuery +
      this.havingQuery +
      this.orderByQuery +
      this.limitQuery +
      this.offsetQuery
    );
  }

  protected async mergeRawPacketIntoModel(
    model: T,
    row: any,
    typeofModel: typeof Model,
  ) {
    const columns = getModelColumns(this.model);
    Object.entries(row).forEach(([key, value]) => {
      const casedKey = convertCase(
        key,
        typeofModel.modelCaseConvention,
      ) as string;
      if (columns.map((column) => column.columnName).includes(casedKey)) {
        Object.assign(model, { [casedKey]: value });
        return;
      }

      model.$additional[key] = value as string | number | boolean;
    });
  }
}
