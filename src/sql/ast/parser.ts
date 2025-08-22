import type { Interpreter } from "../interpreter/interpreter";
import { Model } from "../models/model";
import { SqlDataSourceType } from "../sql_data_source_types";
import { interpreterMap } from "./interpreter_map";
import type { AstParserType } from "./parser_types";
import { QueryNode } from "./query/query";

export class AstParser {
  private readonly dbType: SqlDataSourceType;
  private readonly model: typeof Model;

  constructor(model: typeof Model, dbType: SqlDataSourceType) {
    this.dbType = dbType;
    this.model = model;
  }

  parse(
    nodes: (QueryNode | null)[],
    startBindingIndex: number = 1,
    isNestedCondition: boolean = false,
  ): AstParserType {
    if (!nodes.length) {
      return {
        sql: "",
        bindings: [],
      };
    }

    const filteredNodes = nodes.filter((node) => node !== null);
    const sqlParts: string[] = [];
    const allBindings: any[] = [];
    let currentSqlKeyword: string | null = null;

    for (let i = 0; i < filteredNodes.length; i++) {
      const node = filteredNodes[i];
      node.currParamIndex = startBindingIndex + allBindings.length;

      const interpreter: Interpreter =
        interpreterMap[this.mapCommonDbType(this.dbType)][node.folder][
          node.file
        ];

      if (!interpreter) {
        throw new Error(
          `Interpreter not found for ${this.dbType} ${node.keyword}`,
        );
      }

      interpreter.model = this.model;
      const sqlStatement = interpreter.toSql(node);

      const nextNode = filteredNodes[i + 1];
      const isLastOfType = !nextNode || nextNode.keyword !== node.keyword;
      const chainWith = isLastOfType ? "" : nextNode.chainsWith;

      if (
        node.folder === "lock" ||
        node.folder === "on_duplicate" ||
        node.folder === "schema"
      ) {
        sqlParts.push(`${sqlStatement.sql}${chainWith}`);
        allBindings.push(...sqlStatement.bindings);
        currentSqlKeyword = node.keyword;
        continue;
      }

      if (
        currentSqlKeyword !== node.keyword ||
        node.canKeywordBeSeenMultipleTimes
      ) {
        if (isNestedCondition) {
          sqlParts.push(`${sqlStatement.sql}${chainWith}`);
        } else {
          let keywordToEmit = node.keyword;
          if (node.folder === "with") {
            let j = i;
            let hasRecursive = false;
            while (
              j < filteredNodes.length &&
              filteredNodes[j].keyword === node.keyword
            ) {
              const candidate = filteredNodes[j] as any;
              if (
                candidate.folder === "with" &&
                candidate.clause === "recursive"
              ) {
                hasRecursive = true;
                break;
              }
              j++;
            }
            if (hasRecursive) {
              keywordToEmit = `${keywordToEmit} recursive`;
            }
          }
          sqlParts.push(`${keywordToEmit} ${sqlStatement.sql}${chainWith}`);
        }
        currentSqlKeyword = node.keyword;
      } else {
        sqlParts.push(`${sqlStatement.sql}${chainWith}`);
      }

      allBindings.push(...sqlStatement.bindings);
    }

    const finalSql = sqlParts.join(" ");

    return {
      sql: finalSql,
      bindings: allBindings,
    };
  }

  /**
   * Map the database type to a common type if shares the same driver (e.g. mysql and mariadb)
   */
  private mapCommonDbType(dbType: SqlDataSourceType) {
    switch (dbType) {
      case "mariadb":
        return "mysql";
      case "cockroachdb":
        return "postgres";
      default:
        return dbType;
    }
  }
}
