import logger from "../../../../utils/logger";
import { AstParser } from "../../../ast/parser";
import { QueryNode } from "../../../ast/query/query";
import type { Interpreter } from "../../interpreter";
import { Model } from "../../../models/model";

class SqliteDistinctInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    logger.warn("SQLite does not support DISTINCT ON");
    return {
      sql: "",
      bindings: [],
    };
  }
}

export default new SqliteDistinctInterpreter();
