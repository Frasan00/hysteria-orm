import { AstParser } from "../../../ast/parser";
import { WithNode } from "../../../ast/query/node";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class SqliteWithInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const withNode = node as WithNode;
    const parser = new AstParser(this.model, "sqlite");
    const nodes = Array.isArray(withNode.body)
      ? withNode.body
      : [withNode.body];

    const ast = parser.parse(
      nodes.filter(Boolean) as QueryNode[],
      withNode.currParamIndex,
    );

    const columns = withNode.columns?.length
      ? ` (${withNode.columns
          .map((column) =>
            new InterpreterUtils(this.model).formatStringColumnBare(
              "sqlite",
              column,
            ),
          )
          .join(", ")})`
      : "";

    return {
      sql: `${withNode.alias}${columns} as (${ast.sql})`,
      bindings: ast.bindings,
    };
  }
}

export default new SqliteWithInterpreter();
