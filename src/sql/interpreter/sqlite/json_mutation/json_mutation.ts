import { AstParser } from "../../../ast/parser";
import {
  JsonMutationNode,
  toJsonPathString,
} from "../../../ast/query/node/json_mutation";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

const fnByOperation = {
  set: "json_set",
  insert: "json_insert",
  remove: "json_remove",
} as const;

class SqliteJsonMutationInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const jsonNode = node as JsonMutationNode;
    const column = new InterpreterUtils(this.model).formatStringColumn(
      "sqlite",
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
    // SQLite stores a bare text binding as a JSON string; `json(?)` makes it a
    // document for objects/arrays, while scalars are bound as-is.
    const valueExpr = isContainer ? "json(?)" : "?";
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
    return alias ? `${sql} as "${alias}"` : sql;
  }
}

export default new SqliteJsonMutationInterpreter();
