import logger from "../../../../utils/logger";
import { AstParser } from "../../../ast/parser";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MySqlDistinctInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    logger.warn("MySQL does not support DISTINCT ON");
    return {
      sql: "",
      bindings: [],
    };
  }
}

export default new MySqlDistinctInterpreter();
