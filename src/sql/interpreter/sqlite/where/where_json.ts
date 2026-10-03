import { AstParser } from "../../../ast/parser";
import { WhereJsonNode } from "../../../ast/query/node/where/where_json";
import { QueryNode } from "../../../ast/query/query";
import { HysteriaError } from "../../../../errors/hysteria_error";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";
import { JsonPath } from "../../../../utils/json_path_utils";

class SqliteWhereJsonInterpreter implements Interpreter {
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
      "sqlite",
      whereJsonNode.column,
    );

    switch (whereJsonNode.jsonOperator) {
      case "=":
        sql = `json(${columnSql}) = json(?)`;
        bindings = [JSON.stringify(whereJsonNode.value)];
        break;
      case "contains":
        sql = `json(${columnSql}) = json(?)`;
        bindings = [JSON.stringify(whereJsonNode.value)];
        break;
      case "not contains":
        sql = `json(${columnSql}) = json(?)`;
        bindings = [JSON.stringify(whereJsonNode.value)];
        break;
      case "path": {
        const jsonPath = JsonPath.from(whereJsonNode.path ?? "");
        sql = `json_extract(${columnSql}, '${jsonPath.toSqlite()}') ${whereJsonNode.comparisonOperator ?? "="} ?`;
        bindings = [whereJsonNode.value];
        break;
      }
      case "subset":
      case "has none":
        throw new HysteriaError(
          "WhereJsonInterpreter::unsupported",
          "NOT_SUPPORTED_IN_SQLITE",
        );
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

export default new SqliteWhereJsonInterpreter();
