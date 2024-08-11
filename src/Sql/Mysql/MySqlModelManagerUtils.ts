import { Metadata, Model } from "../Models/Model";
import insertTemplate from "../Resources/Query/INSERT";
import updateTemplate from "../Resources/Query/UPDATE";
import deleteTemplate from "../Resources/Query/DELETE";
import { Relation } from "../Models/Relations/Relation";
import { log, queryError } from "../../Logger";
import relationTemplates from "../Resources/Query/RELATIONS";
import { Pool, RowDataPacket } from "mysql2/promise";

export default class MySqlModelManagerUtils<T extends Model> {
  public parseInsert(
    model: T,
    modelTypeof: typeof Model,
  ): { query: string; params: any[] } {
    const filteredModel = this.filterRelationsAndMetadata(model);
    const keys = Object.keys(filteredModel);
    const values = Object.values(filteredModel);
    const insert = insertTemplate(
      modelTypeof.metadata.tableName,
      modelTypeof.sqlInstance.getDbType(),
    );

    return insert.insert(keys, values);
  }

  public parseMassiveInsert(
    models: T[],
    modelTypeOf: typeof Model,
  ): { query: string; params: any[] } {
    const filteredModels = models.map((m) =>
      this.filterRelationsAndMetadata(m),
    );
    const insert = insertTemplate(
      modelTypeOf.metadata.tableName,
      modelTypeOf.sqlInstance.getDbType(),
    );
    const keys = Object.keys(filteredModels[0]);
    const values = filteredModels.map((model) => Object.values(model));

    return insert.insertMany(keys, values);
  }

  public parseUpdate(
    model: T,
    modelTypeof: typeof Model,
  ): { query: string; params: any[] } {
    const update = updateTemplate(
      modelTypeof.metadata.tableName,
      modelTypeof.sqlInstance.getDbType(),
    );
    const filteredModel = this.filterRelationsAndMetadata(model);
    const keys = Object.keys(filteredModel);
    const values = Object.values(filteredModel);

    const primaryKeyValue =
      filteredModel[modelTypeof.metadata.primaryKey as keyof T];

    return update.update(
      keys,
      values,
      modelTypeof.metadata.primaryKey,
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

  public parseDelete(
    tableName: string,
    column: string,
    value: string | number | boolean,
  ): string {
    return deleteTemplate(tableName, "mysql").delete(column, value.toString());
  }

  private getRelationFromModel(
    model: T,
    metadata: Metadata,
    relationField: string,
  ): Relation {
    const relation = model[relationField as keyof T] as Relation;
    if (!relation) {
      throw new Error(
        "Relation " +
          relationField +
          " not found in model " +
          metadata.tableName,
      );
    }

    return relation;
  }

  // Parses and fills input relations directly into the model
  public async parseQueryBuilderRelations(
    model: T,
    modelTypeOf: typeof Model,
    input: string[],
    mysqlConnection: Pool,
    logs: boolean,
  ): Promise<void> {
    if (input.length === 0) {
      return;
    }

    if (!modelTypeOf.metadata.primaryKey) {
      throw new Error("Model does not have a primary key");
    }

    let relationQuery: string = "";
    try {
      const relationPromises = input.map(async (inputRelation: string) => {
        const relation = this.getRelationFromModel(
          model,
          modelTypeOf.metadata,
          inputRelation,
        );
        relationQuery = relationTemplates(model, modelTypeOf, relation);

        log(relationQuery, logs);
        const [relatedModels] =
          await mysqlConnection.query<RowDataPacket[]>(relationQuery);
        if (relatedModels.length === 0) {
          Object.assign(model, { [inputRelation as keyof T]: null });
          return;
        }

        if (relatedModels.length === 1) {
          Object.assign(model, {
            [inputRelation as keyof T]: relatedModels[0],
          });
          return;
        }

        Object.assign(model, { [inputRelation as keyof T]: relatedModels });
      });

      await Promise.all(relationPromises);
    } catch (error) {
      queryError("Query Error: " + relationQuery + error);
      throw new Error("Failed to parse relations " + error);
    }
  }
}
