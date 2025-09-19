import { AstParser } from "../../../ast/parser";
import type { WhereSubqueryNode } from "../../../ast/query/node/where/where_subquery";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { SqlDataSourceType } from "../../../sql_data_source_types";
import type { Interpreter } from "../../interpreter";

class SqliteWhereSubqueryInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const subqueryNode = node as WhereSubqueryNode;

    if (this.isStringSubquery(subqueryNode.subquery)) {
      return this.handleStringSubquery(subqueryNode);
    }

    if (this.isArraySubquery(subqueryNode.subquery)) {
      return this.handleArraySubquery(subqueryNode);
    }

    return this.handleObjectSubquery(subqueryNode);
  }

  private isStringSubquery(
    subquery: string | QueryNode | QueryNode[],
  ): subquery is string {
    return typeof subquery === "string";
  }

  private isArraySubquery(
    subquery: string | QueryNode | QueryNode[],
  ): subquery is QueryNode[] {
    return Array.isArray(subquery);
  }

  private handleStringSubquery(
    subqueryNode: WhereSubqueryNode,
  ): ReturnType<typeof AstParser.prototype.parse> {
    const sql = `${subqueryNode.column} ${subqueryNode.operator} (${subqueryNode.subquery})`;
    return { sql: sql.trim(), bindings: [] };
  }

  private handleArraySubquery(
    subqueryNode: WhereSubqueryNode,
  ): ReturnType<typeof AstParser.prototype.parse> {
    const astParser = new AstParser(this.model, "sqlite" as SqlDataSourceType);
    const { sql: subquerySql, bindings: subqueryBindings } = astParser.parse(
      subqueryNode.subquery as QueryNode[],
      subqueryNode.currParamIndex,
    );

    const sql = `${subqueryNode.column} ${subqueryNode.operator} (${subquerySql})`;
    return { sql: sql.trim(), bindings: subqueryBindings };
  }

  private handleObjectSubquery(
    subqueryNode: WhereSubqueryNode,
  ): ReturnType<typeof AstParser.prototype.parse> {
    const astParser = new AstParser(this.model, "sqlite" as SqlDataSourceType);
    const { sql: subquerySql, bindings: subqueryBindings } = astParser.parse(
      [subqueryNode.subquery as QueryNode],
      subqueryNode.currParamIndex,
    );

    const sql = `${subqueryNode.column} ${subqueryNode.operator} (${subquerySql})`;
    return { sql: sql.trim(), bindings: subqueryBindings };
  }
}

export default new SqliteWhereSubqueryInterpreter();
