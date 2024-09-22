import { log } from "console";
import { SqlDataSourceType } from "../../../Datasource";
import { queryError } from "../../../Logger";
import deleteTemplate from "../../Resources/Query/DELETE";
import insertTemplate from "../../Resources/Query/INSERT";
import relationTemplates from "../../Resources/Query/RELATIONS";
import updateTemplate from "../../Resources/Query/UPDATE";
import { Model } from "../Model";
import { getRelations } from "../ModelDecorators";
import { Relation } from "../Relations/Relation";
import { SqlConnectionType } from "../../SqlDatasource";
import mysql from "mysql2/promise";
import pg from "pg";

export default class SqlModelManagerUtils<T extends Model> {
  protected dbType: SqlDataSourceType;
  protected sqlConnection: SqlConnectionType;

  constructor(dbType: SqlDataSourceType, sqlConnection: SqlConnectionType) {
    this.dbType = dbType;
    this.sqlConnection = sqlConnection;
  }

  public parseInsert(
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

  public parseMassiveInsert(
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

  public parseUpdate(
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

  public parseDelete(
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
    const relation = relations.find((r) => r.columnName === relationField);
    if (!relation) {
      throw new Error(
        `Relation ${relationField} not found in model ${typeofModel}`,
      );
    }

    return relation;
  }

  // Parses and fills input relations directly into the model
  public async parseQueryBuilderRelations(
    models: T[],
    typeofModel: typeof Model,
    input: string[],
    logs: boolean,
  ): Promise<{ [relationName: string]: Model[] }[]> {
    if (!input.length) {
      return [];
    }

    if (!typeofModel.primaryKey) {
      throw new Error(`Model ${typeofModel} does not have a primary key`);
    }

    let relationQuery: string = "";
    const relationQueries: string[] = [];
    const relationMap: { [key: string]: string } = {};

    try {
      input.forEach((inputRelation: string) => {
        const relation = this.getRelationFromModel(inputRelation, typeofModel);
        const query = relationTemplates(
          models,
          relation,
          inputRelation,
          typeofModel,
        );
        relationQueries.push(query);
        relationMap[inputRelation] = query;
      });

      relationQuery = relationQueries.join(" UNION ALL ");
      log(relationQuery, logs);

      const result = await this.getQueryResult(relationQuery);
      const resultMap: { [key: string]: any[] } = {};
      result.forEach((row: any) => {
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

  private async getQueryResult(
    query: string,
    params: any[] = [],
  ): Promise<any> {
    switch (this.dbType) {
      case "mysql":
      case "mariadb":
        const resultMysql = await (
          this.sqlConnection as mysql.Connection
        ).query(query, params);
        return resultMysql[0];
      case "postgres":
        const resultPg = await (this.sqlConnection as pg.Client).query(
          query,
          params,
        );
        return resultPg.rows;
      default:
        throw new Error(`Unsupported datasource type: ${this.dbType}`);
    }
  }
}
