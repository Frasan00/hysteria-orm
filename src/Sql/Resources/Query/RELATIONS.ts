import { Relation, RelationType } from "../../Models/Relations/Relation";
import { Model } from "../../Models/Model";
import { camelToSnakeCase, fromSnakeToCamelCase } from "../../../CaseUtils";

function relationTemplates<T extends Model>(
  model: T,
  modelTypeOf: typeof Model,
  relation: Relation,
) {
  const primaryKey = modelTypeOf.metadata.primaryKey as keyof T;
  const foreignKey = relation.foreignKey as keyof T;
  const relatedModel = relation.relatedModel;
  const foreignKeyValue =
    model[fromSnakeToCamelCase(foreignKey) as keyof T] ||
    model[camelToSnakeCase(foreignKey) as keyof T] ||
    model[foreignKey];
  const primaryKeyValue =
    model[fromSnakeToCamelCase(primaryKey) as keyof T] ||
    model[camelToSnakeCase(primaryKey) as keyof T] ||
    model[primaryKey];

  switch (relation.type) {
    case RelationType.hasOne:
      if (!foreignKeyValue || !primaryKeyValue) {
        console.error(
          `Invalid foreignKey or primaryKey value: foreignKey=${foreignKeyValue}, primaryKey=${primaryKeyValue}`,
        );
        throw new Error("Invalid foreignKey or primaryKey value");
      }

      return `SELECT * FROM ${relatedModel} WHERE ${relatedModel}.${camelToSnakeCase(
        foreignKey,
      )} = ${primaryKeyValue} LIMIT 1;`;

    case RelationType.belongsTo:
      if (!foreignKeyValue) {
        throw new Error("Invalid foreignKey value");
      }
      return `SELECT * FROM ${relatedModel} WHERE ${relatedModel}.${primaryKey.toString()} = ${foreignKeyValue};`;

    case RelationType.hasMany:
      if (!primaryKeyValue) {
        throw new Error("Invalid primaryKey value");
      }
      return `SELECT * FROM ${relatedModel} WHERE ${relatedModel}.${camelToSnakeCase(
        foreignKey,
      )} = ${primaryKeyValue};`;

    default:
      throw new Error(`Unknown relation type: ${relation.type}`);
  }
}

export default relationTemplates;
