import { HysteriaError } from "../../errors/hysteria_error";
import { Model } from "../models/model";
import { SqlDataSource } from "../sql_data_source";
import { CteCallback, CteMap, WithClauseType } from "./cte_types";
import { QueryBuilder } from "./query_builder";

/**
 * @description A builder for CTEs
 * @throws Must call at least one `newCte` method or this class will throw an error
 */
export class CteBuilder<T extends Model> {
  private model: typeof Model;
  private sqlDataSource: SqlDataSource;
  private clause: WithClauseType;
  private cteMap: CteMap;

  constructor(
    clause: WithClauseType,
    ...params: ConstructorParameters<typeof QueryBuilder>
  ) {
    this.model = params[0];
    this.sqlDataSource = params[1] || SqlDataSource.getInstance();
    this.clause = clause;
    this.cteMap = new Map();
  }

  /**
   * @description Builds a new CTE and adds it to the final WITH clause
   */
  newCte(alias: string, cb: CteCallback<T>): this {
    const queryBuilder = new QueryBuilder(this.model, this.sqlDataSource);
    cb(queryBuilder);
    this.cteMap.set(alias, queryBuilder);
    return this;
  }

  /**
   * @description Returns the final WITH clause
   * @throws Must call at least one `newCte` method or this class will throw an error
   */
  unWrap(): { query: string; params: any[] } {
    if (this.cteMap.size === 0) {
      throw new HysteriaError(
        "CteBuilder::toQuery",
        "MUST_CALL_BUILD_CTE_AT_LEAST_ONCE",
      );
    }

    const params: any[] = [];

    const query = `WITH ${this.clause === "normal" ? "" : `${this.clause} `} ${Array.from(
      this.cteMap.entries(),
    )
      .map(([alias, queryBuilder]) => {
        const { query, params: queryParams } = queryBuilder.unWrap();
        params.push(...queryParams);
        return `${alias} AS (${query})`;
      })
      .join(", ")}`;

    return { query, params };
  }
}
