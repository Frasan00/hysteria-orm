import { BelongsTo } from "../Models/Relations/BelongsTo";
import { HasOne } from "../Models/Relations/HasOne";
import { HasMany } from "../Models/Relations/HasMany";

/**
 * @description Gives back the queries to fill the main table relations
 */
const relationTemplate = (tableName: string) => {
  return {
    belongsTo: (relation: BelongsTo, primaryKey: string) =>
      `SELECT * FROM ${relation.relatedModel} WHERE ${relation.relatedModel}.${relation.foreignKey} = ${tableName}.${primaryKey} `,
    hasOne: (relation: HasOne, primaryKey: string) =>
      `SELECT * FROM ${relation.relatedModel} WHERE ${relation.relatedModel}.${relation.foreignKey} = ${tableName}.${primaryKey} `,
    hasMany: (relation: HasMany, primaryKey: string) =>
      `SELECT * FROM ${relation.relatedModel} WHERE ${relation.relatedModel}.${relation.foreignKey} = ${tableName}.${primaryKey} `,
  };
};

export default relationTemplate;
