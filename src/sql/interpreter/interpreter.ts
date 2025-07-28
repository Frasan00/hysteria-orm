import { QueryNode } from "../ast/query/query";
import { Model } from "../models/model";

/**
 * @description Class used to translate a Node into { sql, bindings }
 * @internal
 */
export interface Interpreter {
  model: typeof Model;
  toSql: (node: QueryNode) => { sql: string; bindings: any[] };
}
