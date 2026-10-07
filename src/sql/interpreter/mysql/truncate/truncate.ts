import { HysteriaError } from "../../../../errors/hysteria_error";
import { AstParser } from "../../../ast/parser";
import { FromNode } from "../../../ast/query/node/from";
import { TruncateNode } from "../../../ast/query/node/truncate";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class MysqlTruncateInterpreter implements Interpreter {
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
        "MysqlTruncateInterpreter",
        "TRUNCATE_OPTION_NOT_SUPPORTED",
        new Error("MySQL/MariaDB do not support TRUNCATE options"),
      );
    }

    const formattedTable = new InterpreterUtils(
      this.model,
    ).getFromForWriteOperations("mysql", truncateNode.fromNode as FromNode);

    return {
      sql: formattedTable,
      bindings: [],
    };
  }
}

export default new MysqlTruncateInterpreter();
