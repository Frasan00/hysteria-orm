import { AstParser } from "../../../ast/parser";
import { WhereJsonNode } from "../../../ast/query/node/where/where_json";
import { QueryNode } from "../../../ast/query/query";
import { HysteriaError } from "../../../../errors/hysteria_error";
import { Model } from "../../../models/model";
import type { SqlDataSourceType } from "../../../sql_data_source_types";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";
import { JsonPath } from "../../../../utils/json_path_utils";

class MysqlWhereJsonInterpreter implements Interpreter {
  declare model: typeof Model;
  declare dbType?: SqlDataSourceType;

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
      "mysql",
      whereJsonNode.column,
    );

    switch (whereJsonNode.jsonOperator) {
      case "=":
        // MySQL compares JSON structurally, so the parameter must be JSON.
        // MariaDB stores JSON as LONGTEXT and rejects CAST(? AS JSON), so it
        // compares the JSON text directly.
        sql =
          this.dbType === "mariadb"
            ? `${columnSql} = ?`
            : `${columnSql} = CAST(? AS JSON)`;
        bindings = [JSON.stringify(whereJsonNode.value)];
        break;
      case "contains":
        sql = `JSON_CONTAINS(${columnSql}, ?)`;
        bindings = [JSON.stringify(whereJsonNode.value)];
        break;
      case "not contains":
        sql = `JSON_CONTAINS(${columnSql}, ?)`;
        bindings = [JSON.stringify(whereJsonNode.value)];
        break;
      case "subset":
        // value contains the column, so the column is a subset of the value
        sql = `JSON_CONTAINS(?, ${columnSql})`;
        bindings = [JSON.stringify(whereJsonNode.value)];
        break;
      case "path": {
        const jsonPath = JsonPath.from(whereJsonNode.path ?? "");
        sql = `JSON_UNQUOTE(JSON_EXTRACT(${columnSql}, '${jsonPath.toMysql()}')) ${whereJsonNode.comparisonOperator ?? "="} ?`;
        bindings = [whereJsonNode.value];
        break;
      }
      case "has none":
        throw new HysteriaError(
          "WhereJsonInterpreter::has none",
          "NOT_SUPPORTED_IN_MYSQL",
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

export default new MysqlWhereJsonInterpreter();
