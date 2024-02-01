/**
 * @description Queries to retrieve model's relations from the related relation type
 */
import { Relation, RelationType } from "../../Models/Relations/Relation";
import { Model } from "../../Models/Model";
import { camelToSnakeCase } from "../../../CaseUtils";
import * as sqlString from "sqlstring";

function relationTemplates<T extends Model>(model: T, relation: Relation) {
  const primaryKey = model.metadata.primaryKey as keyof T;
  switch (relation.type) {
    case RelationType.hasOne:
      return `SELECT * FROM ${relation.relatedModel} WHERE ${
        sqlString.escape(relation.relatedModel)
      }.${camelToSnakeCase(sqlString.escape(relation.foreignKey as string))} = ${camelToSnakeCase(
        sqlString.escape(model[primaryKey] as string),
      )} LIMIT 1;`;

    case RelationType.belongsTo:
      return `SELECT * FROM ${relation.relatedModel} WHERE ${
        sqlString.escape(relation.relatedModel)
      }.${primaryKey.toString()} = ${
        model[camelToSnakeCase(sqlString.escape(relation.foreignKey as string)) as keyof T]
      };`;

    case RelationType.hasMany:
      return `SELECT * FROM ${relation.relatedModel} WHERE ${
        sqlString.escape(relation.relatedModel)
      }.${camelToSnakeCase(relation.foreignKey as string)} = ${camelToSnakeCase(
        sqlString.escape(model[primaryKey] as string),
      )};`;

    default:
      return "";
  }
}

export default relationTemplates;
