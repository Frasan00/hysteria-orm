import { AstParser } from "../../../ast/parser";
import { QueryNode } from "../../../ast/query/query";
import { ReturningNode } from "../../../ast/query/node/returning/returning";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

/** Emitted last, after the where clauses. */
class SqliteReturningInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const returningNode = node as ReturningNode;
    const interpreterUtils = new InterpreterUtils(this.model);

    const columns =
      !returningNode.columns.length || returningNode.columns.includes("*")
        ? "*"
        : returningNode.columns
            .map((column) =>
              interpreterUtils.formatStringColumn("sqlite", column),
            )
            .join(", ");

    return {
      sql: `returning ${columns}`,
      bindings: [],
    };
  }
}

export default new SqliteReturningInterpreter();
