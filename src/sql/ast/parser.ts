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

    const distinctOnNode = nodes.find(
      (node): node is QueryNode & { columns: string[] } =>
        !!node && node.folder === "distinctOn",
    );
    const distinctNode =
      !distinctOnNode &&
      nodes.find(
        (node): node is QueryNode => !!node && node.folder === "distinct",
      );

    // For MSSQL, extract lock node to inject as table hints after FROM clause
    const lockNode =
      this.dbType === "mssql"
        ? (nodes.find(
            (
              node,
            ): node is QueryNode & {
              lockType: string;
              skipLocked?: boolean;
              noWait?: boolean;
            } => !!node && node.folder === "lock",
          ) ?? null)
        : null;
    const mssqlTableHints = lockNode ? this.getMssqlTableHints(lockNode) : "";

    const filteredNodes = nodes.filter(
      (node): node is QueryNode =>
        node !== null &&
        node.folder !== "distinct" &&
        node.folder !== "distinctOn",
    );

    const hasOffset = filteredNodes.some((n) => n.folder === "offset");
    const hasOrderBy = filteredNodes.some((n) => n.folder === "order_by");
    const limitNode = filteredNodes.find((n) => n.folder === "limit") as
      | (QueryNode & { limit: number })
      | undefined;
    const offsetNode = filteredNodes.find((n) => n.folder === "offset") as
      | (QueryNode & { offset: number })
      | undefined;
    const useMssqlTop =
      this.dbType === "mssql" && limitNode && !hasOffset && !hasOrderBy;
    const useMssqlOffsetFetch =
      this.dbType === "mssql" && !useMssqlTop && (limitNode || offsetNode);
    // Oracle 12c+ uses standard OFFSET/FETCH syntax like MSSQL
    const useOracleOffsetFetch =
      this.dbType === "oracledb" && (limitNode || offsetNode);

    const sqlParts: string[] = [];
    const allBindings: any[] = [];
    let currentSqlKeyword: string | null = null;

    if (useMssqlTop && limitNode) {
      allBindings.push(limitNode.limit);
    }

    for (let i = 0; i < filteredNodes.length; i++) {
      const node = filteredNodes[i];

      if (useMssqlTop && node.folder === "limit") {
        continue;
      }

      if (
        useMssqlOffsetFetch &&
        (node.folder === "limit" || node.folder === "offset")
      ) {
        continue;
      }

      if (
        useOracleOffsetFetch &&
        (node.folder === "limit" || node.folder === "offset")
      ) {
        continue;
      }

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

      if (!sqlStatement.sql || !sqlStatement.sql.trim().length) {
        continue;
      }

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
            // MSSQL doesn't use RECURSIVE keyword - recursion is implicit
            if (this.dbType !== "mssql") {
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
          }

          if (keywordToEmit === "select") {
            const topClause = useMssqlTop ? `top (@${startBindingIndex}) ` : "";
            if (distinctOnNode) {
              const columns = Array.isArray((distinctOnNode as any).columns)
                ? (distinctOnNode as any).columns.join(", ")
                : "";
              sqlParts.push(
                `select ${topClause}distinct on (${columns}) ${sqlStatement.sql}${chainWith}`,
              );
            } else if (distinctNode) {
              sqlParts.push(
                `select ${topClause}distinct ${sqlStatement.sql}${chainWith}`,
              );
            } else {
              sqlParts.push(
                `select ${topClause}${sqlStatement.sql}${chainWith}`,
              );
            }
          } else if (keywordToEmit === "from" && mssqlTableHints) {
            // For MSSQL, inject table hints after the FROM clause table name
            sqlParts.push(
              `${keywordToEmit} ${sqlStatement.sql}${mssqlTableHints}${chainWith}`,
            );
          } else {
            sqlParts.push(`${keywordToEmit} ${sqlStatement.sql}${chainWith}`);
          }
        }
        currentSqlKeyword = node.keyword;
      } else {
        sqlParts.push(`${sqlStatement.sql}${chainWith}`);
      }

      allBindings.push(...sqlStatement.bindings);
    }

    if (useMssqlOffsetFetch) {
      if (!hasOrderBy) {
        sqlParts.push("order by (select null)");
      }

      const offsetVal = offsetNode?.offset ?? 0;
      allBindings.push(offsetVal);
      const offsetParamIdx = startBindingIndex + allBindings.length - 1;
      let paginationSql = `offset @${offsetParamIdx} rows`;

      if (limitNode) {
        allBindings.push(limitNode.limit);
        const limitParamIdx = startBindingIndex + allBindings.length - 1;
        paginationSql += ` fetch next @${limitParamIdx} rows only`;
      }

      sqlParts.push(paginationSql);
    }

    if (useOracleOffsetFetch) {
      if (!hasOrderBy) {
        sqlParts.push("order by null");
      }

      const offsetVal = offsetNode?.offset ?? 0;
      allBindings.push(offsetVal);
      const offsetParamIdx = startBindingIndex + allBindings.length - 1;
      let paginationSql = `offset :${offsetParamIdx} rows`;

      if (limitNode) {
        allBindings.push(limitNode.limit);
        const limitParamIdx = startBindingIndex + allBindings.length - 1;
        paginationSql += ` fetch next :${limitParamIdx} rows only`;
      }

      sqlParts.push(paginationSql);
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

  /**
   * @description Generates MSSQL table hints from lock node
   * MSSQL uses WITH (UPDLOCK), WITH (HOLDLOCK), etc. as table hints
   * READPAST is the MSSQL equivalent of SKIP LOCKED
   */
  private getMssqlTableHints(
    lockNode: QueryNode & {
      lockType: string;
      skipLocked?: boolean;
      noWait?: boolean;
    },
  ): string {
    const hints: string[] = [];

    switch (lockNode.lockType) {
      case "UPDATE":
        hints.push("UPDLOCK");
        break;
      case "SHARE":
        hints.push("HOLDLOCK");
        break;
      case "NO_KEY_UPDATE":
        hints.push("UPDLOCK");
        break;
      case "KEY_SHARE":
        hints.push("HOLDLOCK");
        break;
    }

    if (lockNode.skipLocked) {
      hints.push("READPAST");
    }

    // NOWAIT is handled via SET LOCK_TIMEOUT 0, not as a table hint
    // but we can add NOWAIT hint for newer MSSQL versions
    if (lockNode.noWait) {
      hints.push("NOWAIT");
    }

    return hints.length > 0 ? ` with (${hints.join(", ")})` : "";
  }
}
