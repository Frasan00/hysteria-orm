import type { Interpreter } from "../../interpreter";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";

class MysqlSetTableOptionsInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): { sql: string; bindings: any[] } {
    const n = node as any; // SetTableOptionsNode
    const parts: string[] = [];

    if (n.engine) {
      parts.push(`ENGINE=${n.engine}`);
    }
    if (n.charset) {
      parts.push(`CHARSET=${n.charset}`);
    }
    if (n.collate) {
      parts.push(`COLLATE=${n.collate}`);
    }

    return { sql: parts.join(" "), bindings: [] };
  }
}

export default new MysqlSetTableOptionsInterpreter();
