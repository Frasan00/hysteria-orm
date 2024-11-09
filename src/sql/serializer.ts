import { convertCase } from "../utils/case_utils";
import { isNestedObject } from "../utils/json_utils";
import { Model } from "./models/model";
import {
  getRelations,
  getModelBooleanColumns,
  getModelColumns,
  getDynamicColumns,
  getDateColumns,
} from "./models/model_decorators";
import {
  isRelationDefinition,
  Relation,
  RelationEnum,
} from "./models/relations/relation";

export async function parseDatabaseDataIntoModelResponse<T extends Model>(
  models: T[],
  typeofModel: typeof Model,
  relationModels: { [relationName: string]: Model[] }[] = [],
  modelSelectedColumns: string[] = [],
): Promise<T | T[] | null> {
  if (!models.length) {
    return null;
  }

  const modelColumns = getModelColumns(typeofModel);
  const relations = getRelations(typeofModel);

  const serializedModels = models.map((model) => {
    const serializedModel = serializeModel(model, typeofModel);
    processRelation(serializedModel, typeofModel, relations, relationModels);
    addNullModelColumns(typeofModel, serializedModel);
    removeNonModelSelectedColumns(
      serializedModel,
      modelColumns,
      modelSelectedColumns,
    );

    return serializedModel;
  });

  return serializedModels.length === 1 ? serializedModels[0] : serializedModels;
}

function serializeModel<T extends Record<string, any>>(
  model: T,
  typeofModel: typeof Model,
): T {
  const camelCaseModel: Record<string, any> = {};
  const booleanColumns = getModelBooleanColumns(typeofModel);
  const dateColumns = getDateColumns(typeofModel);

  for (const key in model) {
    if (model.hasOwnProperty(key)) {
      if (key === "$additionalColumns") {
        processAdditionalColumns(model, key, camelCaseModel, typeofModel);
        continue;
      }

      const originalValue = model[key];
      // Include null values
      if (originalValue == null) {
        camelCaseModel[convertCase(key, typeofModel.modelCaseConvention)] =
          originalValue;
        continue;
      }

      if (isRelationDefinition(originalValue)) {
        continue;
      }

      const camelCaseKey = convertCase(key, typeofModel.modelCaseConvention);
      if (isNestedObject(originalValue) && !Array.isArray(originalValue)) {
        camelCaseModel[camelCaseKey] = convertToModelCaseConvention(
          originalValue,
          typeofModel,
        );
        continue;
      }

      if (Array.isArray(originalValue)) {
        continue;
      }

      if (booleanColumns.includes(camelCaseKey)) {
        camelCaseModel[camelCaseKey] = Boolean(originalValue);
        continue;
      }

      if (dateColumns.includes(camelCaseKey)) {
        camelCaseModel[camelCaseKey] = new Date(originalValue);
        continue;
      }

      camelCaseModel[camelCaseKey] = originalValue;
    }
  }

  return camelCaseModel as T;
}

function addNullModelColumns(
  typeofModel: typeof Model,
  serializedModel: Record<string, any>,
) {
  const columns = getModelColumns(typeofModel);
  columns.forEach((column) => {
    const casedColumn = convertCase(
      column,
      typeofModel.modelCaseConvention,
    ) as string;

    if (serializedModel.hasOwnProperty(column)) {
      return;
    }

    serializedModel[casedColumn] = null;
  });
}

function removeNonModelSelectedColumns(
  serializedModel: Record<string, any>,
  modelColumns: string[],
  modelSelectedColumns: string[],
) {
  if (!modelSelectedColumns.length || modelSelectedColumns.includes("*")) {
    return;
  }

  Object.keys(serializedModel).forEach((key) => {
    if (
      !modelSelectedColumns.includes(key) &&
      key != "$additionalColumns" &&
      modelColumns.includes(key)
    ) {
      delete serializedModel[key];
    }
  });
}

function processAdditionalColumns(
  model: Record<string, any>,
  key: string,
  camelCaseModel: Record<string, any>,
  typeofModel: typeof Model,
) {
  if (!Object.keys(model[key]).length) {
    return;
  }

  const $additionalColumns = Object.keys(model[key]).reduce(
    (acc, objKey) => {
      acc[convertCase(objKey, typeofModel.modelCaseConvention)] =
        model[key][objKey];
      return acc;
    },
    {} as Record<string, any>,
  );

  camelCaseModel[key] = $additionalColumns;
}

function processRelation(
  serializedModel: Record<string, any>,
  typeofModel: typeof Model,
  relations: Relation[],
  relationModels: { [relationName: string]: Model[] }[],
) {
  relations.forEach((relation: Relation) => {
    const relationModel = relationModels.find(
      (relationModel) => relationModel[relation.columnName],
    );

    if (!relationModel) {
      return;
    }

    const relatedModels = relationModel[relation.columnName];
    const foreignKey = convertCase(
      relation.foreignKey,
      typeofModel.modelCaseConvention,
    ) as string;
    const primaryKey = convertCase(
      typeofModel.primaryKey,
      typeofModel.modelCaseConvention,
    ) as string;

    switch (relation.type) {
      case RelationEnum.belongsTo:
        const relatedModelMap = new Map<any, Model>();
        const casedPrimaryKey = convertCase(
          primaryKey,
          typeofModel.databaseCaseConvention,
        ) as keyof Model;

        relatedModels.forEach((model) => {
          relatedModelMap.set(model[casedPrimaryKey as keyof Model], model);
        });

        const retrievedRelatedModel = relatedModelMap.get(
          serializedModel[foreignKey as keyof Model],
        );

        if (!retrievedRelatedModel) {
          serializedModel[relation.columnName] = null;
          return;
        }

        serializedModel[relation.columnName] = serializeModel(
          retrievedRelatedModel,
          relation.model,
        );
        break;

      case RelationEnum.hasOne:
        const relatedModelMapHasOne = new Map<any, Model>();
        const casedForeignKey = convertCase(
          foreignKey,
          typeofModel.databaseCaseConvention,
        ) as keyof Model;

        relatedModels.forEach((model) => {
          relatedModelMapHasOne.set(
            model[casedForeignKey as keyof Model],
            model,
          );
        });

        const retrievedRelatedModelHasOne = relatedModelMapHasOne.get(
          serializedModel[primaryKey as keyof Model],
        );

        if (!retrievedRelatedModelHasOne) {
          serializedModel[relation.columnName] = null;
          return;
        }

        serializedModel[relation.columnName] = serializeModel(
          retrievedRelatedModelHasOne,
          relation.model,
        );
        break;

      case RelationEnum.hasMany:
        const retrievedRelatedModels = relatedModels.filter(
          (item) =>
            // Since it's still raw data and it's not yet been converted to camel case (it will soon in the serializeModel call)m it's matched with the camel case key
            item[
              convertCase(
                foreignKey,
                typeofModel.databaseCaseConvention,
              ) as keyof Model
            ] === serializedModel[primaryKey as keyof Model],
        );

        serializedModel[relation.columnName] = retrievedRelatedModels.map(
          (model) => serializeModel(model, relation.model),
        );
        break;

      case RelationEnum.manyToMany:
        const relatedModelMapManyToMany = new Map<any, Model>();
        relatedModels.forEach((model) => {
          relatedModelMapManyToMany.set(
            model[primaryKey as keyof Model],
            model,
          );
        });

        const currentModelId = serializedModel[primaryKey as keyof Model];
        const relatedModel = relatedModelMapManyToMany.get(currentModelId);

        if (!relatedModel) {
          serializedModel[relation.columnName] = [];
          return;
        }

        let relatedColumnValue =
          relatedModel[relation.columnName as keyof Model];
        relatedColumnValue = Array.isArray(relatedColumnValue)
          ? relatedColumnValue
          : [relatedColumnValue];

        serializedModel[relation.columnName] = relatedColumnValue.map(
          (relatedItem: Model) => serializeModel(relatedItem, relation.model),
        );
        break;
      default:
        throw new Error("Relation type not supported");
    }
  });
}

function convertToModelCaseConvention(
  originalValue: Record<string, any>,
  typeofModel: typeof Model,
): Record<string, any> {
  return Object.keys(originalValue).reduce(
    (acc, objKey) => {
      acc[convertCase(objKey, typeofModel.modelCaseConvention)] =
        originalValue[objKey];
      return acc;
    },
    {} as Record<string, any>,
  );
}

export async function addDynamicColumnsToModel(
  typeofModel: typeof Model,
  model: Record<string, any>,
  dynamicColumnsToAdd: string[],
): Promise<void> {
  const dynamicColumns = getDynamicColumns(typeofModel);
  if (!dynamicColumns || !dynamicColumns.length) {
    return;
  }

  const dynamicColumnMap = new Map<
    string,
    {
      columnName: string;
      dynamicColumnFn: (...args: any[]) => any;
    }
  >();

  for (const dynamicColumn of dynamicColumns) {
    dynamicColumnMap.set(dynamicColumn.functionName, {
      columnName: dynamicColumn.columnName,
      dynamicColumnFn: dynamicColumn.dynamicColumnFn,
    });
  }

  const promises = dynamicColumnsToAdd.map(async (dynamicColumn: string) => {
    const dynamic = dynamicColumnMap.get(dynamicColumn);
    const casedKey = convertCase(
      dynamic?.columnName,
      typeofModel.modelCaseConvention,
    );

    Object.assign(model, { [casedKey]: await dynamic?.dynamicColumnFn() });
  });

  await Promise.all(promises);
}
