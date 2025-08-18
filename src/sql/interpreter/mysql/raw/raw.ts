import { RawNode } from "../../../ast/query/node/raw/raw_node";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MysqlRawInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): { sql: string; bindings: any[] } {
    const rawNode = node as RawNode;
    return {
      sql: rawNode.rawValue,
      bindings: [],
    };
  }
}

export default new MysqlRawInterpreter();
