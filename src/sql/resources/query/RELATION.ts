import { convertCase } from "../../../utils/case_utils";
import logger from "../../../utils/logger";
import { Model } from "../../models/model";
import { getModelColumns, getRelations } from "../../models/model_decorators";
import { ManyToMany } from "../../models/relations/many_to_many";
import { Relation, RelationEnum } from "../../models/relations/relation";
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

function getJsonAggregate(
  column: string,
  aggregate: string,
  dbType: SqlDataSourceType,
  modelColumns: string[],
  typeofModel: typeof Model,
) {
  column = convertCase(column, typeofModel.databaseCaseConvention);
  modelColumns = modelColumns.map((column) =>
    convertCase(column, typeofModel.databaseCaseConvention),
  );

  switch (dbType) {
    case "postgres":
      return `json_agg(${column}) as ${aggregate}`;
    case "mysql":
    case "mariadb":
      return `JSON_ARRAYAGG(JSON_OBJECT(${modelColumns
        .map((column) => `'${column}', ${aggregate}.${column}`)
        .join(", ")})) as ${aggregate}`;
    case "sqlite":
      return `json_group_array(
json_object(${modelColumns
        .map((column) => `'${column}', ${aggregate}.${column}`)
        .join(", ")})
) as ${aggregate}`;
    default:
  }
}

function relationTemplates<T extends Model>(
  models: T[],
  relation: Relation,
  relationName: string,
  typeofModel: typeof Model,
  dbType: SqlDataSourceType,
) {
  const primaryKey = relation.model.primaryKey;
  const foreignKey = relation.foreignKey as keyof T;
  const relatedModel = relation.relatedModel;

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

  const softDeleteColumn = relation.options?.softDeleteColumn;
  const softDeleteQuery =
    relation.options?.softDeleteType === "date"
      ? ` AND ${relatedModel}.${convertCase(
          softDeleteColumn,
          typeofModel.databaseCaseConvention,
        )} IS NULL`
      : ` AND ${relatedModel}.${convertCase(
          softDeleteColumn,
          typeofModel.databaseCaseConvention,
        )} = false`;

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
        return ``;
      }

      return `SELECT *, '${relationName}' as relation_name FROM ${relatedModel} WHERE ${relatedModel}.${convertCase(
        foreignKey,
        typeofModel.databaseCaseConvention,
      )} IN (${primaryKeyValues
        .map(({ value, type }) => convertValueToSQL(value, type))
        .join(", ")})${softDeleteColumn ? softDeleteQuery : ""};\n`;

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
        return ``;
      }

      return `SELECT *, '${relationName}' as relation_name FROM ${relatedModel} WHERE ${relatedModel}.${primaryKey} IN (${foreignKeyValues
        .map(({ value, type }) => convertValueToSQL(value, type))
        .join(", ")}) ${softDeleteColumn ? softDeleteQuery : ""};\n`;

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
        return ``;
      }

      return `SELECT *, '${relationName}' as relation_name FROM ${relatedModel} WHERE ${relatedModel}.${convertCase(
        foreignKey,
        typeofModel.databaseCaseConvention,
      )} IN (${primaryKeyValues
        .map(({ value, type }) => convertValueToSQL(value, type))
        .join(", ")}) ${softDeleteColumn ? softDeleteQuery : ""};\n`;

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
        return ``;
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

      return `SELECT ${throughModel}.${convertCase(
        throughModelPrimaryKey,
        typeofModel.databaseCaseConvention,
      )} as ${primaryKey}, ${getJsonAggregate(
        `${relatedModelTable}.*`,
        relationName,
        dbType,
        relatedModelColumns,
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
WHERE ${throughModel}.${convertCase(
        throughModelPrimaryKey,
        typeofModel.databaseCaseConvention,
      )} IN (${primaryKeyValues
        .map(({ value, type }) => convertValueToSQL(value, type))
        .join(", ")}) ${softDeleteColumn ? softDeleteQuery : ""}
GROUP BY ${throughModel}.${convertCase(
        throughModelPrimaryKey,
        typeofModel.databaseCaseConvention,
      )}
ORDER BY ${throughModel}.${convertCase(
        throughModelPrimaryKey,
        typeofModel.databaseCaseConvention,
      )};\n`;
    default:
      throw new Error(`Unknown relation type: ${relation.type}`);
  }
}

export default relationTemplates;
