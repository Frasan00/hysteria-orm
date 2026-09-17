import { QueryNode } from "../ast/query/query";
import { Model } from "../models/model";
import { SqlDataSourceType } from "../sql_data_source_types";

/**
 * @description Class used to translate a Node into { sql, bindings }
 * @internal
 */
export interface Interpreter {
  model: typeof Model;
  /** Original (unmapped) dialect, e.g. "mariadb" even when routed through the mysql interpreter */
  dbType?: SqlDataSourceType;
  toSql: (node: QueryNode) => { sql: string; bindings: any[] };
}
