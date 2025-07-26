import { AstParser } from "../../../ast/parser";
import type { WhereGroupNode } from "../../../ast/query/node/where/where_group";
import { QueryNode } from "../../../ast/query/query";
import type { SqlDataSourceType } from "../../../sql_data_source_types";
import type { Interpreter } from "../../interpreter";
import { Model } from "../../../models/model";

class SqliteWhereGroupInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const groupNode = node as WhereGroupNode;
    if (!groupNode.nodes || groupNode.nodes.length === 0) {
      return { sql: "", bindings: [] };
    }

    const astParser = new AstParser(this.model, "sqlite" as SqlDataSourceType);
    const { sql, bindings } = astParser.parse(
      groupNode.nodes,
      groupNode.currParamIndex,
      true,
    );

    return {
      sql: `(${sql})`,
      bindings,
    };
  }
}

export default new SqliteWhereGroupInterpreter();
