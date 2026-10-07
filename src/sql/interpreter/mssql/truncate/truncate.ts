import { HysteriaError } from "../../../../errors/hysteria_error";
import { AstParser } from "../../../ast/parser";
import { FromNode } from "../../../ast/query/node/from";
import { TruncateNode } from "../../../ast/query/node/truncate";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class MssqlTruncateInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const truncateNode = node as TruncateNode;

    if (truncateNode.isRawValue && typeof truncateNode.fromNode === "string") {
      return {
        sql: truncateNode.fromNode,
        bindings: [],
      };
    }

    if (
      truncateNode.options &&
      Object.values(truncateNode.options).some(Boolean)
    ) {
      throw new HysteriaError(
        "MssqlTruncateInterpreter",
        "TRUNCATE_OPTION_NOT_SUPPORTED",
        new Error("MSSQL does not support TRUNCATE options"),
      );
    }

    const formattedTable = new InterpreterUtils(
      this.model,
    ).getFromForWriteOperations("mssql", truncateNode.fromNode as FromNode);

    return {
      sql: `table ${formattedTable}`,
      bindings: [],
    };
  }
}

export default new MssqlTruncateInterpreter();
