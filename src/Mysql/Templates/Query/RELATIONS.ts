/**
 * @description Queries to retrieve model's relations from the related relation type
 */
import { Relation, RelationType } from "../../Models/Relations/Relation";
import { Model } from "../../Models/Model";

function relationTemplates<T extends Model>(model: T, relation: Relation) {
  const primaryKey = model.metadata.primaryKey as keyof T;
  switch (relation.type) {
    case RelationType.hasOne:
      return `SELECT * FROM ${relation.relatedModel} WHERE ${relation.relatedModel}.${relation.foreignKey} = ${model[primaryKey]} LIMIT 1;`;

    case RelationType.belongsTo:
      return `SELECT * FROM ${relation.relatedModel} WHERE ${
        relation.relatedModel
      }.id = ${model[relation.foreignKey as keyof T]};`;

    case RelationType.hasMany:
      return `SELECT * FROM ${relation.relatedModel} WHERE ${relation.relatedModel}.${relation.foreignKey} = ${model[primaryKey]};`;

    default:
      return "";
  }
}

export default relationTemplates;
