import { AstParser } from "../../../ast/parser";
import type { JoinNode } from "../../../ast/query/node/join/join";
import type { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class MysqlJoinInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const joinNode = node as JoinNode;
    if (joinNode.isRawValue) {
      return new InterpreterUtils(this.model).formatRawPlaceholders(
        "mysql",
        joinNode.table,
        joinNode.bindings ?? [],
        joinNode.currParamIndex,
      );
    }

    const utils = new InterpreterUtils(this.model);
    const subquery =
      joinNode.subquery?.length && !joinNode.isRawValue
        ? new AstParser(this.model, "mysql").parse(
            joinNode.subquery,
            joinNode.currParamIndex,
          )
        : null;
    const tableSql = subquery
      ? `(${subquery.sql}) as ${utils.quoteIdentifier("mysql", joinNode.table)}`
      : utils.formatStringTable(
          "mysql",
          joinNode.schema
            ? `${joinNode.schema}.${joinNode.table}`
            : joinNode.table,
        );
    const tableBindings = subquery?.bindings ?? [];

    if (joinNode.type === "cross") {
      return { sql: tableSql, bindings: tableBindings };
    }

    let sql: string;
    if (joinNode.using?.length) {
      const columns = joinNode.using
        .map((column) => utils.formatStringColumn("mysql", column))
        .join(", ");
      sql = `${tableSql} using (${columns})`;
      return { sql, bindings: tableBindings };
    }

    let leftColumnStr = joinNode.left;
    if (!leftColumnStr.includes(".")) {
      leftColumnStr = `${joinNode.table}.${leftColumnStr}`;
    }

    let rightColumnStr = joinNode.right;
    if (!rightColumnStr.includes(".")) {
      rightColumnStr = `${this.model.table}.${rightColumnStr}`;
    }

    const leftSql = utils.formatStringColumn("mysql", leftColumnStr);
    const rightSql = utils.formatStringColumn("mysql", rightColumnStr);

    sql = `${tableSql} on ${leftSql} ${joinNode.on?.operator} ${rightSql}`;
    const bindings: any[] = [...tableBindings];

    // Process additional conditions if present
    if (
      joinNode.additionalConditions &&
      joinNode.additionalConditions.length > 0
    ) {
      const parser = new AstParser(this.model, "mysql");
      for (const condition of joinNode.additionalConditions) {
        const result = parser.parse(
          [condition],
          joinNode.currParamIndex + bindings.length,
        );
        if (result.sql) {
          // Remove 'where ' or 'where' prefix from the SQL since we're in a join clause
          const conditionSql = result.sql.replace(/^where\s+/i, "");
          sql += ` and ${conditionSql}`;
          bindings.push(...result.bindings);
        }
      }
    }

    return { sql, bindings };
  }
}

export default new MysqlJoinInterpreter();
