import { AstParser } from "../../../ast/parser";
import { FromNode } from "../../../ast/query/node/from";
import { RawNode } from "../../../ast/query/node/raw/raw_node";
import { UpdateNode } from "../../../ast/query/node/update";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { SqlDataSourceType } from "../../../sql_data_source_types";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class PostgresUpdateInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const updateNode = node as UpdateNode;
    if (updateNode.isRawValue && typeof updateNode.fromNode === "string") {
      return {
        sql: updateNode.fromNode as string,
        bindings: updateNode.values,
      };
    }

    const interpreterUtils = new InterpreterUtils(this.model);
    const formattedTable = interpreterUtils.getFromForWriteOperations(
      "postgres",
      updateNode.fromNode as FromNode,
    );

    if (!updateNode.columns.length || !updateNode.values.length) {
      return {
        sql: formattedTable,
        bindings: [],
      };
    }

    const finalBindings: any[] = [];
    let paramCursor = updateNode.currParamIndex;
    const modelColumns =
      typeof this.model?.getColumnsByName === "function"
        ? this.model.getColumnsByName()
        : new Map<string, { type?: unknown }>();
    const setClause = updateNode.columns
      .map((column, index) => {
        const value = updateNode.values[index];
        const formattedColumn = interpreterUtils.formatStringColumn(
          "postgres",
          column,
        );

        if (value instanceof RawNode) {
          return `${formattedColumn} = ${value.rawValue}`;
        }

        if (value instanceof QueryNode) {
          const rendered = new AstParser(
            this.model,
            "postgres" as SqlDataSourceType,
          ).parse([value], paramCursor, true);
          finalBindings.push(...rendered.bindings);
          paramCursor += rendered.bindings.length;
          return `${formattedColumn} = ${rendered.sql}`;
        }

        const placeholder = `$${paramCursor++}`;
        finalBindings.push(value);
        return `${formattedColumn} = ${placeholder}${this.formatTypeCast(
          value,
          modelColumns.get(column)?.type,
        )}`;
      })
      .join(", ");

    const sql = `${formattedTable} set ${setClause}`;

    return {
      sql,
      bindings: finalBindings,
    };
  }

  private formatTypeCast(value: any, columnType?: unknown): string {
    // A `prepare`d non-string payload reaches the driver as a JSON string
    // (jsonColumn.prepare stringifies it). node-pg coerces that text into jsonb,
    // but Bun.sql binds a JS string as a JSON string, storing a double-encoded
    // scalar — `->>` then returns NULL. `::text` first is required: a bare
    // `::jsonb` on an already-string value is a no-op.
    if (
      typeof value === "string" &&
      (columnType === "jsonb" || columnType === "json")
    ) {
      return "::text::jsonb";
    }

    let typeCast = "";
    if (Buffer.isBuffer(value)) {
      typeCast = "::bytea";
    } else if (Array.isArray(value)) {
      typeCast = "::array";
    } else if (
      typeof value === "object" &&
      value !== null &&
      !(value instanceof Date)
    ) {
      typeCast = "::jsonb";
    } else if (typeof value === "boolean") {
      typeCast = "::boolean";
    } else if (typeof value === "bigint") {
      typeCast = "::bigint";
    }

    return typeCast;
  }
}

export default new PostgresUpdateInterpreter();
