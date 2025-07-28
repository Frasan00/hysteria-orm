import { AstParser } from "../../../ast/parser";
import type { FromNode } from "../../../ast/query/node/from/from";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class PostgresFromInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const fromNode = node as FromNode;
    return {
      sql: fromNode.table as string,
      bindings: [],
    };
  }
}

export default new PostgresFromInterpreter();
