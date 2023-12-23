/**
 * @description Queries to retrieve model's relations from the related relation type
 */
import { RelationType } from "../../Models/Relations/Relation";
function relationTemplates(model, relation) {
    const primaryKey = model.metadata.primaryKey;
    switch (relation.type) {
        case RelationType.hasOne:
            return `SELECT * FROM ${relation.relatedModel} WHERE ${relation.relatedModel}.${relation.foreignKey} = ${model[primaryKey]} LIMIT 1;`;
        case RelationType.belongsTo:
            return `SELECT * FROM ${relation.relatedModel} WHERE ${relation.relatedModel}.id = ${model[relation.foreignKey]};`;
        case RelationType.hasMany:
            return `SELECT * FROM ${relation.relatedModel} WHERE ${relation.relatedModel}.${relation.foreignKey} = ${model[primaryKey]};`;
        default:
            return "";
    }
}
export default relationTemplates;
