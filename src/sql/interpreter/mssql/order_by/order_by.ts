import { AstParser } from "../../../ast/parser";
import type { OrderByNode } from "../../../ast/query/node/order_by/order_by";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class MssqlOrderByInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const orderByNode = node as OrderByNode;
    if (orderByNode.isRawValue) {
      return {
        sql: orderByNode.column,
        bindings: [],
      };
    }

    const columnSql = new InterpreterUtils(this.model).formatStringColumn(
      "mssql",
      orderByNode.column,
    );
    const directionSql = orderByNode.direction.toLowerCase();

    if (orderByNode.nulls) {
      // T-SQL has no `nulls first/last` and no bare boolean, so nulls are ranked by a case
      const nullsRank = orderByNode.nulls === "first" ? "desc" : "asc";
      const rank = `case when ${columnSql} is null then 1 else 0 end ${nullsRank}`;

      return {
        sql: `${rank}, ${columnSql} ${directionSql}`,
        bindings: [],
      };
    }

    return {
      sql: `${columnSql} ${directionSql}`,
      bindings: [],
    };
  }
}

export default new MssqlOrderByInterpreter();
