import { convertCase } from "../../utils/case_utils";
import {
  getBaseMongoModelInstance,
  MongoModel,
} from "./mongo_models/mongo_model";
import {
  getMongoDynamicColumns,
  getMongoModelColumns,
} from "./mongo_models/mongo_model_decorators";

export async function serializeMongoModel<T extends MongoModel>(
  model: typeof MongoModel,
  data: any,
  selectedColumns: string[] = [],
  dynamicColumnsToAdd: string[] = [],
): Promise<T | null> {
  if (!data) {
    return null;
  }

  const serializedModel = getBaseMongoModelInstance<T>() as Record<string, any>;
  const modelColumns = getMongoModelColumns(model);

  for (const key in data) {
    if (key === "_id") {
      serializedModel.id = data._id?.toString();
      continue;
    }

    if (!modelColumns.includes(key)) {
      const casedKey = convertCase(key, model.modelCaseConvention);
      serializedModel.extraColumns[casedKey] = data[key];
      continue;
    }

    const casedKey = convertCase(key, model.modelCaseConvention);
    serializedModel[casedKey] = data[key];
  }

  if (!Object.keys(serializedModel.extraColumns).length) {
    delete serializedModel.extraColumns;
  }

  for (const column of selectedColumns) {
    if (!data.hasOwnProperty(column)) {
      const casedKey = convertCase(column, model.modelCaseConvention);
      serializedModel[casedKey] = null;
      continue;
    }
  }

  await addDynamicColumnsToModel(model, serializedModel, dynamicColumnsToAdd);
  return serializedModel as T;
}

export async function serializeMongoModels<T extends MongoModel>(
  model: typeof MongoModel,
  data: any[],
  selectedColumns: string[] = [],
  dynamicColumnsToAdd: string[] = [],
): Promise<T[]> {
  const promises = data.map(async (modelData: T) => {
    return await serializeMongoModel(
      model,
      modelData,
      selectedColumns,
      dynamicColumnsToAdd,
    );
  });

  const serializedModels = await Promise.all(promises);
  return serializedModels.filter((model) => model !== null) as T[];
}

export async function addDynamicColumnsToModel(
  typeofModel: typeof MongoModel,
  model: Record<string, any>,
  dynamicColumnsToAdd: string[],
): Promise<void> {
  const dynamicColumns = getMongoDynamicColumns(typeofModel);
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
