import logger from "../../../../utils/logger";
import { AstParser } from "../../../ast/parser";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MssqlDistinctOnInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    logger.warn(
      "MSSQL does not support DISTINCT ON. This clause will be ignored.",
    );

    return {
      sql: "",
      bindings: [],
    };
  }
}

export default new MssqlDistinctOnInterpreter();
