import { AstParser } from "../../../ast/parser";
import { QueryNode } from "../../../ast/query/query";
import { ReturningNode } from "../../../ast/query/node/returning/returning";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

/**
 * `output` must sit between `set` and `where`, so the caller inserts this node
 * immediately after the write node rather than last.
 *
 * Note: OUTPUT without INTO is rejected (error 334) on any table with an enabled
 * trigger, which includes every model with an autoUpdate column.
 */
class MssqlReturningInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const returningNode = node as ReturningNode;
    const interpreterUtils = new InterpreterUtils(this.model);

    const columns =
      !returningNode.columns.length || returningNode.columns.includes("*")
        ? `${returningNode.prefix}.*`
        : returningNode.columns
            .map(
              (column) =>
                `${returningNode.prefix}.${interpreterUtils.formatStringColumn("mssql", column)}${interpreterUtils.resolveColumnAlias("mssql", column)}`,
            )
            .join(", ");

    return {
      sql: `output ${columns}`,
      bindings: [],
    };
  }
}

export default new MssqlReturningInterpreter();
