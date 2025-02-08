import { log } from "../../../utils/logger";
import deleteTemplate from "../../resources/query/DELETE";
import insertTemplate from "../../resources/query/INSERT";
import relationTemplates from "../../resources/query/RELATION";
import updateTemplate from "../../resources/query/UPDATE";
import { Model } from "../model";
import { getRelations } from "../model_decorators";
import { Relation } from "../relations/relation";
import { RelationQueryBuilder } from "../../query_builder/query_builder";
import {
  SqlDataSourceType,
  SqlConnectionType,
  MysqlConnectionInstance,
  SqliteConnectionInstance,
  PgClientInstance,
} from "../../sql_data_source_types";

export default class SqlModelManagerUtils<T extends Model> {
  private dbType: SqlDataSourceType;
  private sqlConnection: SqlConnectionType;

  constructor(dbType: SqlDataSourceType, sqlConnection: SqlConnectionType) {
    this.dbType = dbType;
    this.sqlConnection = sqlConnection;
  }

  parseInsert(
    model: T,
    typeofModel: typeof Model,
    dbType: SqlDataSourceType,
  ): { query: string; params: any[] } {
    const filteredModel = this.filterRelationsAndMetadata(model);
    const keys = Object.keys(filteredModel);
    const values = Object.values(filteredModel);
    const insert = insertTemplate(dbType, typeofModel);

    return insert.insert(keys, values);
  }

  parseMassiveInsert(
    models: T[],
    typeofModel: typeof Model,
    dbType: SqlDataSourceType,
  ): { query: string; params: any[] } {
    const filteredModels = models.map((m) =>
      this.filterRelationsAndMetadata(m),
    );
    const insert = insertTemplate(dbType, typeofModel);
    const keys = Object.keys(filteredModels[0]);
    const values = filteredModels.map((model) => Object.values(model));

    return insert.insertMany(keys, values);
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
    return deleteTemplate(table, this.dbType).delete(column, value);
  }

  private getRelationFromModel(
    relationField: string,
    typeofModel: typeof Model,
  ): Relation {
    const relations = getRelations(typeofModel);
    const relation = relations.find(
      (relation) => relation.columnName === relationField,
    );
    if (!relation) {
      throw new Error(
        `Relation ${relationField} not found in model ${typeofModel}`,
      );
    }

    return relation;
  }

  async parseQueryBuilderRelations(
    models: T[],
    typeofModel: typeof Model,
    input: RelationQueryBuilder[],
    dbType: SqlDataSourceType,
    logs: boolean,
  ): Promise<{ [relationName: string]: Model[] }[]> {
    if (!input.length) {
      return [];
    }

    if (!typeofModel.primaryKey) {
      throw new Error(`Model ${typeofModel} does not have a primary key`);
    }

    const resultArray = await Promise.all(
      input.map(async (inputRelation) => {
        const relation = this.getRelationFromModel(
          inputRelation.relation,
          typeofModel,
        );
        const { query, params } = relationTemplates(
          models,
          relation,
          inputRelation.relation,
          inputRelation,
          typeofModel,
          dbType,
        );

        let modelsForRelation: any[] = [];

        if (query) {
          log(query, logs, params);
          let result = await this.getQueryResult(query, params);
          if (!result) {
            result = [];
          } else if (!Array.isArray(result)) {
            result = [result];
          }

          if (!inputRelation.ignoreAfterFetchHook) {
            result = await (relation.model as any).afterFetch(result);
          }

          // Group the result by relation name. Since we're processing one relation per iteration,
          // simply collect all rows and remove the temporary relation_name key.
          result.forEach((row: any) => {
            delete row.relation_name;
            modelsForRelation.push(row);
          });
        }

        // Some databases return JSON as string so we need to parse it.
        modelsForRelation.forEach((model) => {
          if (typeof model[inputRelation.relation] === "string") {
            model[inputRelation.relation] = JSON.parse(
              model[inputRelation.relation],
            );
          }
        });

        return {
          [inputRelation.relation]: modelsForRelation,
        };
      }),
    );

    return resultArray;
  }

  private async getQueryResult(
    query: string,
    params: any[] = [],
  ): Promise<any> {
    switch (this.dbType) {
      case "mysql":
      case "mariadb":
        const resultMysql = await (
          this.sqlConnection as MysqlConnectionInstance
        ).query(query, params);
        return resultMysql[0];
      case "postgres":
        const resultPg = await (this.sqlConnection as PgClientInstance).query(
          query,
          params,
        );
        return resultPg.rows;
      case "sqlite":
        return await new Promise((resolve, reject) => {
          (this.sqlConnection as SqliteConnectionInstance).all(
            query,
            params,
            (err, result) => {
              if (err) {
                reject(err);
              }

              resolve(result);
            },
          );
        });
      default:
        throw new Error(`Unsupported data source type: ${this.dbType}`);
    }
  }
}
