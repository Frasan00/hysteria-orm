import {
  FindType,
  FindOneType,
} from "../Models/ModelManager/ModelManagerTypes";
import selectTemplate from "../Templates/Query/SELECT";
import { Model } from "../Models/Model";
import insertTemplate from "../Templates/Query/INSERT";
import updateTemplate from "../Templates/Query/UPDATE";
import deleteTemplate from "../Templates/Query/DELETE";
import { Relation } from "../Models/Relations/Relation";
import { log, queryError } from "../../Logger";
import relationTemplates from "../Templates/Query/RELATIONS";
import { Pool, QueryResult, QueryResultRow } from "pg";
import whereTemplate from "../Templates/Query/WHERE.TS";
import pg from "pg";

class PostgresModelManagerUtils<T extends Model> {
  public parseSelectQueryInput(
    model: typeof Model,
    input: FindType | FindOneType,
  ): { query: string; params: any[] } {
    let query = "";
    const params: any[] = [];
    query += this.parseSelect(model.metadata.tableName, input);
    const { query: whereQuery, params: whereParams } = this.parseWhere(
      model.metadata.tableName,
      input,
    );
    query += whereQuery;
    params.push(...whereParams);
    query += this.parseQueryFooter(model.metadata.tableName, input);

    return { query, params };
  }

  private parseSelect(
    tableName: string,
    input: FindType | FindOneType,
  ): string {
    const select = selectTemplate(tableName, "postgres");
    return input.select
      ? select.selectColumns(...input.select)
      : select.selectAll;
  }

  private parseWhere(
    tableName: string,
    input: FindType | FindOneType,
  ): { query: string; params: any[] } {
    const params: any[] = [];
    const where = whereTemplate(tableName, "postgres");
    if (!input.where) {
      return { query: "", params };
    }

    let query = "";
    const entries = Object.entries(input.where);
    for (let index = 0; index < entries.length; index++) {
      const [key, value] = entries[index];

      if (index === 0) {
        const { query: whereQuery, params: whereParams } = where.where(
          key,
          value,
        );
        query += whereQuery;
        params.push(...whereParams);
        continue;
      }

      const { query: whereQuery, params: whereParams } = where.andWhere(
        key,
        value,
      );
      query += whereQuery;
      params.push(...whereParams);
    }

    query = where.convertPlaceHolderToValue(query);
    return { query, params };
  }

  private parseQueryFooter(
    tableName: string,
    input: FindType | FindOneType,
  ): string {
    if (!this.isFindType(input)) {
      return "";
    }

    const select = selectTemplate(tableName, "postgres");
    let query = "";
    if (input.offset) {
      query += select.offset(input.offset);
    }

    if (input.groupBy) {
      query += select.groupBy(...input.groupBy);
    }

    if (input.orderBy) {
      query += select.orderBy([...input.orderBy.columns], input.orderBy.type);
    }

    if (input.limit) {
      query += select.limit(input.limit);
    }

    return query;
  }

  public parseInsert(
    model: T,
    modelTypeOf: typeof Model,
  ): { query: string; params: any[] } {
    const filteredModel = this.filterRelationsAndMetadata(model);
    const keys = Object.keys(filteredModel);
    const values = Object.values(filteredModel);
    const insert = insertTemplate(
      modelTypeOf.metadata.tableName,
      modelTypeOf.sqlInstance.getDbType(),
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
    modelTypeOf: typeof Model,
  ): { query: string; params: any[] } {
    const update = updateTemplate(
      modelTypeOf.metadata.tableName,
      modelTypeOf.sqlInstance.getDbType(),
    );
    const filteredModel = this.filterRelationsAndMetadata(model);
    const keys = Object.keys(filteredModel);
    const values = Object.values(filteredModel);

    const primaryKey = modelTypeOf.metadata.primaryKey as string;
    const primaryKeyValue = model[primaryKey as keyof T];

    return update.update(keys, values, primaryKey, primaryKeyValue as string);
  }

  private filterRelationsAndMetadata(model: T): T {
    const filteredModel = {};

    const keys = Object.keys(model);
    for (const key of keys) {
      if (key === "metadata") {
        continue;
      }

      if (
        typeof model[key as keyof T] === "object" &&
        (model[key as keyof T] !== null ||
          !Array.isArray(model[key as keyof T]))
      ) {
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
    return deleteTemplate(tableName).delete(column, value.toString());
  }

  private isFindType(input: FindType | FindOneType): input is FindType {
    const instance = input as FindType;
    return (
      instance.hasOwnProperty("offset") ||
      instance.hasOwnProperty("groupBy") ||
      instance.hasOwnProperty("orderBy") ||
      instance.hasOwnProperty("limit")
    );
  }

  private getRelationFromModel(
    model: T,
    relationField: string,
    modelTypeOf: typeof Model,
  ): Relation {
    const relation = model[relationField as keyof T] as Relation;
    if (!relation) {
      throw new Error(
        "Relation " +
          relationField +
          " not found in model " +
          modelTypeOf.metadata.tableName,
      );
    }

    return relation;
  }

  // Parses and fills input relations directly into the model
  public async parseRelationInput(
    model: T,
    modelTypeOf: typeof Model,
    input: FindOneType,
    pgPool: Pool,
    logs: boolean,
  ): Promise<void> {
    if (!input.relations) {
      return;
    }

    if (!modelTypeOf.metadata.primaryKey) {
      throw new Error("Model does not have a primary key");
    }

    try {
      const relationPromises = input.relations.map(
        async (inputRelation: string) => {
          const relation = this.getRelationFromModel(
            model,
            inputRelation,
            modelTypeOf,
          );
          const relationQuery = relationTemplates(model, relation);
          console.log(relationQuery);

          const { rows }: QueryResult<QueryResultRow> =
            await pgPool.query(relationQuery);
          if (rows.length === 0) {
            Object.assign(model, { [inputRelation as keyof T]: null });
            log(relationQuery, logs);
            return;
          }

          if (rows.length === 1) {
            Object.assign(model, {
              [inputRelation as keyof T]: rows[0],
            });
            log(relationQuery, logs);
            return;
          }

          Object.assign(model, { [inputRelation as keyof T]: rows });
          log(relationQuery, logs);
        },
      );

      await Promise.all(relationPromises);
    } catch (error) {
      queryError(error);
      throw new Error("Failed to parse relations " + error);
    }
  }

  // Parses and fills input relations directly into the model
  public async parseQueryBuilderRelations(
    model: T,
    modelTypeOf: typeof Model,
    input: string[],
    pgConnection: pg.Pool,
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
          inputRelation,
          modelTypeOf,
        );
        relationQuery = relationTemplates(model, relation);

        // Changed to use pgConnection.query instead of mysqlConnection.query
        const result = await pgConnection.query(relationQuery);
        const relatedModels = result.rows;

        if (relatedModels.length === 0) {
          Object.assign(model, { [inputRelation as keyof T]: null });
        } else if (relatedModels.length === 1) {
          Object.assign(model, {
            [inputRelation as keyof T]: relatedModels[0],
          });
        } else {
          Object.assign(model, { [inputRelation as keyof T]: relatedModels });
        }
        log(relationQuery, logs);
      });

      await Promise.all(relationPromises);
    } catch (error) {
      queryError("Query Error: " + relationQuery + error);
      throw new Error("Failed to parse relations " + error);
    }
  }
}

export default new PostgresModelManagerUtils();
