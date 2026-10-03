import { AstParser } from "../../../ast/parser";
import {
  JsonMutationNode,
  toPgTextArray,
} from "../../../ast/query/node/json_mutation";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class PostgresJsonMutationInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const jsonNode = node as JsonMutationNode;
    const column = new InterpreterUtils(this.model).formatStringColumn(
      "postgres",
      jsonNode.column,
    );
    const path = toPgTextArray(jsonNode.path);

    if (jsonNode.operation === "remove") {
      return {
        sql: this.withAlias(`${column} #- ${path}`, jsonNode.alias),
        bindings: [],
      };
    }

    // jsonb_set always replaces an existing path, so insert-only is expressed
    // as a guarded set: apply only when the path is currently absent.
    const set = `jsonb_set(${column}, ${path}, $${jsonNode.currParamIndex}::jsonb, true)`;
    const sql =
      jsonNode.operation === "set"
        ? set
        : `CASE WHEN ${column} #> ${path} IS NULL THEN ${set} ELSE ${column} END`;

    return {
      sql: this.withAlias(sql, jsonNode.alias),
      bindings: [JSON.stringify(jsonNode.value)],
    };
  }

  private withAlias(sql: string, alias?: string): string {
    return alias ? `${sql} as "${alias}"` : sql;
  }
}

export default new PostgresJsonMutationInterpreter();
