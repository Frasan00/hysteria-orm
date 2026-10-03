import { AstParser } from "../../../ast/parser";
import {
  JsonMutationNode,
  toJsonPathString,
} from "../../../ast/query/node/json_mutation";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { SqlDataSourceType } from "../../../sql_data_source_types";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

const fnByOperation = {
  set: "JSON_SET",
  insert: "JSON_INSERT",
  remove: "JSON_REMOVE",
} as const;

class MysqlJsonMutationInterpreter implements Interpreter {
  declare model: typeof Model;
  declare dbType?: SqlDataSourceType;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const jsonNode = node as JsonMutationNode;
    const column = new InterpreterUtils(this.model).formatStringColumn(
      "mysql",
      jsonNode.column,
    );
    const path = `'${toJsonPathString(jsonNode.path).replace(/'/g, "''")}'`;
    const fn = fnByOperation[jsonNode.operation];

    if (jsonNode.operation === "remove") {
      return {
        sql: this.withAlias(`${fn}(${column}, ${path})`, jsonNode.alias),
        bindings: [],
      };
    }

    const isContainer =
      jsonNode.value !== null && typeof jsonNode.value === "object";
    // MySQL parses JSON text into a JSON value only when explicitly cast;
    // MariaDB's JSON functions accept the document text directly.
    const valueExpr =
      isContainer && this.dbType !== "mariadb" ? "CAST(? AS JSON)" : "?";
    const binding = isContainer
      ? JSON.stringify(jsonNode.value)
      : jsonNode.value;

    return {
      sql: this.withAlias(
        `${fn}(${column}, ${path}, ${valueExpr})`,
        jsonNode.alias,
      ),
      bindings: [binding],
    };
  }

  private withAlias(sql: string, alias?: string): string {
    return alias ? `${sql} as \`${alias}\`` : sql;
  }
}

export default new MysqlJsonMutationInterpreter();
