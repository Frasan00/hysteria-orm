import { AstParser } from "../../../ast/parser";
import { HavingNode } from "../../../ast/query/node/having/having";
import { SqlFuncNode } from "../../../ast/query/node/sqlfunc/sqlfunc";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class PostgresHavingInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const havingNode = node as HavingNode;
    if (havingNode.isRawValue) {
      return {
        sql: havingNode.column,
        bindings: (havingNode.value as any[]) ?? [],
      };
    }

    const idx = havingNode.currParamIndex;
    const parser = new AstParser(this.model, "postgres");
    const utils = new InterpreterUtils(this.model);

    if (havingNode.group?.length) {
      const { sql, bindings } = parser.parse(
        havingNode.group,
        havingNode.currParamIndex,
        true,
      );
      return { sql: `(${sql})`, bindings };
    }

    const columnSql = utils.formatStringColumn("postgres", havingNode.column);
    let sql = "";
    let bindings: any[] = [];

    if (havingNode.subquery !== undefined) {
      const rendered = this.parseSubquery(parser, havingNode, idx);
      sql = `${havingNode.column ? `${columnSql} ` : ""}${havingNode.operator} (${rendered.sql})`;
      bindings = rendered.bindings;
    } else if (havingNode.value instanceof SqlFuncNode) {
      const rendered = parser.parse([havingNode.value], 1, true).sql;
      sql = `${columnSql} ${havingNode.operator} ${rendered}`;
    } else if (
      havingNode.operator === "is null" ||
      havingNode.operator === "is not null"
    ) {
      sql = `${columnSql} ${havingNode.operator}`;
    } else if (Array.isArray(havingNode.value)) {
      if (
        havingNode.operator === "between" ||
        havingNode.operator === "not between"
      ) {
        sql = `${columnSql} ${havingNode.operator} $${idx} and $${idx + 1}`;
      } else {
        const placeholders = havingNode.value
          .map((_, i) => `$${idx + i}`)
          .join(", ");
        sql = `${columnSql} ${havingNode.operator} (${placeholders})`;
      }
      bindings = havingNode.value;
    } else {
      sql = `${columnSql} ${havingNode.operator} $${idx}`;
      bindings = [havingNode.value];
    }

    if (havingNode.isNegated) {
      sql = `not (${sql})`;
    }

    return { sql: sql.trim(), bindings };
  }

  private parseSubquery(
    parser: AstParser,
    havingNode: HavingNode,
    idx: number,
  ): { sql: string; bindings: any[] } {
    const subquery = havingNode.subquery!;
    if (typeof subquery === "string") {
      return { sql: subquery, bindings: [] };
    }
    const nodes = Array.isArray(subquery) ? subquery : [subquery];
    return parser.parse(nodes, idx);
  }
}

export default new PostgresHavingInterpreter();
