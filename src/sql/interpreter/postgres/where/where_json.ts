import { AstParser } from "../../../ast/parser";
import { WhereJsonNode } from "../../../ast/query/node/where/where_json";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class PostgresWhereJsonInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const whereJsonNode = node as WhereJsonNode;
    if (whereJsonNode.isRawValue) {
      return {
        sql: whereJsonNode.column,
        bindings: [],
      };
    }

    const idx = whereJsonNode.currParamIndex;
    let sql = "";
    let bindings: any[] = [];

    const columnSql = new InterpreterUtils(this.model).formatStringColumn(
      "postgres",
      whereJsonNode.column,
    );

    switch (whereJsonNode.jsonOperator) {
      case "=":
        // Strict equality - both objects must be exactly equal
        sql = `${columnSql} = $${idx}::jsonb`;
        bindings = [JSON.stringify(whereJsonNode.value)];
        break;
      case "contains":
        sql = `${columnSql} @> $${idx}::jsonb`;
        bindings = [JSON.stringify(whereJsonNode.value)];
        break;
      case "not contains":
        sql = `${columnSql} @> $${idx}::jsonb`;
        bindings = [JSON.stringify(whereJsonNode.value)];
        break;
      case "raw":
        sql = whereJsonNode.column;
        bindings = Array.isArray(whereJsonNode.value)
          ? whereJsonNode.value
          : [];
        break;
    }

    if (whereJsonNode.isNegated) {
      sql = `NOT (${sql})`;
    }

    return { sql: sql.trim(), bindings };
  }
}

export default new PostgresWhereJsonInterpreter();
