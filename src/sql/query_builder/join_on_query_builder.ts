import type {
  BaseValues,
  BinaryOperatorType,
} from "../ast/query/node/where/where";
import { WhereNode } from "../ast/query/node/where/where";
import { WhereGroupNode } from "../ast/query/node/where/where_group";
import type { SubqueryOperatorType } from "../ast/query/node/where/where_subquery";
import { WhereSubqueryNode } from "../ast/query/node/where/where_subquery";
import { SqlDataSource } from "../sql_data_source";
import type { SelectableColumn } from "./query_builder_types";

export class JoinOnQueryBuilder {
  protected whereNodes: (WhereNode | WhereGroupNode | WhereSubqueryNode)[];
  protected isNestedCondition = false;

  constructor(
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
    const groupQb = new JoinOnQueryBuilder(this.sqlDataSource, true);
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
    const groupQb = new JoinOnQueryBuilder(this.sqlDataSource, true);
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
}
