import { Relation, RelationType } from "../../Models/Relations/Relation";
import { Model } from "../../Models/Model";
import { camelToSnakeCase, fromSnakeToCamelCase } from "../../../CaseUtils";
import logger from "../../../Logger";
import { Mode } from "fs";

function relationTemplates<T extends Model>(
  models: T[],
  relation: Relation,
  relationName: string,
) {
  const primaryKey = relation.model.metadata.primaryKey;
  const foreignKey = relation.foreignKey as keyof T;
  const relatedModel = relation.relatedModel;

  const primaryKeyValues = models.map((model) => {
    return (
      model[fromSnakeToCamelCase(primaryKey) as keyof T] ||
      model[camelToSnakeCase(primaryKey) as keyof T] ||
      model[primaryKey as string as keyof Model]
    );
  });

  const foreignKeyValues = models.map((model) => {
    return (
      model[fromSnakeToCamelCase(foreignKey) as keyof T] ||
      model[camelToSnakeCase(foreignKey) as keyof T] ||
      model[foreignKey]
    );
  });

  const softDeleteColumn = relation.options?.softDeleteColumn;
  const softDeleteQuery =
    relation.options?.softDeleteType === "date"
      ? ` AND ${relatedModel}.${camelToSnakeCase(softDeleteColumn)} IS NULL`
      : ` AND ${relatedModel}.${fromSnakeToCamelCase(
          softDeleteColumn,
        )} = false`;

  switch (relation.type) {
    case RelationType.hasOne:
      if (primaryKeyValues.some((value) => !value)) {
        logger.error(`Invalid primaryKey values: ${primaryKeyValues}`);
        throw new Error("Invalid primaryKey values");
      }

      return `SELECT *, '${relationName}' as relation_name FROM ${relatedModel} WHERE ${relatedModel}.${camelToSnakeCase(
        foreignKey,
      )} IN (${primaryKeyValues.join(", ")})${
        softDeleteColumn ? softDeleteQuery : ""
      };`;

    case RelationType.belongsTo:
      if (foreignKeyValues.some((value) => !value)) {
        logger.error(`Invalid foreignKey values: ${foreignKeyValues}`);
        throw new Error("Invalid foreignKey values");
      }

      if (!primaryKey) {
        throw new Error(
          `Related Model ${relatedModel} does not have a primary key`,
        );
      }

      return `SELECT *, '${relationName}' as relation_name FROM ${relatedModel} WHERE ${relatedModel}.${primaryKey} IN (${foreignKeyValues.join(
        ", ",
      )}) ${softDeleteColumn ? softDeleteQuery : ""};`;

    case RelationType.hasMany:
      if (primaryKeyValues.some((value) => !value)) {
        logger.error(`Invalid primaryKey values: ${primaryKeyValues}`);
        throw new Error("Invalid primaryKey values");
      }

      return `SELECT *, '${relationName}' as relation_name FROM ${relatedModel} WHERE ${relatedModel}.${camelToSnakeCase(
        foreignKey,
      )} IN (${primaryKeyValues.join(", ")}) ${
        softDeleteColumn ? softDeleteQuery : ""
      };`;

    default:
      throw new Error(`Unknown relation type: ${relation.type}`);
  }
}

export default relationTemplates;
