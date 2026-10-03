import { AstParser } from "../../../ast/parser";
import { WhereJsonNode } from "../../../ast/query/node/where/where_json";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";
import { JsonPath } from "../../../../utils/json_path_utils";

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
      case "subset":
        sql = `${columnSql} <@ $${idx}::jsonb`;
        bindings = [JSON.stringify(whereJsonNode.value)];
        break;
      case "path": {
        const jsonPath = JsonPath.from(whereJsonNode.path ?? "");
        sql = `${columnSql}${jsonPath.toPostgres(true)} ${whereJsonNode.comparisonOperator ?? "="} $${idx}`;
        bindings = [whereJsonNode.value];
        break;
      }
      case "has none": {
        const keys = (whereJsonNode.value as unknown as string[]) ?? [];
        const placeholders = keys.map((_, i) => `$${idx + i}`).join(", ");
        // jsonb_exists_any is the function form of the `?|` operator; the
        // operator cannot be used here because the pg adapter rewrites `?`.
        sql = `not (jsonb_exists_any(${columnSql}, array[${placeholders}]))`;
        bindings = keys;
        break;
      }
      case "raw":
        sql = whereJsonNode.column;
        bindings = Array.isArray(whereJsonNode.value)
          ? whereJsonNode.value
          : [];
        break;
    }

    if (whereJsonNode.isNegated) {
      sql = `not (${sql})`;
    }

    return { sql: sql.trim(), bindings };
  }
}

export default new PostgresWhereJsonInterpreter();
