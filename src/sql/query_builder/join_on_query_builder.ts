import { RawNode } from "../ast/query/node/raw/raw_node";
import type {
  BaseValues,
  BinaryOperatorType,
} from "../ast/query/node/where/where";
import { WhereNode } from "../ast/query/node/where/where";
import { WhereGroupNode } from "../ast/query/node/where/where_group";
import type { SubqueryOperatorType } from "../ast/query/node/where/where_subquery";
import { WhereSubqueryNode } from "../ast/query/node/where/where_subquery";
import type { JsonOperatorType } from "../ast/query/node/where/where_json";
import { WhereJsonNode } from "../ast/query/node/where/where_json";
import type { Model } from "../models/model";
import { SqlDataSource } from "../sql_data_source";
import type { JsonPathInput } from "../../utils/json_path_utils";
import { QueryBuilder } from "./query_builder";
import type { SelectableColumn } from "./query_builder_types";

export class JoinOnQueryBuilder {
  protected whereNodes: (WhereNode | WhereGroupNode | WhereSubqueryNode)[];
  protected isNestedCondition = false;

  constructor(
    protected model: typeof Model,
    protected sqlDataSource: SqlDataSource,
    isNestedCondition = false,
  ) {
    this.whereNodes = [];
    this.isNestedCondition = isNestedCondition;
  }

  /**
   * @description Get the where conditions for the join
   */
  getConditions(): (WhereNode | WhereGroupNode | WhereSubqueryNode)[] {
    return this.whereNodes;
  }

  /**
   * @description Adds a WHERE condition to the query.
   */
  where(
    column: SelectableColumn<string>,
    operator: BinaryOperatorType,
    value: BaseValues,
  ): this;
  where(cb: (queryBuilder: JoinOnQueryBuilder) => void): this;
  where(column: SelectableColumn<string>, value: BaseValues): this;
  where(
    columnOrCb:
      | SelectableColumn<string>
      | ((queryBuilder: JoinOnQueryBuilder) => void),
    operatorOrValue?: BinaryOperatorType | BaseValues,
    value?: BaseValues,
  ): this {
    if (typeof columnOrCb === "function") {
      return this.andWhereGroup(columnOrCb as (qb: JoinOnQueryBuilder) => void);
    }

    return this.andWhere(
      columnOrCb as SelectableColumn<string>,
      operatorOrValue as BinaryOperatorType,
      value as BaseValues,
    );
  }

  /**
   * @description Adds an AND WHERE condition to the query.
   */
  andWhere(
    column: SelectableColumn<string>,
    operator: BinaryOperatorType,
    value: BaseValues,
  ): this;
  andWhere(column: SelectableColumn<string>, value: BaseValues): this;
  andWhere(cb: (queryBuilder: JoinOnQueryBuilder) => void): this;
  andWhere(
    columnOrCb:
      | SelectableColumn<string>
      | ((queryBuilder: JoinOnQueryBuilder) => void),
    operatorOrValue?: BinaryOperatorType | BaseValues,
    value?: BaseValues,
  ): this {
    if (typeof columnOrCb === "function") {
      return this.andWhereGroup(columnOrCb as (qb: JoinOnQueryBuilder) => void);
    }

    let operator: BinaryOperatorType = "=";
    let actualValue: BaseValues;

    if (typeof operatorOrValue === "string" && value !== undefined) {
      operator = operatorOrValue as BinaryOperatorType;
      actualValue = value as BaseValues;
    } else {
      actualValue = operatorOrValue as BaseValues;
      operator = "=";
    }

    this.whereNodes.push(
      new WhereNode(columnOrCb as string, "and", false, operator, actualValue),
    );
    return this;
  }

  /**
   * @description Adds an OR WHERE condition to the query.
   */
  orWhere(
    column: SelectableColumn<string>,
    operator: BinaryOperatorType,
    value: BaseValues,
  ): this;
  orWhere(column: SelectableColumn<string>, value: BaseValues): this;
  orWhere(cb: (queryBuilder: JoinOnQueryBuilder) => void): this;
  orWhere(
    columnOrCb:
      | SelectableColumn<string>
      | ((queryBuilder: JoinOnQueryBuilder) => void),
    operatorOrValue?: BinaryOperatorType | BaseValues,
    value?: BaseValues,
  ): this {
    if (typeof columnOrCb === "function") {
      return this.orWhereGroup(columnOrCb as (qb: JoinOnQueryBuilder) => void);
    }

    let operator: BinaryOperatorType = "=";
    let actualValue: BaseValues;

    if (typeof operatorOrValue === "string" && value !== undefined) {
      operator = operatorOrValue as BinaryOperatorType;
      actualValue = value as BaseValues;
    } else {
      actualValue = operatorOrValue as BaseValues;
      operator = "=";
    }

    this.whereNodes.push(
      new WhereNode(columnOrCb as string, "or", false, operator, actualValue),
    );
    return this;
  }

  /**
   * @description Adds a negated WHERE condition to the query.
   */
  whereNot(
    column: SelectableColumn<string>,
    operator: BinaryOperatorType,
    value: BaseValues,
  ): this;
  whereNot(column: SelectableColumn<string>, value: BaseValues): this;
  whereNot(
    column: SelectableColumn<string>,
    operatorOrValue: BinaryOperatorType | BaseValues,
    value?: BaseValues,
  ): this {
    let operator: BinaryOperatorType = "=";
    let actualValue: BaseValues;

    if (typeof operatorOrValue === "string" && value !== undefined) {
      operator = operatorOrValue as BinaryOperatorType;
      actualValue = value as BaseValues;
    } else {
      actualValue = operatorOrValue as BaseValues;
      operator = "=";
    }

    this.whereNodes.push(
      new WhereNode(column as string, "and", true, operator, actualValue),
    );
    return this;
  }

  /**
   * @description Adds a negated AND WHERE condition to the query.
   */
  andWhereNot(
    column: SelectableColumn<string>,
    operator: BinaryOperatorType,
    value: BaseValues,
  ): this;
  andWhereNot(column: SelectableColumn<string>, value: BaseValues): this;
  andWhereNot(
    column: SelectableColumn<string>,
    operatorOrValue: BinaryOperatorType | BaseValues,
    value?: BaseValues,
  ): this {
    let operator: BinaryOperatorType = "=";
    let actualValue: BaseValues;

    if (typeof operatorOrValue === "string" && value !== undefined) {
      operator = operatorOrValue as BinaryOperatorType;
      actualValue = value as BaseValues;
    } else {
      actualValue = operatorOrValue as BaseValues;
      operator = "=";
    }

    this.whereNodes.push(
      new WhereNode(column as string, "and", true, operator, actualValue),
    );
    return this;
  }

  /**
   * @description Adds a negated OR WHERE condition to the query.
   */
  orWhereNot(
    column: SelectableColumn<string>,
    operator: BinaryOperatorType,
    value: BaseValues,
  ): this;
  orWhereNot(column: SelectableColumn<string>, value: BaseValues): this;
  orWhereNot(
    column: SelectableColumn<string>,
    operatorOrValue: BinaryOperatorType | BaseValues,
    value?: BaseValues,
  ): this {
    let operator: BinaryOperatorType = "=";
    let actualValue: BaseValues;

    if (typeof operatorOrValue === "string" && value !== undefined) {
      operator = operatorOrValue as BinaryOperatorType;
      actualValue = value as BaseValues;
    } else {
      actualValue = operatorOrValue as BaseValues;
      operator = "=";
    }

    this.whereNodes.push(
      new WhereNode(column as string, "or", true, operator, actualValue),
    );
    return this;
  }

  /**
   * @description Adds a condition comparing two columns (`on a.x = b.y`).
   * @description Both sides need the table prefix when either belongs to an aliased or derived
   * join target, since there is no model to resolve them against.
   */
  whereColumn(
    column: SelectableColumn<string>,
    operatorOrRef: BinaryOperatorType | SelectableColumn<string>,
    referenceColumn?: SelectableColumn<string>,
  ): this {
    return this.pushColumnWhere(
      "and",
      column,
      operatorOrRef,
      referenceColumn,
      false,
    );
  }

  /**
   * @description Adds an AND condition comparing two columns.
   */
  andWhereColumn(
    column: SelectableColumn<string>,
    operatorOrRef: BinaryOperatorType | SelectableColumn<string>,
    referenceColumn?: SelectableColumn<string>,
  ): this {
    return this.pushColumnWhere(
      "and",
      column,
      operatorOrRef,
      referenceColumn,
      false,
    );
  }

  /**
   * @description Adds an OR condition comparing two columns.
   */
  orWhereColumn(
    column: SelectableColumn<string>,
    operatorOrRef: BinaryOperatorType | SelectableColumn<string>,
    referenceColumn?: SelectableColumn<string>,
  ): this {
    return this.pushColumnWhere(
      "or",
      column,
      operatorOrRef,
      referenceColumn,
      false,
    );
  }

  /**
   * @description Adds a negated condition comparing two columns (`a != b`, or `not (a op b)`
   * when an explicit operator is given).
   */
  whereNotColumn(
    column: SelectableColumn<string>,
    operatorOrRef: BinaryOperatorType | SelectableColumn<string>,
    referenceColumn?: SelectableColumn<string>,
  ): this {
    return this.pushColumnWhere(
      "and",
      column,
      operatorOrRef,
      referenceColumn,
      true,
    );
  }

  /**
   * @description Adds a negated AND condition comparing two columns.
   */
  andWhereNotColumn(
    column: SelectableColumn<string>,
    operatorOrRef: BinaryOperatorType | SelectableColumn<string>,
    referenceColumn?: SelectableColumn<string>,
  ): this {
    return this.pushColumnWhere(
      "and",
      column,
      operatorOrRef,
      referenceColumn,
      true,
    );
  }

  /**
   * @description Adds a negated OR condition comparing two columns.
   */
  orWhereNotColumn(
    column: SelectableColumn<string>,
    operatorOrRef: BinaryOperatorType | SelectableColumn<string>,
    referenceColumn?: SelectableColumn<string>,
  ): this {
    return this.pushColumnWhere(
      "or",
      column,
      operatorOrRef,
      referenceColumn,
      true,
    );
  }

  private pushColumnWhere(
    chain: "and" | "or",
    column: SelectableColumn<string>,
    operatorOrRef: BinaryOperatorType | SelectableColumn<string>,
    referenceColumn: SelectableColumn<string> | undefined,
    negated: boolean,
  ): this {
    let operator: BinaryOperatorType = negated ? "!=" : "=";
    let negate = false;
    let refColumn: string;

    if (referenceColumn !== undefined) {
      // An explicit operator means "negate this comparison", e.g. NOT (a > b).
      operator = operatorOrRef as BinaryOperatorType;
      refColumn = referenceColumn as string;
      negate = negated;
    } else {
      refColumn = operatorOrRef as string;
    }

    this.whereNodes.push(
      new WhereNode(
        column as string,
        chain,
        negate,
        operator,
        new RawNode(refColumn),
      ),
    );
    return this;
  }

  /**
   * @description Adds a WHERE BETWEEN condition to the query.
   */
  whereBetween(
    column: SelectableColumn<string>,
    min: BaseValues,
    max: BaseValues,
  ): this {
    return this.andWhereBetween(column, min, max);
  }

  /**
   * @description Adds an AND WHERE BETWEEN condition to the query.
   */
  andWhereBetween(
    column: SelectableColumn<string>,
    min: BaseValues,
    max: BaseValues,
  ): this {
    this.whereNodes.push(
      new WhereNode(column as string, "and", false, "between", [min, max]),
    );
    return this;
  }

  /**
   * @description Adds an OR WHERE BETWEEN condition to the query.
   */
  orWhereBetween(
    column: SelectableColumn<string>,
    min: BaseValues,
    max: BaseValues,
  ): this {
    this.whereNodes.push(
      new WhereNode(column as string, "or", false, "between", [min, max]),
    );
    return this;
  }

  /**
   * @description Adds a WHERE NOT BETWEEN condition to the query.
   */
  whereNotBetween(
    column: SelectableColumn<string>,
    min: BaseValues,
    max: BaseValues,
  ): this {
    return this.andWhereNotBetween(column, min, max);
  }

  /**
   * @description Adds an AND WHERE NOT BETWEEN condition to the query.
   */
  andWhereNotBetween(
    column: SelectableColumn<string>,
    min: BaseValues,
    max: BaseValues,
  ): this {
    this.whereNodes.push(
      new WhereNode(column as string, "and", true, "between", [min, max]),
    );
    return this;
  }

  /**
   * @description Adds an OR WHERE NOT BETWEEN condition to the query.
   */
  orWhereNotBetween(
    column: SelectableColumn<string>,
    min: BaseValues,
    max: BaseValues,
  ): this {
    this.whereNodes.push(
      new WhereNode(column as string, "or", true, "between", [min, max]),
    );
    return this;
  }

  /**
   * @description Adds a WHERE LIKE condition to the query.
   */
  whereLike(column: SelectableColumn<string>, value: string): this {
    return this.andWhereLike(column, value);
  }

  /**
   * @description Adds an AND WHERE LIKE condition to the query.
   */
  andWhereLike(column: SelectableColumn<string>, value: string): this {
    this.where(column, "like", value);
    return this;
  }

  /**
   * @description Adds an OR WHERE LIKE condition to the query.
   */
  orWhereLike(column: SelectableColumn<string>, value: string): this {
    this.orWhere(column, "like", value);
    return this;
  }

  /**
   * @description Adds a WHERE ILIKE condition to the query.
   */
  whereILike(column: SelectableColumn<string>, value: string): this {
    return this.andWhereILike(column, value);
  }

  /**
   * @description Adds an AND WHERE ILIKE condition to the query.
   */
  andWhereILike(column: SelectableColumn<string>, value: string): this {
    this.where(column, "ilike", value);
    return this;
  }

  /**
   * @description Adds an OR WHERE ILIKE condition to the query.
   */
  orWhereILike(column: SelectableColumn<string>, value: string): this {
    this.orWhere(column, "ilike", value);
    return this;
  }

  /**
   * @description Adds a WHERE NOT LIKE condition to the query.
   */
  whereNotLike(column: SelectableColumn<string>, value: string): this {
    return this.andWhereNotLike(column, value);
  }

  /**
   * @description Adds an AND WHERE NOT LIKE condition to the query.
   */
  andWhereNotLike(column: SelectableColumn<string>, value: string): this {
    this.where(column, "not like", value);
    return this;
  }

  /**
   * @description Adds an OR WHERE NOT LIKE condition to the query.
   */
  orWhereNotLike(column: SelectableColumn<string>, value: string): this {
    this.orWhere(column, "not like", value);
    return this;
  }

  /**
   * @description Adds a WHERE NOT ILIKE condition to the query.
   */
  whereNotILike(column: SelectableColumn<string>, value: string): this {
    return this.andWhereNotILike(column, value);
  }

  /**
   * @description Adds an AND WHERE NOT ILIKE condition to the query.
   */
  andWhereNotILike(column: SelectableColumn<string>, value: string): this {
    this.where(column, "not ilike", value);
    return this;
  }

  /**
   * @description Adds an OR WHERE NOT ILIKE condition to the query.
   */
  orWhereNotILike(column: SelectableColumn<string>, value: string): this {
    this.orWhere(column, "not ilike", value);
    return this;
  }

  /**
   * @description Adds a WHERE IN condition to the query.
   */
  whereIn(column: SelectableColumn<string>, values: BaseValues[]): this {
    return this.andWhereIn(column, values);
  }

  /**
   * @description Adds an AND WHERE IN condition to the query.
   */
  andWhereIn(column: SelectableColumn<string>, values: BaseValues[]): this {
    if (!values.length) {
      this.whereNodes.push(new WhereNode("false", "and", true, "=", [], true));
      return this;
    }

    this.whereNodes.push(
      new WhereNode(column as string, "and", false, "in", values),
    );
    return this;
  }

  /**
   * @description Adds an OR WHERE IN condition to the query.
   */
  orWhereIn(column: SelectableColumn<string>, values: BaseValues[]): this {
    if (!values.length) {
      this.whereNodes.push(new WhereNode("false", "or", true, "=", [], true));
      return this;
    }

    this.whereNodes.push(
      new WhereNode(column as string, "or", false, "in", values),
    );
    return this;
  }

  /**
   * @description Adds a WHERE NOT IN condition to the query.
   */
  whereNotIn(column: SelectableColumn<string>, values: BaseValues[]): this {
    return this.andWhereNotIn(column, values);
  }

  /**
   * @description Adds an AND WHERE NOT IN condition to the query.
   */
  andWhereNotIn(column: SelectableColumn<string>, values: BaseValues[]): this {
    if (!values.length) {
      this.whereNodes.push(new WhereNode("true", "and", true, "=", [], true));
      return this;
    }

    this.whereNodes.push(
      new WhereNode(column as string, "and", true, "in", values),
    );
    return this;
  }

  /**
   * @description Adds an OR WHERE NOT IN condition to the query.
   */
  orWhereNotIn(column: SelectableColumn<string>, values: BaseValues[]): this {
    if (!values.length) {
      this.whereNodes.push(new WhereNode("true", "or", true, "=", [], true));
      return this;
    }

    this.whereNodes.push(
      new WhereNode(column as string, "or", true, "in", values),
    );
    return this;
  }

  /**
   * @description Adds a WHERE NULL condition to the query.
   */
  whereNull(column: SelectableColumn<string>): this {
    return this.andWhereNull(column);
  }

  /**
   * @description Adds an AND WHERE NULL condition to the query.
   */
  andWhereNull(column: SelectableColumn<string>): this {
    this.whereNodes.push(
      new WhereNode(column as string, "and", false, "is null", undefined),
    );
    return this;
  }

  /**
   * @description Adds an OR WHERE NULL condition to the query.
   */
  orWhereNull(column: SelectableColumn<string>): this {
    this.whereNodes.push(
      new WhereNode(column as string, "or", false, "is null", undefined),
    );
    return this;
  }

  /**
   * @description Adds a WHERE NOT NULL condition to the query.
   */
  whereNotNull(column: SelectableColumn<string>): this {
    return this.andWhereNotNull(column);
  }

  /**
   * @description Adds an AND WHERE NOT NULL condition to the query.
   */
  andWhereNotNull(column: SelectableColumn<string>): this {
    this.whereNodes.push(
      new WhereNode(column as string, "and", false, "is not null", undefined),
    );
    return this;
  }

  /**
   * @description Adds an OR WHERE NOT NULL condition to the query.
   */
  orWhereNotNull(column: SelectableColumn<string>): this {
    this.whereNodes.push(
      new WhereNode(column as string, "or", false, "is not null", undefined),
    );
    return this;
  }

  /**
   * @description Adds a WHERE REGEXP condition to the query.
   */
  whereRegexp(column: SelectableColumn<string>, regexp: RegExp): this {
    return this.andWhereRegexp(column, regexp);
  }

  /**
   * @description Adds an AND WHERE REGEXP condition to the query.
   */
  andWhereRegexp(column: SelectableColumn<string>, regexp: RegExp): this {
    const isPg =
      this.sqlDataSource.getDbType() === "postgres" ||
      this.sqlDataSource.getDbType() === "cockroachdb";

    this.whereNodes.push(
      new WhereNode(
        column as string,
        "and",
        false,
        isPg ? ("~" as BinaryOperatorType) : "regexp",
        regexp.source,
      ),
    );
    return this;
  }

  /**
   * @description Adds an OR WHERE REGEXP condition to the query.
   */
  orWhereRegexp(column: SelectableColumn<string>, regexp: RegExp): this {
    const isPg =
      this.sqlDataSource.getDbType() === "postgres" ||
      this.sqlDataSource.getDbType() === "cockroachdb";

    this.whereNodes.push(
      new WhereNode(
        column as string,
        "or",
        false,
        isPg ? ("~" as BinaryOperatorType) : "regexp",
        regexp.source,
      ),
    );
    return this;
  }

  /**
   * @description Adds a WHERE NOT REGEXP condition to the query.
   */
  whereNotRegexp(column: SelectableColumn<string>, regexp: RegExp): this {
    return this.andWhereNotRegexp(column, regexp);
  }

  /**
   * @description Adds an AND WHERE NOT REGEXP condition to the query.
   */
  andWhereNotRegexp(column: SelectableColumn<string>, regexp: RegExp): this {
    const isPg =
      this.sqlDataSource.getDbType() === "postgres" ||
      this.sqlDataSource.getDbType() === "cockroachdb";

    this.whereNodes.push(
      new WhereNode(
        column as string,
        "and",
        true,
        isPg ? ("~" as BinaryOperatorType) : "regexp",
        regexp.source,
      ),
    );
    return this;
  }

  /**
   * @description Adds an OR WHERE NOT REGEXP condition to the query.
   */
  orWhereNotRegexp(column: SelectableColumn<string>, regexp: RegExp): this {
    const isPg =
      this.sqlDataSource.getDbType() === "postgres" ||
      this.sqlDataSource.getDbType() === "cockroachdb";

    this.whereNodes.push(
      new WhereNode(
        column as string,
        "or",
        true,
        isPg ? ("~" as BinaryOperatorType) : "regexp",
        regexp.source,
      ),
    );
    return this;
  }

  /**
   * @description Adds a WHERE group condition with AND.
   */
  whereGroup(cb: (queryBuilder: JoinOnQueryBuilder) => void): this {
    return this.andWhereGroup(cb);
  }

  /**
   * @description Adds a WHERE group condition with AND.
   */
  andWhereGroup(cb: (queryBuilder: JoinOnQueryBuilder) => void): this {
    const groupQb = new JoinOnQueryBuilder(
      this.model,
      this.sqlDataSource,
      true,
    );
    cb(groupQb);
    const conditions = groupQb.getConditions();
    if (conditions.length > 0) {
      this.whereNodes.push(new WhereGroupNode(conditions, "and"));
    }
    return this;
  }

  /**
   * @description Adds a WHERE group condition with OR.
   */
  orWhereGroup(cb: (queryBuilder: JoinOnQueryBuilder) => void): this {
    const groupQb = new JoinOnQueryBuilder(
      this.model,
      this.sqlDataSource,
      true,
    );
    cb(groupQb);
    const conditions = groupQb.getConditions();
    if (conditions.length > 0) {
      this.whereNodes.push(new WhereGroupNode(conditions, "or"));
    }
    return this;
  }

  /**
   * @description Adds a raw WHERE condition to the query.
   */
  whereRaw(sql: string, bindings?: BaseValues[]): this {
    return this.andWhereRaw(sql, bindings);
  }

  /**
   * @description Adds an AND raw WHERE condition to the query.
   */
  andWhereRaw(sql: string, bindings?: BaseValues[]): this {
    this.whereNodes.push(
      new WhereNode(sql, "and", true, "=", bindings ?? [], true),
    );
    return this;
  }

  /**
   * @description Adds an OR raw WHERE condition to the query.
   */
  orWhereRaw(sql: string, bindings?: BaseValues[]): this {
    this.whereNodes.push(
      new WhereNode(sql, "or", true, "=", bindings ?? [], true),
    );
    return this;
  }

  /**
   * @description Adds an EXISTS condition to the join ON clause. The nested query defaults to the
   * joined model's table; use `from` inside the callback to point it elsewhere.
   */
  whereExists(
    cbOrQueryBuilder: (qb: QueryBuilder) => void | QueryBuilder,
  ): this {
    return this.pushExists("exists", "and", cbOrQueryBuilder);
  }

  /**
   * @description Adds an AND EXISTS condition to the join ON clause.
   */
  andWhereExists(
    cbOrQueryBuilder: (qb: QueryBuilder) => void | QueryBuilder,
  ): this {
    return this.pushExists("exists", "and", cbOrQueryBuilder);
  }

  /**
   * @description Adds an OR EXISTS condition to the join ON clause.
   */
  orWhereExists(
    cbOrQueryBuilder: (qb: QueryBuilder) => void | QueryBuilder,
  ): this {
    return this.pushExists("exists", "or", cbOrQueryBuilder);
  }

  /**
   * @description Adds a NOT EXISTS condition to the join ON clause.
   */
  whereNotExists(
    cbOrQueryBuilder: (qb: QueryBuilder) => void | QueryBuilder,
  ): this {
    return this.pushExists("not exists", "and", cbOrQueryBuilder);
  }

  /**
   * @description Adds an AND NOT EXISTS condition to the join ON clause.
   */
  andWhereNotExists(
    cbOrQueryBuilder: (qb: QueryBuilder) => void | QueryBuilder,
  ): this {
    return this.pushExists("not exists", "and", cbOrQueryBuilder);
  }

  /**
   * @description Adds an OR NOT EXISTS condition to the join ON clause.
   */
  orWhereNotExists(
    cbOrQueryBuilder: (qb: QueryBuilder) => void | QueryBuilder,
  ): this {
    return this.pushExists("not exists", "or", cbOrQueryBuilder);
  }

  private pushExists(
    operator: SubqueryOperatorType,
    chain: "and" | "or",
    cbOrQueryBuilder: (qb: QueryBuilder) => void | QueryBuilder,
  ): this {
    const nested =
      cbOrQueryBuilder instanceof QueryBuilder
        ? cbOrQueryBuilder
        : new QueryBuilder(this.model, this.sqlDataSource);

    (nested as any).isNestedCondition = true;
    if (typeof cbOrQueryBuilder === "function") {
      cbOrQueryBuilder(nested);
    }

    this.whereNodes.push(
      new WhereSubqueryNode("", operator, nested.extractQueryNodes(), chain),
    );
    return this;
  }

  /**
   * @description JSON predicate: the column's document contains the value (superset). Covers the
   * `whereJsonContains` and `whereJsonSupersetOf` spellings of the where builder.
   * @mssql Only exact matches work.
   */
  whereJson(
    column: SelectableColumn<string>,
    value: Record<string, any> | any[],
  ): this {
    return this.pushJson("and", column, "contains", value);
  }

  /**
   * @description JSON predicate: the column's document contains the value (AND).
   */
  andWhereJson(
    column: SelectableColumn<string>,
    value: Record<string, any> | any[],
  ): this {
    return this.pushJson("and", column, "contains", value);
  }

  /**
   * @description JSON predicate: the column's document contains the value (OR).
   */
  orWhereJson(
    column: SelectableColumn<string>,
    value: Record<string, any> | any[],
  ): this {
    return this.pushJson("or", column, "contains", value);
  }

  /**
   * @description JSON predicate: the column's document does not contain the value. Covers the
   * `whereJsonNotContains` and `whereJsonNotSupersetOf` spellings of the where builder.
   * @mssql Not supported.
   */
  whereNotJson(
    column: SelectableColumn<string>,
    value: Record<string, any> | any[],
  ): this {
    return this.pushJson("and", column, "contains", value, true);
  }

  /**
   * @description JSON predicate: the column's document does not contain the value (AND).
   */
  andWhereNotJson(
    column: SelectableColumn<string>,
    value: Record<string, any> | any[],
  ): this {
    return this.pushJson("and", column, "contains", value, true);
  }

  /**
   * @description JSON predicate: the column's document does not contain the value (OR).
   */
  orWhereNotJson(
    column: SelectableColumn<string>,
    value: Record<string, any> | any[],
  ): this {
    return this.pushJson("or", column, "contains", value, true);
  }

  /**
   * @description JSON predicate: the column equals an exact JSON object value.
   */
  whereJsonObject(
    column: SelectableColumn<string>,
    value: Record<string, any> | any[],
  ): this {
    return this.pushJson("and", column, "=", value);
  }

  /**
   * @description JSON predicate: the column equals an exact JSON object value (AND).
   */
  andWhereJsonObject(
    column: SelectableColumn<string>,
    value: Record<string, any> | any[],
  ): this {
    return this.pushJson("and", column, "=", value);
  }

  /**
   * @description JSON predicate: the column equals an exact JSON object value (OR).
   */
  orWhereJsonObject(
    column: SelectableColumn<string>,
    value: Record<string, any> | any[],
  ): this {
    return this.pushJson("or", column, "=", value);
  }

  /**
   * @description JSON predicate: the column does not equal an exact JSON object value.
   */
  whereNotJsonObject(
    column: SelectableColumn<string>,
    value: Record<string, any> | any[],
  ): this {
    return this.pushJson("and", column, "=", value, true);
  }

  /**
   * @description JSON predicate: the column does not equal an exact JSON object value (AND).
   */
  andWhereNotJsonObject(
    column: SelectableColumn<string>,
    value: Record<string, any> | any[],
  ): this {
    return this.pushJson("and", column, "=", value, true);
  }

  /**
   * @description JSON predicate: the column does not equal an exact JSON object value (OR).
   */
  orWhereNotJsonObject(
    column: SelectableColumn<string>,
    value: Record<string, any> | any[],
  ): this {
    return this.pushJson("or", column, "=", value, true);
  }

  /**
   * @description JSON predicate: compares the value at a JSON path. This is the ON-clause form of
   * Knex's `onJsonPathEquals`, and of `whereJsonPath` in the where builder.
   */
  whereJsonPath(
    column: SelectableColumn<string>,
    path: JsonPathInput,
    operator: BinaryOperatorType,
    value: any,
  ): this {
    return this.pushJson("and", column, "path", value, false, path, operator);
  }

  /**
   * @description JSON predicate: compares the value at a JSON path (AND).
   */
  andWhereJsonPath(
    column: SelectableColumn<string>,
    path: JsonPathInput,
    operator: BinaryOperatorType,
    value: any,
  ): this {
    return this.pushJson("and", column, "path", value, false, path, operator);
  }

  /**
   * @description JSON predicate: compares the value at a JSON path (OR).
   */
  orWhereJsonPath(
    column: SelectableColumn<string>,
    path: JsonPathInput,
    operator: BinaryOperatorType,
    value: any,
  ): this {
    return this.pushJson("or", column, "path", value, false, path, operator);
  }

  /**
   * @description JSON predicate: the column's document is a subset of the value.
   * @postgres/cockroachdb/mysql/mariadb only
   */
  whereJsonSubsetOf(
    column: SelectableColumn<string>,
    value: Record<string, any> | any[],
  ): this {
    return this.pushJson("and", column, "subset", value);
  }

  /**
   * @description JSON predicate: the column's document is a subset of the value (AND).
   */
  andWhereJsonSubsetOf(
    column: SelectableColumn<string>,
    value: Record<string, any> | any[],
  ): this {
    return this.pushJson("and", column, "subset", value);
  }

  /**
   * @description JSON predicate: the column's document is a subset of the value (OR).
   */
  orWhereJsonSubsetOf(
    column: SelectableColumn<string>,
    value: Record<string, any> | any[],
  ): this {
    return this.pushJson("or", column, "subset", value);
  }

  /**
   * @description JSON predicate: the column's document is not a subset of the value.
   * @postgres/cockroachdb/mysql/mariadb only
   */
  whereJsonNotSubsetOf(
    column: SelectableColumn<string>,
    value: Record<string, any> | any[],
  ): this {
    return this.pushJson("and", column, "subset", value, true);
  }

  /**
   * @description JSON predicate: the column's document is not a subset of the value (AND).
   */
  andWhereJsonNotSubsetOf(
    column: SelectableColumn<string>,
    value: Record<string, any> | any[],
  ): this {
    return this.pushJson("and", column, "subset", value, true);
  }

  /**
   * @description JSON predicate: the column's document is not a subset of the value (OR).
   */
  orWhereJsonNotSubsetOf(
    column: SelectableColumn<string>,
    value: Record<string, any> | any[],
  ): this {
    return this.pushJson("or", column, "subset", value, true);
  }

  /**
   * @description JSON predicate: the column has none of the given keys.
   * @postgres/cockroachdb only
   */
  whereJsonHasNone(column: SelectableColumn<string>, keys: string[]): this {
    return this.pushJson("and", column, "has none", keys);
  }

  /**
   * @description JSON predicate: the column has none of the given keys (AND).
   */
  andWhereJsonHasNone(column: SelectableColumn<string>, keys: string[]): this {
    return this.pushJson("and", column, "has none", keys);
  }

  /**
   * @description JSON predicate: the column has none of the given keys (OR).
   */
  orWhereJsonHasNone(column: SelectableColumn<string>, keys: string[]): this {
    return this.pushJson("or", column, "has none", keys);
  }

  /**
   * @description Adds a raw JSON predicate to the join ON clause.
   */
  whereJsonRaw(sql: string, bindings?: BaseValues[]): this {
    return this.pushJson("and", sql, "raw", bindings ?? []);
  }

  /**
   * @description Adds an AND raw JSON predicate to the join ON clause.
   */
  andWhereJsonRaw(sql: string, bindings?: BaseValues[]): this {
    return this.pushJson("and", sql, "raw", bindings ?? []);
  }

  /**
   * @description Adds an OR raw JSON predicate to the join ON clause.
   */
  orWhereJsonRaw(sql: string, bindings?: BaseValues[]): this {
    return this.pushJson("or", sql, "raw", bindings ?? []);
  }

  private pushJson(
    chain: "and" | "or",
    column: string,
    operator: JsonOperatorType,
    value: any,
    negated = false,
    path?: JsonPathInput,
    comparisonOperator?: BinaryOperatorType,
  ): this {
    this.whereNodes.push(
      new WhereJsonNode(
        column,
        chain,
        negated,
        operator,
        value,
        false,
        path,
        comparisonOperator,
      ),
    );
    return this;
  }
}
