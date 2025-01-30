import { convertCase } from "../../../utils/case_utils";
import logger from "../../../utils/logger";
import { Model } from "../../models/model";
import { getModelColumns, getRelations } from "../../models/model_decorators";
import { ManyToMany } from "../../models/relations/many_to_many";
import { Relation, RelationEnum } from "../../models/relations/relation";
import { RelationQueryBuilder } from "../../query_builder/query_builder";
import { SqlDataSourceType } from "../../sql_data_source_types";
import {
  convertValueToSQL,
  generateHasManyQuery,
  generateManyToManyQuery,
} from "../utils";

function parseValueType(value: any): string {
  return typeof value;
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
    whereQuery: relationQuery.whereQuery || "",
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
  const extractedLimitValue = limitQuery.match(/\d+/)?.[0] as
    | number
    | undefined;
  const extractedOffsetValue = offsetQuery.match(/\d+/)?.[0] || 0;

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
        .join(", ")}) ${whereQuery};
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

      return {
        query: generateHasManyQuery({
          selectQuery,
          relationName,
          relatedModel,
          foreignKey: foreignKey as string,
          typeofModel,
          primaryKeyValues,
          joinQuery,
          whereQuery,
          groupByQuery,
          havingQuery,
          orderByQuery,
          extractedOffsetValue: extractedOffsetValue as number,
          extractedLimitValue: extractedLimitValue as number,
          databaseType: dbType,
        }),

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
          `Many to many relation not found for related model ${relatedModel} and through model ${throughModel}, the error is likely in the relation definition and was called by relation ${relationName} in model ${typeofModel.table}`,
        );
      }

      const relatedModelForeignKey = relatedModelManyToManyRelation.foreignKey;
      const relatedModelColumns = getModelColumns(relation.model).map(
        (column) => column.columnName,
      );

      return {
        query: generateManyToManyQuery({
          dbType: dbType,
          relationName: relationName,
          leftTablePrimaryColumn: convertCase(
            primaryKey,
            typeofModel.databaseCaseConvention,
          ),
          rightTablePrimaryColumn: convertCase(
            relatedModelPrimaryKey,
            typeofModel.databaseCaseConvention,
          ),
          pivotLeftTableColumn: convertCase(
            throughModelPrimaryKey,
            typeofModel.databaseCaseConvention,
          ),
          pivotRightTableColumn: convertCase(
            relatedModelForeignKey,
            typeofModel.databaseCaseConvention,
          ),
          selectedColumns: relationQuery.selectedColumns?.length
            ? relationQuery.selectedColumns
            : relatedModelColumns.map((column) =>
                convertCase(column, typeofModel.databaseCaseConvention),
              ),
          relatedModelColumns: relatedModelColumns.map((column) =>
            convertCase(column, typeofModel.databaseCaseConvention),
          ),
          leftTable: typeofModel.table,
          rightTable: relatedModelTable,
          pivotTable: throughModel,
          whereCondition: whereQuery,
          orderBy: orderByQuery,
          havingQuery: havingQuery,
          limit: extractedLimitValue ? +extractedLimitValue : undefined,
          offset: +extractedOffsetValue || 0,
        }),
        params: params,
      };

    default:
      throw new Error(`Unknown relation type: ${relation.type}`);
  }
}

export default relationTemplates;
