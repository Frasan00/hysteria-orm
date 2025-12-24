import { JsonPath } from "../../../../utils/json_path_utils";
import { AstParser } from "../../../ast/parser";
import { SelectJsonNode } from "../../../ast/query/node/select/select_json";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class SqliteSelectJsonInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const selectJsonNode = node as SelectJsonNode;

    if (selectJsonNode.isRawValue) {
      return {
        sql: this.formatWithAlias(selectJsonNode.column, selectJsonNode.alias),
        bindings: [],
      };
    }

    const columnSql = new InterpreterUtils(this.model).formatStringColumn(
      "sqlite",
      selectJsonNode.column,
    );

    const jsonPath = JsonPath.from(selectJsonNode.jsonPath);
    let sql = "";

    switch (selectJsonNode.jsonOperator) {
      case "extract":
        sql = this.buildExtractSql(columnSql, jsonPath);
        break;
      case "extract_text":
        sql = this.buildExtractTextSql(columnSql, jsonPath);
        break;
      case "array_length":
        sql = this.buildArrayLengthSql(columnSql, jsonPath);
        break;
      case "object_keys":
        sql = this.buildObjectKeysSql(columnSql, jsonPath);
        break;
      case "raw":
        sql = selectJsonNode.column;
        break;
    }

    return {
      sql: this.formatWithAlias(sql, selectJsonNode.alias),
      bindings: [],
    };
  }

  private buildExtractSql(column: string, jsonPath: JsonPath): string {
    const pathStr = jsonPath.toSqlite();

    if (pathStr === "$") {
      return column;
    }

    return `json_extract(${column}, '${pathStr}')`;
  }

  private buildExtractTextSql(column: string, jsonPath: JsonPath): string {
    return this.buildExtractSql(column, jsonPath);
  }

  private buildArrayLengthSql(column: string, jsonPath: JsonPath): string {
    const pathStr = jsonPath.toSqlite();

    if (pathStr === "$") {
      return `json_array_length(${column})`;
    }

    return `json_array_length(${column}, '${pathStr}')`;
  }

  private buildObjectKeysSql(column: string, jsonPath: JsonPath): string {
    const extractedPath = this.buildExtractSql(column, jsonPath);
    return `json_each.key FROM json_each(${extractedPath})`;
  }

  private formatWithAlias(sql: string, alias?: string): string {
    if (alias && alias.length > 0) {
      return `${sql} as "${alias}"`;
    }
    return sql;
  }
}

export default new SqliteSelectJsonInterpreter();
