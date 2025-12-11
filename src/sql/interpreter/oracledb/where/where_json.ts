import { AstParser } from "../../../ast/parser";
import { WhereJsonNode } from "../../../ast/query/node/where/where_json";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class OracleWhereJsonInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const whereJsonNode = node as WhereJsonNode;
    if (whereJsonNode.isRawValue) {
      return {
        sql: whereJsonNode.column,
        bindings: [],
      };
    }

    let sql = "";
    let bindings: any[] = [];

    const columnSql = new InterpreterUtils(this.model).formatStringColumn(
      "oracledb",
      whereJsonNode.column,
    );

    // Oracle 12c+ JSON support using JSON_EXISTS and JSON_EQUAL
    switch (whereJsonNode.jsonOperator) {
      case "=":
        // JSON_EQUAL for strict equality (Oracle 12.2+)
        sql = `JSON_EQUAL(${columnSql}, ?)`;
        bindings = [JSON.stringify(whereJsonNode.value)];
        break;
      case "contains":
        // JSON_EXISTS to check if JSON contains value
        sql = `JSON_EXISTS(${columnSql}, '$?(@ == $val)' PASSING ? AS "val")`;
        bindings = [JSON.stringify(whereJsonNode.value)];
        break;
      case "not contains":
        sql = `NOT JSON_EXISTS(${columnSql}, '$?(@ == $val)' PASSING ? AS "val")`;
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

export default new OracleWhereJsonInterpreter();
