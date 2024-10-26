import { convertCase } from "../../../utils/case_utils";
import logger from "../../../utils/logger";
import { Model } from "../../models/model";
import { getModelColumns, getRelations } from "../../models/model_decorators";
import { ManyToMany } from "../../models/relations/many_to_many";
import { Relation, RelationEnum } from "../../models/relations/relation";
import { RelationQueryBuilder } from "../../query_builder/query_builder";
import { SqlDataSourceType } from "../../sql_data_source";

function parseValueType(value: any): string {
  return typeof value;
}

function convertValueToSQL(value: any, type: string): string {
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

/**
 * TODO: MAKE THIS BETTER IN THE FUTURE
 */
function getJsonAggregate(
  column: string,
  aggregate: string,
  dbType: SqlDataSourceType,
  modelColumns: string[],
  typeofModel: typeof Model,
) {
  column = convertCase(column, typeofModel.databaseCaseConvention);

  const parsedColumns = modelColumns.map((column) => {
    const functionAliasMatch = column.match(/^(\w+\([^()]+\))\s+as\s+(\w+)$/i);
    const aliasMatch = column.match(/^(.+?)\s+as\s+(\w+)$/i);

    if (functionAliasMatch) {
      const func = functionAliasMatch[1];
      const alias = functionAliasMatch[2];
      return { expression: func, alias, isAggregate: true };
    }

    if (aliasMatch) {
      const original = convertCase(
        aliasMatch[1],
        typeofModel.databaseCaseConvention,
      );
      const alias = aliasMatch[2];
      return { expression: original, alias, isAggregate: false };
    }

    const original = convertCase(column, typeofModel.databaseCaseConvention);
    return { expression: original, alias: column, isAggregate: false };
  });

  const aggregateColumns = parsedColumns.filter((column) => column.isAggregate);
  const nonAggregateColumns = parsedColumns.filter(
    (column) => !column.isAggregate,
  );

  const buildJsonObject = nonAggregateColumns
    .map(({ expression, alias }) => {
      const hasDot = expression.includes(".");
      const valueExpression = hasDot
        ? expression
        : `${aggregate}.${expression}`;
      return `'${alias}', ${valueExpression}`;
    })
    .join(", ");

  const aggregateExpressions = aggregateColumns
    .map(({ expression, alias }) => `${expression} as "${alias}"`)
    .join(", ");

  let jsonAggregate = "";
  switch (dbType) {
    case "postgres":
      jsonAggregate = `json_agg(json_build_object(${buildJsonObject})) as ${aggregate}`;
      break;
    case "mysql":
    case "mariadb":
      jsonAggregate = `JSON_ARRAYAGG(JSON_OBJECT(${buildJsonObject})) as ${aggregate}`;
      break;
    case "sqlite":
      jsonAggregate = `json_group_array(
  json_object(${buildJsonObject})
) as ${aggregate}`;
      break;
    default:
      throw new Error(`Unsupported database type: ${dbType}`);
  }

  return `${jsonAggregate}${aggregateExpressions ? ", " + aggregateExpressions : ""}`;
}

function parseRelationQuery(relationQuery: RelationQueryBuilder): {
  selectQuery: string;
  whereQuery: string;
  joinQuery: string;
  orderByQuery: string;
  groupByQuery: string;
  limitQuery: string;
  offsetQuery: string;
  havingQuery: string;
} {
  const selectQuery = relationQuery.selectedColumns?.join(", ") || "*";
  const whereQuery = relationQuery.whereQuery
    ? `${relationQuery.whereQuery.replace(/WHERE/g, "AND")}`
    : "";
  const joinQuery = relationQuery.joinQuery ? relationQuery.joinQuery : "";
  const orderByQuery = relationQuery.orderByQuery
    ? `ORDER BY ${relationQuery.orderByQuery}`
    : "";
  const groupByQuery = relationQuery.groupByQuery
    ? `GROUP BY ${relationQuery.groupByQuery}`
    : "";
  const limitQuery = relationQuery.limitQuery
    ? `LIMIT ${relationQuery.limitQuery}`
    : "";
  const offsetQuery = relationQuery.offsetQuery
    ? `OFFSET ${relationQuery.offsetQuery}`
    : "";
  const havingQuery = relationQuery.havingQuery
    ? `HAVING ${relationQuery.havingQuery}`
    : "";

  return {
    selectQuery,
    whereQuery,
    joinQuery,
    orderByQuery,
    groupByQuery,
    limitQuery,
    offsetQuery,
    havingQuery,
  };
}

function relationTemplates<T extends Model>(
  models: T[],
  relation: Relation,
  relationName: string,
  relationQuery: RelationQueryBuilder,
  typeofModel: typeof Model,
  dbType: SqlDataSourceType,
): {
  query: string;
  params: any[];
} {
  const primaryKey = relation.model.primaryKey;
  const foreignKey = relation.foreignKey as keyof T;
  const relatedModel = relation.relatedModel;
  const {
    selectQuery,
    whereQuery,
    joinQuery,
    orderByQuery,
    groupByQuery,
    limitQuery,
    offsetQuery,
    havingQuery,
  } = parseRelationQuery(relationQuery);
  const params = relationQuery.params || [];

  const primaryKeyValues = models.map((model) => {
    const value =
      model[
        convertCase(primaryKey, typeofModel.modelCaseConvention) as keyof T
      ];
    return { value, type: parseValueType(value) };
  });

  const foreignKeyValues = models.map((model) => {
    const value =
      model[
        convertCase(foreignKey, typeofModel.modelCaseConvention) as keyof T
      ];
    return { value, type: parseValueType(value) };
  });

  switch (relation.type) {
    case RelationEnum.hasOne:
      if (primaryKeyValues.some(({ value }) => !value)) {
        logger.error(
          `Foreign key values are missing for has one relation: ${relationName} ${foreignKeyValues}`,
        );
        throw new Error(
          `Foreign key values are missing for has one relation: ${relationName} ${foreignKeyValues}`,
        );
      }

      if (!primaryKey) {
        throw new Error(
          `Related Model ${relatedModel} does not have a primary key`,
        );
      }

      if (!foreignKeyValues.length) {
        return {
          query: "",
          params: params,
        };
      }

      const query = `SELECT ${selectQuery}, '${relationName}' as relation_name FROM ${relatedModel} 
${joinQuery} WHERE ${relatedModel}.${convertCase(
        foreignKey,
        typeofModel.databaseCaseConvention,
      )} IN (${primaryKeyValues
        .map(({ value, type }) => convertValueToSQL(value, type))
        .join(
          ", ",
        )}) ${whereQuery} ${groupByQuery} ${havingQuery} ${orderByQuery} ${limitQuery} ${offsetQuery};
      `;

      return {
        query,
        params,
      };

    case RelationEnum.belongsTo:
      if (foreignKeyValues.some(({ value }) => !value)) {
        logger.error(
          `Foreign key values are missing for belongs to relation: ${relationName} ${foreignKeyValues}`,
        );
        throw new Error(
          `Foreign key values are missing for belongs to relation: ${relationName} ${foreignKeyValues}`,
        );
      }

      if (!primaryKey) {
        throw new Error(
          `Related Model ${relatedModel} does not have a primary key`,
        );
      }

      if (!foreignKeyValues.length) {
        return {
          query: "",
          params: [],
        };
      }

      const belongsToQuery = `SELECT ${selectQuery}, '${relationName}' as relation_name FROM ${relatedModel} 
${joinQuery}  WHERE ${relatedModel}.${primaryKey} IN (${foreignKeyValues
        .map(({ value, type }) => convertValueToSQL(value, type))
        .join(
          ", ",
        )}) ${whereQuery} ${groupByQuery} ${havingQuery} ${orderByQuery} ${limitQuery} ${offsetQuery};
`;

      return {
        query: belongsToQuery,
        params: params,
      };

    case RelationEnum.hasMany:
      if (primaryKeyValues.some(({ value }) => !value)) {
        logger.error(
          `Primary key values are missing for has many relation: ${relationName} ${primaryKeyValues}`,
        );
        throw new Error(
          `Primary key values are missing for has many relation: ${relationName} ${primaryKeyValues}`,
        );
      }

      if (!primaryKeyValues.length) {
        return {
          query: "",
          params: [],
        };
      }

      const hasManyQuery = `SELECT ${selectQuery}, '${relationName}' as relation_name FROM ${relatedModel} 
${joinQuery} 
WHERE ${relatedModel}.${convertCase(
        foreignKey,
        typeofModel.databaseCaseConvention,
      )} IN (${primaryKeyValues
        .map(({ value, type }) => convertValueToSQL(value, type))
        .join(
          ", ",
        )}) ${whereQuery} ${groupByQuery} ${havingQuery} ${orderByQuery} ${limitQuery} ${offsetQuery};
      `;

      return {
        query: hasManyQuery,
        params: params,
      };

    case RelationEnum.manyToMany:
      if (primaryKeyValues.some(({ value }) => !value)) {
        logger.error(
          `Primary key values are missing for many to many relation: ${relationName} ${primaryKeyValues}`,
        );
        throw new Error(
          `Primary key values are missing for many to many relation: ${relationName} ${primaryKeyValues}`,
        );
      }

      if (!primaryKeyValues.length) {
        return {
          query: "",
          params: [],
        };
      }

      const throughModel = (relation as ManyToMany).throughModel;
      const throughModelPrimaryKey = (relation as ManyToMany).foreignKey;
      const relatedModelTable = (relation as ManyToMany).relatedModel;
      const relatedModelPrimaryKey = (relation as ManyToMany).model.primaryKey;

      const relatedModeRelations = getRelations(relation.model);
      const relatedModelManyToManyRelation = relatedModeRelations.find(
        (relation) =>
          relation.type === RelationEnum.manyToMany &&
          (relation as ManyToMany).throughModel === throughModel,
      );

      if (
        !relatedModelManyToManyRelation ||
        !relatedModelManyToManyRelation.foreignKey
      ) {
        throw new Error(
          `Many to many relation not found for related model ${relatedModel} and through model ${throughModel}, the error is likely in the relation definition and was called by relation ${relationName} in model ${typeofModel.tableName}`,
        );
      }

      const relatedModelForeignKey = relatedModelManyToManyRelation.foreignKey;
      const relatedModelColumns = getModelColumns(relation.model);

      const manyToManyQuery = `SELECT ${throughModel}.${convertCase(
        throughModelPrimaryKey,
        typeofModel.databaseCaseConvention,
      )} as ${primaryKey}, ${getJsonAggregate(
        `${relatedModelTable}.*`,
        relationName,
        dbType,
        selectQuery === "*" || !selectQuery
          ? relatedModelColumns
          : selectQuery.split(", "),
        typeofModel,
      )}, '${relationName}' as relation_name
FROM ${throughModel}
LEFT JOIN ${relatedModelTable} ON ${throughModel}.${convertCase(
        relatedModelForeignKey,
        typeofModel.databaseCaseConvention,
      )} = ${relatedModelTable}.${convertCase(
        relatedModelPrimaryKey,
        typeofModel.databaseCaseConvention,
      )}
${joinQuery} WHERE ${throughModel}.${convertCase(
        throughModelPrimaryKey,
        typeofModel.databaseCaseConvention,
      )} IN (${primaryKeyValues
        .map(({ value, type }) => convertValueToSQL(value, type))
        .join(", ")}) ${whereQuery} ${`GROUP BY ${throughModel}.${convertCase(
        throughModelPrimaryKey,
        typeofModel.databaseCaseConvention,
      )} ${groupByQuery.replace("GROUP BY", "")}`} ${havingQuery} ${`ORDER BY ${throughModel}.${convertCase(
        throughModelPrimaryKey,
        typeofModel.databaseCaseConvention,
      )} ${orderByQuery.replace("ORDER BY", "")}`} ${limitQuery} ${offsetQuery};
      `;

      return {
        query: manyToManyQuery,
        params: params,
      };

    default:
      throw new Error(`Unknown relation type: ${relation.type}`);
  }
}

export default relationTemplates;
