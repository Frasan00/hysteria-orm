import { AstParser } from "../../../ast/parser";
import {
  JsonMutationNode,
  toJsonPathString,
} from "../../../ast/query/node/json_mutation";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { HysteriaError } from "../../../../errors/hysteria_error";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class MssqlJsonMutationInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const jsonNode = node as JsonMutationNode;
    if (jsonNode.operation !== "set") {
      throw new HysteriaError(
        "MssqlJsonMutationInterpreter::toSql",
        "NOT_SUPPORTED_IN_MSSQL",
        new Error(
          `json${jsonNode.operation === "insert" ? "Insert" : "Remove"} is not supported by mssql; only jsonSet (JSON_MODIFY) is`,
        ),
      );
    }

    const column = new InterpreterUtils(this.model).formatStringColumn(
      "mssql",
      jsonNode.column,
    );
    const path = `'${toJsonPathString(jsonNode.path).replace(/'/g, "''")}'`;

    const isContainer =
      jsonNode.value !== null && typeof jsonNode.value === "object";
    const sql = `JSON_MODIFY(${column}, ${path}, @${jsonNode.currParamIndex})`;
    return {
      sql: this.withAlias(sql, jsonNode.alias),
      bindings: [isContainer ? JSON.stringify(jsonNode.value) : jsonNode.value],
    };
  }

  private withAlias(sql: string, alias?: string): string {
    return alias ? `${sql} as [${alias}]` : sql;
  }
}

export default new MssqlJsonMutationInterpreter();
