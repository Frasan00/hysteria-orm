import { HysteriaError } from "../../../errors/hysteria_error";
import deleteTemplate from "../../resources/query/DELETE";
import insertTemplate from "../../resources/query/INSERT";
import updateTemplate from "../../resources/query/UPDATE";
import { SqlDataSource } from "../../sql_data_source";
import { SqlDataSourceType } from "../../sql_data_source_types";
import { getModelColumns, getRelations } from "../decorators/model_decorators";
import { Model } from "../model";
import { Relation } from "../relations/relation";

export default class SqlModelManagerUtils<T extends Model> {
  protected dbType: SqlDataSourceType;
  protected sqlDataSource: SqlDataSource;

  constructor(dbType: SqlDataSourceType, sqlDataSource: SqlDataSource) {
    this.dbType = dbType;
    this.sqlDataSource = sqlDataSource;
  }

  parseInsert(
    model: T,
    typeofModel: typeof Model,
    dbType: SqlDataSourceType,
    returning?: string[],
  ): { query: string; params: any[] } {
    const filteredModel = this.filterRelationsAndMetadata(model);
    const keys = Object.keys(filteredModel);
    const values = Object.values(filteredModel);

    const insert = insertTemplate(dbType, typeofModel);
    return insert.insert(keys, values, returning);
  }

  parseMassiveInsert(
    models: T[],
    typeofModel: typeof Model,
    dbType: SqlDataSourceType,
    returning?: string[],
  ): { query: string; params: any[] } {
    const filteredModels = models.map((m) =>
      this.filterRelationsAndMetadata(m),
    );
    const insert = insertTemplate(dbType, typeofModel);
    const keys = Object.keys(filteredModels[0]);
    const values = filteredModels.map((model) => Object.values(model));
    return insert.insertMany(keys, values, returning);
  }

  parseUpdate(
    model: T,
    typeofModel: typeof Model,
    dbType: SqlDataSourceType,
  ): { query: string; params: any[] } {
    const update = updateTemplate(dbType, typeofModel);
    const filteredModel = this.filterRelationsAndMetadata(model);
    const keys = Object.keys(filteredModel);
    const values = Object.values(filteredModel);

    const primaryKeyValue = filteredModel[typeofModel.primaryKey as keyof T];

    return update.update(
      keys,
      values,
      typeofModel.primaryKey,
      primaryKeyValue as string,
    );
  }

  private filterRelationsAndMetadata(model: T): T {
    const filteredModel = {};

    const keys = Object.keys(model);
    const isRelation = (value: any) => value instanceof Relation;
    for (const key of keys) {
      if (isRelation(model[key as keyof T])) {
        continue;
      }

      Object.assign(filteredModel, { [key]: model[key as keyof T] });
    }

    return filteredModel as T;
  }

  parseDelete(
    table: string,
    column: string,
    value: string | number | boolean,
  ): { query: string; params: any[] } {
    return deleteTemplate(this.dbType).delete(table, column, value);
  }

  getRelationFromModel(
    relationField: string,
    typeofModel: typeof Model,
  ): Relation {
    const relations = getRelations(typeofModel);
    const relation = relations.find(
      (relation) => relation.columnName === relationField,
    );

    if (!relation) {
      throw new HysteriaError(
        "SqlModelManagerUtils::getRelationFromModel",
        `RELATION_NOT_FOUND_IN_MODEL_${relationField}`,
      );
    }

    return relation;
  }

  /**
   * @description Prepares a model for insertion executing the prepare function of each column
   * @internal
   */
  async handlePrepare(
    typeofModel: typeof Model,
    model: T,
    mode: "insert" | "update" = "insert",
  ) {
    const modelColumns = getModelColumns(typeofModel);
    if (mode === "insert") {
      const modelColumnsWithPrepare = modelColumns.filter(
        (modelColumn) => modelColumn.prepare,
      );

      await Promise.all(
        // We only add columns that have a prepare function for the insert mode
        modelColumnsWithPrepare.map(async (modelColumn) => {
          model[modelColumn.columnName as keyof T] =
            await modelColumn.prepare?.(
              model[modelColumn.columnName as keyof T],
            );
        }),
      );
    }

    const autoUpdatedColumns = modelColumns.filter(
      (modelColumn) => modelColumn.autoUpdate,
    );

    const autoUpdatedColumnsMap = new Map(
      autoUpdatedColumns.map((modelColumn) => [
        modelColumn.columnName,
        modelColumn,
      ]),
    );

    const modelPayloadColumns = Object.keys(model);
    await Promise.all(
      // If the column is in the autoUpdatedColumnsMap, we set the value to null and apply the prepare function, else we just apply the prepare function only if provided, the whole process is skipped if the column is not in the autoUpdatedColumnsMap and not provided in the model payload
      modelPayloadColumns.map(async (modelKey) => {
        if (autoUpdatedColumnsMap.has(modelKey)) {
          model[modelKey as keyof T] ||= null as any; // If provided we use the value from the model payload, else we set it to null and then fetch it to the prepare function
        }

        const isAutoUpdatedColumn = autoUpdatedColumnsMap.has(modelKey);
        model[modelKey as keyof T] = await (isAutoUpdatedColumn
          ? autoUpdatedColumnsMap
              .get(modelKey)
              ?.prepare?.(model[modelKey as keyof T])
          : model[modelKey as keyof T]);
      }),
    );
  }
}
