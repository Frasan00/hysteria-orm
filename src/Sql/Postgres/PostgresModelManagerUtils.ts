import { Model } from "../Models/Model";
import insertTemplate from "../Resources/Query/INSERT";
import updateTemplate from "../Resources/Query/UPDATE";
import deleteTemplate from "../Resources/Query/DELETE";
import { Relation } from "../Models/Relations/Relation";
import { log, queryError } from "../../Logger";
import relationTemplates from "../Resources/Query/RELATIONS";
import pg from "pg";
import { DataSourceType } from "../../Datasource";
import { getRelations } from "../Models/ModelDecorators";

export default class PostgresModelManagerUtils<T extends Model> {
  public parseInsert(
    model: T,
    modelTypeOf: typeof Model,
    dbType: DataSourceType,
  ): { query: string; params: any[] } {
    const filteredModel = this.filterRelationsAndMetadata(model);
    const keys = Object.keys(filteredModel);
    const values = Object.values(filteredModel);
    const insert = insertTemplate(modelTypeOf.metadata.tableName, dbType);

    return insert.insert(keys, values);
  }

  public parseMassiveInsert(
    models: T[],
    modelTypeOf: typeof Model,
    dbType: DataSourceType,
  ): { query: string; params: any[] } {
    const filteredModels = models.map((m) =>
      this.filterRelationsAndMetadata(m),
    );
    const insert = insertTemplate(modelTypeOf.metadata.tableName, dbType);
    const keys = Object.keys(filteredModels[0]);
    const values = filteredModels.map((model) => Object.values(model));

    return insert.insertMany(keys, values);
  }

  public parseUpdate(
    model: T,
    modelTypeOf: typeof Model,
    dbType: DataSourceType,
  ): { query: string; params: any[] } {
    const update = updateTemplate(modelTypeOf.metadata.tableName, dbType);
    const filteredModel = this.filterRelationsAndMetadata(model);
    const keys = Object.keys(filteredModel);
    const values = Object.values(filteredModel);

    const primaryKey = modelTypeOf.metadata.primaryKey as string;
    const primaryKeyValue = model[primaryKey as keyof T];

    return update.update(keys, values, primaryKey, primaryKeyValue as string);
  }

  private filterRelationsAndMetadata(model: T): T {
    const filteredModel = {};
    const isRelation = (value: any) => value instanceof Relation;

    const keys = Object.keys(model);
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
    return deleteTemplate(tableName, "postgres").delete(
      column,
      value.toString(),
    );
  }

  private getRelationFromModel(
    _model: T,
    relationField: string,
    modelTypeOf: typeof Model,
  ): Relation {
    const relations = getRelations(modelTypeOf);
    const relation = relations.find((r) => r.columnName === relationField);
    if (!relation) {
      throw new Error(
        `Relation ${relationField} not found in model ${modelTypeOf.name}`,
      );
    }

    return relation;
  }

  // Parses and fills input relations directly into the model
  public async parseQueryBuilderRelations(
    models: T[],
    modelTypeOf: typeof Model,
    input: string[],
    pgConnection: pg.Pool,
    logs: boolean,
  ): Promise<{ [relationName: string]: Model[] }[]> {
    if (!input.length) {
      return [];
    }

    if (!modelTypeOf.metadata.primaryKey) {
      throw new Error(
        `Model ${modelTypeOf.metadata.tableName} does not have a primary key`,
      );
    }

    let relationQuery: string = "";
    const relationQueries: string[] = [];
    const relationMap: { [key: string]: string } = {};

    try {
      input.forEach((inputRelation: string) => {
        const relation = this.getRelationFromModel(
          models[0],
          inputRelation,
          modelTypeOf,
        );
        const query = relationTemplates(models, relation, inputRelation);
        relationQueries.push(query);
        relationMap[inputRelation] = query;
      });

      relationQuery = relationQueries.join(" UNION ALL ");
      log(relationQuery, logs);

      const result = await pgConnection.query(relationQuery);
      const relatedModels = result.rows;

      const resultMap: { [key: string]: any[] } = {};
      relatedModels.forEach((row) => {
        const relationName = row.relation_name;
        delete row.relation_name;
        if (!resultMap[relationName]) {
          resultMap[relationName] = [];
        }

        resultMap[relationName].push(row);
      });

      // Ensure all input relations are included in the result
      const resultArray: { [relationName: string]: any[] }[] = input.map(
        (inputRelation) => {
          const modelsForRelation = resultMap[inputRelation] || [];
          return {
            [inputRelation]: modelsForRelation,
          };
        },
      );

      return resultArray;
    } catch (error) {
      queryError("Query Error: " + relationQuery + error);
      throw new Error("Failed to parse relations " + error);
    }
  }
}
