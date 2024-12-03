import { convertCase } from "../../utils/case_utils";
import { SqlDataSourceType } from "../sql_data_source_types";

export function generateManyToManyQuery({
  dbType,
  relationName,
  selectedColumns,
  leftTable,
  leftTablePrimaryColumn,
  rightTablePrimaryColumn,
  pivotLeftTableColumn,
  pivotRightTableColumn,
  rightTable,
  pivotTable,
  whereCondition,
  relatedModelColumns,
  havingQuery,
  limit,
  offset,
  orderBy,
}: {
  dbType: SqlDataSourceType;
  relationName: string;
  selectedColumns: string[];
  leftTable: string;
  leftTablePrimaryColumn: string;
  rightTablePrimaryColumn: string;
  pivotLeftTableColumn: string;
  pivotRightTableColumn: string;
  rightTable: string;
  pivotTable: string;
  relatedModelColumns: string[];
  whereCondition: string;
  havingQuery: string;
  limit?: number;
  offset: number;
  orderBy: string;
}): string {
  let jsonAggFunction = "";
  let jsonObjectFunction = "";
  let jsonAlias = "";

  switch (dbType) {
    case "postgres":
      jsonAggFunction = "json_agg";
      jsonObjectFunction = "json_build_object";
      jsonAlias = "t.json_data";
      break;
    case "mysql":
    case "mariadb":
      jsonAggFunction = "JSON_ARRAYAGG";
      jsonObjectFunction = "JSON_OBJECT";
      jsonAlias = "t.json_data";
      break;
    case "sqlite":
      jsonAggFunction = "JSON_GROUP_ARRAY";
      jsonObjectFunction = "JSON_OBJECT";
      jsonAlias = "JSON(t.json_data)";
      break;
    default:
      throw new Error("Unsupported database type");
  }

  // Prepare selected columns
  const columnsList = selectedColumns
    .map((col) => {
      if (col.includes("*")) {
        return relatedModelColumns
          .map((column) => {
            return `'${column}', ${rightTable}.${column}`;
          })
          .join(",\n            ");
      }

      if (col.toLowerCase().includes("as")) {
        const [column, alias] = col.split(" as ");
        return `'${alias}', ${column}`;
      }

      if (!col.includes(".")) {
        return `'${col}', ${rightTable}.${col}`;
      }

      const alias = col.split(".").pop();
      return `'${alias}', ${col}`;
    })
    .join(",\n            ");

  let limitOffsetClause = "";
  if (limit) {
    limitOffsetClause += `LIMIT ${limit}`;
  }

  if (offset) {
    limitOffsetClause += ` OFFSET ${offset}`;
  }

  let query = `
  SELECT
    ${leftTable}.id AS ${leftTablePrimaryColumn},
    '${relationName}' AS relation_name,
    (
      SELECT ${jsonAggFunction}(${jsonAlias})
      FROM (
        SELECT ${jsonObjectFunction}(
          ${columnsList}
        ) AS json_data
        FROM ${rightTable}
        JOIN ${pivotTable} ON ${pivotTable}.${pivotRightTableColumn} = ${rightTable}.${rightTablePrimaryColumn}
        ${dbType === "mariadb" ? `JOIN ${leftTable} ON ${pivotTable}.${pivotLeftTableColumn} = ${leftTable}.${leftTablePrimaryColumn}` : ""}
        WHERE ${pivotTable}.${pivotLeftTableColumn} = ${leftTable}.${leftTablePrimaryColumn}`;

  if (whereCondition) {
    query += ` AND ${whereCondition.replace("WHERE", "")}`;
  }

  if (havingQuery) {
    query += ` HAVING ${havingQuery}`;
  }

  if (orderBy) {
    query += ` ${orderBy}`;
  }

  query += ` ${limitOffsetClause}
      ) t
    ) AS ${relationName}
  FROM ${leftTable};
  `;

  return query.trim();
}

export function generateHasManyQuery({
  selectQuery,
  relationName,
  relatedModel,
  foreignKey,
  typeofModel,
  primaryKeyValues,
  joinQuery,
  whereQuery,
  groupByQuery,
  havingQuery,
  orderByQuery,
  extractedOffsetValue,
  extractedLimitValue,
  databaseType,
}: {
  selectQuery: string;
  relationName: string;
  relatedModel: string;
  foreignKey: string;
  typeofModel: any;
  primaryKeyValues: Array<{ value: any; type: string }>;
  joinQuery: string;
  whereQuery: string;
  groupByQuery: string;
  havingQuery: string;
  orderByQuery: string;
  extractedOffsetValue: number;
  extractedLimitValue: number;
  databaseType: string;
}): string {
  const foreignKeyConverted = convertCase(
    foreignKey,
    typeofModel.databaseCaseConvention,
  );
  const primaryKeyValuesSQL = primaryKeyValues
    .map(({ value, type }) => convertValueToSQL(value, type))
    .join(", ");

  let rowNumberClause;
  if (databaseType === "mysql" || databaseType === "mariadb") {
    rowNumberClause = `ROW_NUMBER() OVER (PARTITION BY ${relatedModel}.${foreignKeyConverted} ORDER BY ${orderByQuery || `${relatedModel}.${foreignKeyConverted}`}) as row_num`;
  } else {
    rowNumberClause = `ROW_NUMBER() OVER (PARTITION BY ${relatedModel}.${foreignKeyConverted} ORDER BY ${orderByQuery || "1"}) as row_num`;
  }

  const hasManyQuery = `
    WITH CTE AS (
      SELECT ${selectQuery}, '${relationName}' as relation_name,
             ${rowNumberClause}
      FROM ${relatedModel}
      ${joinQuery}
      WHERE ${relatedModel}.${foreignKeyConverted} IN (${primaryKeyValuesSQL})
      ${whereQuery} ${groupByQuery} ${havingQuery}
    )
    SELECT * FROM CTE
    WHERE row_num > ${extractedOffsetValue || 0}
    ${extractedLimitValue ? `AND row_num <= (${extractedOffsetValue || 0} + ${extractedLimitValue})` : ""};
  `;

  return hasManyQuery;
}

export function convertValueToSQL(value: any, type: string): string {
  switch (type) {
    case "string":
      return `'${value}'`;
    case "number":
    case "boolean":
      return `${value}`;
    default:
      throw new Error(`Unsupported value type: ${type}`);
  }
}
