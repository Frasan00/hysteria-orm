import { HasOne } from "../Models/Relations/HasOne";
import { BelongsTo } from "../Models/Relations/BelongsTo";
import { HasMany } from "../Models/Relations/HasMany";

const joinTemplate = (table: string, primaryKey: string) => {
  return {
    belongsToJoin: (relation: BelongsTo) =>
      `\nLEFT JOIN ${relation.relatedModel} ON ${table}.${primaryKey} = ${relation.relatedModel}.${relation.foreignKey} `,
    hasOneJoin: (relation: HasOne) =>
      `\nLEFT JOIN ${relation.relatedModel} ON ${table}.${primaryKey} = ${relation.relatedModel}.${relation.foreignKey} `,
    hasManyJoin: (relation: HasMany) =>
      `\nLEFT JOIN ${relation.relatedModel} ON ${table}.${primaryKey} = ${relation.relatedModel}.${relation.foreignKey} `,
  };
};

export type JoinTemplateType = (
  table: string,
  primaryKey: string,
) => {
  belongsToJoin: (relation: BelongsTo) => string;
  hasOneJoin: (relation: HasOne) => string;
  hasManyJoin: (relation: HasMany) => string;
};

export default joinTemplate;
