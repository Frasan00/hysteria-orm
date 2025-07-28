import { HysteriaError } from "../../../errors/hysteria_error";
import { Model } from "../../models/model";
import { SqlDataSource } from "../../sql_data_source";
import { CteCallback, CteMap } from "../cte/cte_types";
import { QueryBuilder } from "../query_builder";

/**
 * @description A builder for CTEs
 * @throws Must call at least one `newCte` method or this class will throw an error
 */
export class CteBuilder<T extends Model> {
  private model: typeof Model;
  private sqlDataSource: SqlDataSource;
  cteMap: CteMap;

  constructor(
    clause: string,
    ...params: ConstructorParameters<typeof QueryBuilder>
  ) {
    this.model = params[0];
    this.sqlDataSource = params[1] || SqlDataSource.getInstance();
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
}
