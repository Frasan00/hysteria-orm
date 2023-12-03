import { HasOne } from "../Relations/HasOne";
import { BelongsTo } from "../Relations/BelongsTo";
import { HasMany } from "../Relations/HasMany";

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
export default joinTemplate;
