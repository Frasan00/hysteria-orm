import { AstParser } from "../../../ast/parser";
import { WhereJsonNode } from "../../../ast/query/node/where/where_json";
import { QueryNode } from "../../../ast/query/query";
import { HysteriaError } from "../../../../errors/hysteria_error";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";
import { JsonPath } from "../../../../utils/json_path_utils";

class MssqlWhereJsonInterpreter implements Interpreter {
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
      "mssql",
      whereJsonNode.column,
    );

    switch (whereJsonNode.jsonOperator) {
      case "=":
        sql = `${columnSql} = @${idx}`;
        bindings = [JSON.stringify(whereJsonNode.value)];
        break;
      case "contains":
      case "not contains":
        sql = `CHARINDEX(@${idx}, ${columnSql}) > 0`;
        bindings = [JSON.stringify(whereJsonNode.value)];
        break;
      case "path": {
        const jsonPath = JsonPath.from(whereJsonNode.path ?? "");
        sql = `JSON_VALUE(${columnSql}, '${jsonPath.toMssql()}') ${whereJsonNode.comparisonOperator ?? "="} @${idx}`;
        bindings = [whereJsonNode.value];
        break;
      }
      case "subset":
      case "has none":
        throw new HysteriaError(
          "WhereJsonInterpreter::unsupported",
          "NOT_SUPPORTED_IN_MSSQL",
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

export default new MssqlWhereJsonInterpreter();
