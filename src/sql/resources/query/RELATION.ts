import { HysteriaError } from "../../../errors/hysteria_error";
import { convertCase } from "../../../utils/case_utils";
import logger from "../../../utils/logger";
import {
  getModelColumns,
  getRelations,
} from "../../models/decorators/model_decorators";
import { Model } from "../../models/model";
import { RelationQueryBuilder } from "../../models/model_query_builder/model_query_builder_types";
import { ManyToMany } from "../../models/relations/many_to_many";
import { Relation, RelationEnum } from "../../models/relations/relation";
import type { SqlDataSourceType } from "../../sql_data_source_types";
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

  const modelColumns = getModelColumns(typeofModel);
  const modelColumnsMap = new Map(
    modelColumns.map((modelColumn) => [modelColumn.columnName, modelColumn]),
  );

  const mappedPrimaryKey =
    modelColumnsMap.get(
      convertCase(primaryKey, typeofModel.modelCaseConvention) || "",
    )?.databaseName ??
    convertCase(primaryKey, typeofModel.databaseCaseConvention);

  const mappedForeignKey =
    modelColumnsMap.get(
      convertCase(foreignKey, typeofModel.modelCaseConvention) || "",
    )?.databaseName ??
    convertCase(foreignKey, typeofModel.databaseCaseConvention);

  const primaryKeyValues = models.map((model) => {
    const value = model[mappedPrimaryKey as keyof T];
    return { value, type: parseValueType(value) };
  });

  const foreignKeyValues = models.map((model) => {
    const value = model[mappedForeignKey as keyof T];
    return { value, type: parseValueType(value) };
  });

  switch (relation.type) {
    case RelationEnum.hasOne:
      if (primaryKeyValues.some(({ value }) => !value)) {
        logger.error(
          `Foreign key values are missing for has one relation: ${relationName} ${foreignKeyValues}`,
        );
        throw new HysteriaError(
          "RelationTemplate::hasOne",
          `FOREIGN_KEY_VALUES_MISSING_FOR_HAS_ONE_RELATION_${relationName}`,
        );
      }

      if (!primaryKey) {
        throw new HysteriaError(
          "RelationTemplate::hasOne",
          `RELATED_MODEL_DOES_NOT_HAVE_A_PRIMARY_KEY_${relatedModel}`,
        );
      }

      if (!foreignKeyValues.length) {
        return {
          query: "",
          params: params,
        };
      }

      const query = `SELECT ${selectQuery}, '${relationName}' as relation_name FROM ${relatedModel}
${joinQuery} WHERE ${relatedModel}.${mappedForeignKey} IN (${primaryKeyValues
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
        throw new HysteriaError(
          "RelationTemplate::belongsTo",
          `FOREIGN_KEY_VALUES_MISSING_FOR_BELONGS_TO_RELATION_${relationName}`,
        );
      }

      if (!primaryKey) {
        throw new HysteriaError(
          "RelationTemplate::belongsTo",
          `RELATED_MODEL_DOES_NOT_HAVE_A_PRIMARY_KEY_${relatedModel}`,
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
        throw new HysteriaError(
          "RelationTemplate::hasMany",
          `PRIMARY_KEY_VALUES_MISSING_FOR_HAS_MANY_RELATION_${relationName}`,
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
        throw new HysteriaError(
          "RelationTemplate::manyToMany",
          `PRIMARY_KEY_VALUES_MISSING_FOR_MANY_TO_MANY_RELATION_${relationName}`,
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
        throw new HysteriaError(
          "RelationTemplate::manyToMany",
          `MANY_TO_MANY_RELATION_NOT_FOUND_FOR_RELATED_MODEL_${relatedModel}`,
        );
      }

      const relatedModelForeignKey = relatedModelManyToManyRelation.foreignKey;
      const relatedModelColumns = getModelColumns(relation.model).map(
        (column) => column.columnName,
      );

      const mappedRelatedModelPrimaryKey =
        modelColumnsMap.get(
          convertCase(
            relatedModelPrimaryKey,
            typeofModel.modelCaseConvention,
          ) || "",
        )?.databaseName ??
        convertCase(relatedModelPrimaryKey, typeofModel.databaseCaseConvention);

      return {
        query: generateManyToManyQuery({
          dbType: dbType,
          relationName: relationName,
          leftTablePrimaryColumn: mappedPrimaryKey,
          rightTablePrimaryColumn: mappedRelatedModelPrimaryKey,
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
            : relatedModelColumns.map(
                (column) =>
                  modelColumnsMap.get(column)?.databaseName ??
                  convertCase(column, typeofModel.databaseCaseConvention),
              ),
          relatedModelColumns: relatedModelColumns.map(
            (column) =>
              modelColumnsMap.get(column)?.databaseName ??
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
      throw new HysteriaError(
        "RelationTemplate::relationTemplates",
        `UNKNOWN_RELATION_TYPE_${relation.type}`,
      );
  }
}

export default relationTemplates;
