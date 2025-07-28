import { AstParser } from "../../../ast/parser";
import type { FromNode } from "../../../ast/query/node/from/from";
import { QueryNode } from "../../../ast/query/query";
import type { SqlDataSourceType } from "../../../sql_data_source_types";
import type { Interpreter } from "../../interpreter";
import { Model } from "../../../models/model";
import { InterpreterUtils } from "../../interpreter_utils";

class SqliteFromInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const fromNode = node as FromNode;
    return {
      sql: fromNode.table as string,
      bindings: [],
    };
  }
}

export default new SqliteFromInterpreter();
