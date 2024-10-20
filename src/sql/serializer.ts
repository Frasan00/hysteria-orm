import { convertCase } from "../utils/case_utils";
import { isNestedObject } from "../utils/json_utils";
import { Model } from "./models/model";
import {
  getRelations,
  getModelBooleanColumns,
  getModelColumns,
  getDynamicColumns,
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
): Promise<T | T[] | null> {
  if (!models.length) {
    return null;
  }

  const relations = getRelations(typeofModel);

  const serializedModels = models.map((model) => {
    const serializedModel = serializeModel(model, typeofModel);
    processRelation(serializedModel, typeofModel, relations, relationModels);
    addNullModelColumns(typeofModel, serializedModel);

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

  for (const key in model) {
    if (model[key] === undefined) {
      delete (model as Partial<Model>)[key as keyof Model];
    }

    if (model.hasOwnProperty(key)) {
      if (key === "extraColumns") {
        processExtraColumns(model, key, camelCaseModel, typeofModel);
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

      // TODO: For now, non relation arrays are not supported
      if (Array.isArray(originalValue)) {
        continue;
      }

      if (booleanColumns.includes(camelCaseKey)) {
        camelCaseModel[camelCaseKey] = Boolean(originalValue);
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

function processExtraColumns(
  model: Record<string, any>,
  key: string,
  camelCaseModel: Record<string, any>,
  typeofModel: typeof Model,
) {
  if (!Object.keys(model[key]).length) {
    return;
  }

  const extraColumns = Object.keys(model[key]).reduce(
    (acc, objKey) => {
      acc[convertCase(objKey, typeofModel.modelCaseConvention)] =
        model[key][objKey];
      return acc;
    },
    {} as Record<string, any>,
  );

  camelCaseModel[key] = extraColumns;
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
        relatedModels.forEach((model) => {
          relatedModelMap.set(model[primaryKey as keyof Model], model);
        });

        const retrievedRelatedModel = relatedModelMap.get(
          serializedModel[foreignKey as keyof Model],
        );

        if (retrievedRelatedModel) {
          serializedModel[relation.columnName] = serializeModel(
            retrievedRelatedModel,
            relation.model,
          );
        }
        break;

      case RelationEnum.hasOne:
        const relatedModelMapHasOne = new Map<any, Model>();
        relatedModels.forEach((model) => {
          relatedModelMapHasOne.set(model[foreignKey as keyof Model], model);
        });

        const retrievedRelatedModelHasOne = relatedModelMapHasOne.get(
          serializedModel[foreignKey as keyof Model],
        );

        if (retrievedRelatedModelHasOne) {
          serializedModel[relation.columnName] = serializeModel(
            retrievedRelatedModelHasOne,
            relation.model,
          );
        }
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
