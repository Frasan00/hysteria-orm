import { HysteriaError } from "../../../../errors/hysteria_error";
import { AstParser } from "../../../ast/parser";
import { FromNode } from "../../../ast/query/node/from";
import { TruncateNode } from "../../../ast/query/node/truncate";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { SqlDataSourceType } from "../../../sql_data_source_types";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class PostgresTruncateInterpreter implements Interpreter {
  declare model: typeof Model;
  declare dbType?: SqlDataSourceType;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const truncateNode = node as TruncateNode;

    if (truncateNode.isRawValue && typeof truncateNode.fromNode === "string") {
      return {
        sql: truncateNode.fromNode,
        bindings: [],
      };
    }

    const options = truncateNode.options;

    // CockroachDB's TRUNCATE grammar only carries CASCADE/RESTRICT
    if (
      this.dbType === "cockroachdb" &&
      (options?.restartIdentity || options?.continueIdentity)
    ) {
      throw new HysteriaError(
        "PostgresTruncateInterpreter",
        "TRUNCATE_OPTION_NOT_SUPPORTED",
        new Error("CockroachDB does not support the identity TRUNCATE options"),
      );
    }

    const formattedTable = new InterpreterUtils(
      this.model,
    ).getFromForWriteOperations("postgres", truncateNode.fromNode as FromNode);

    let optionSql = "";
    if (options?.restartIdentity) {
      optionSql += " restart identity";
    } else if (options?.continueIdentity) {
      optionSql += " continue identity";
    }
    if (options?.cascade) {
      optionSql += " cascade";
    }

    return {
      sql: `${formattedTable}${optionSql}`,
      bindings: [],
    };
  }
}

export default new PostgresTruncateInterpreter();
