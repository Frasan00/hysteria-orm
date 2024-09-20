import { Relation, RelationType } from "../../Models/Relations/Relation";
import { Model } from "../../Models/Model";
import logger from "../../../Logger";
import { convertCase } from "../../../CaseUtils";

function relationTemplates<T extends Model>(
  models: T[],
  relation: Relation,
  relationName: string,
  typeofModel: typeof Model,
) {
  const primaryKey = relation.model.primaryKey;
  const foreignKey = relation.foreignKey as keyof T;
  const relatedModel = relation.relatedModel;

  const primaryKeyValues = models.map((model) => {
    return model[
      convertCase(primaryKey, typeofModel.modelCaseConvention) as keyof T
    ];
  });

  const foreignKeyValues = models.map((model) => {
    return model[
      convertCase(foreignKey, typeofModel.modelCaseConvention) as keyof T
    ];
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
    case RelationType.hasOne:
      if (primaryKeyValues.some((value) => !value)) {
        logger.error(
          `Invalid primaryKey values for ${
            typeofModel.name
          }, ${primaryKeyValues.join(", ")}`,
        );
        throw new Error(
          `Invalid primaryKey values for ${
            typeofModel.name
          }, ${primaryKeyValues.join(", ")}`,
        );
      }

      return `SELECT *, '${relationName}' as relation_name FROM ${relatedModel} WHERE ${relatedModel}.${convertCase(
        foreignKey,
        typeofModel.databaseCaseConvention,
      )} IN (${primaryKeyValues.join(", ")})${
        softDeleteColumn ? softDeleteQuery : ""
      };`;

    case RelationType.belongsTo:
      if (foreignKeyValues.some((value) => !value)) {
        logger.error(
          `Invalid foreignKey values for ${relatedModel}, ${foreignKeyValues.join(
            ", ",
          )}`,
        );
        throw new Error(
          `Invalid foreignKey values for ${relatedModel}, ${foreignKeyValues.join(
            ", ",
          )}`,
        );
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

      return `SELECT *, '${relationName}' as relation_name FROM ${relatedModel} WHERE ${relatedModel}.${convertCase(
        foreignKey,
        typeofModel.databaseCaseConvention,
      )} IN (${primaryKeyValues.join(", ")}) ${
        softDeleteColumn ? softDeleteQuery : ""
      };`;

    default:
      throw new Error(`Unknown relation type: ${relation.type}`);
  }
}

export default relationTemplates;
