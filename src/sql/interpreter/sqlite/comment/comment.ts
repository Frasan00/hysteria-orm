import { CommentNode } from "../../../ast/query/node/comment";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class SqliteCommentInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): { sql: string; bindings: any[] } {
    const value = (node as CommentNode).value;
    // A line comment runs to end-of-line, so it must be terminated before the
    // rest of the statement; a block comment needs no terminator.
    const isLineComment = value.startsWith("--") || value.startsWith("#");
    return {
      sql: isLineComment ? `${value}\n` : value,
      bindings: [],
    };
  }
}

export default new SqliteCommentInterpreter();
