import {
  FindType,
  FindOneType,
} from "../Models/ModelManager/ModelManagerTypes";
import selectTemplate from "../Resources/Query/SELECT";
import { Metadata, Model } from "../Models/Model";
import insertTemplate from "../Resources/Query/INSERT";
import updateTemplate from "../Resources/Query/UPDATE";
import deleteTemplate from "../Resources/Query/DELETE";
import { Relation } from "../Models/Relations/Relation";
import { log, queryError } from "../../Logger";
import relationTemplates from "../Resources/Query/RELATIONS";
import { Pool, RowDataPacket } from "mysql2/promise";
import whereTemplate from "../Resources/Query/WHERE.TS";

export default class MySqlModelManagerUtils<T extends Model> {
  public parseSelectQueryInput(
    model: typeof Model,
    input: FindType<T> | FindOneType<T>,
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
    input: FindType<T> | FindOneType<T>,
  ): string {
    const select = selectTemplate(tableName, "mysql");
    return input.select
      ? select.selectColumns(...(input.select as string[]))
      : select.selectAll;
  }

  private parseWhere(
    tableName: string,
    input: FindType<T> | FindOneType<T>,
  ): { query: string; params: any[] } {
    const params: any[] = [];
    const where = whereTemplate(tableName, "mysql");
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
    input: FindType<T> | FindOneType<T>,
  ): string {
    if (!this.isFindType(input)) {
      return "";
    }

    const select = selectTemplate(tableName, "mysql");
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
    return deleteTemplate(tableName, "mysql").delete(column, value.toString());
  }

  private isFindType(
    input: FindType<T> | FindOneType<T>,
  ): input is FindType<T> {
    const instance = input as FindType<T>;
    return (
      instance.hasOwnProperty("offset") ||
      instance.hasOwnProperty("groupBy") ||
      instance.hasOwnProperty("orderBy") ||
      instance.hasOwnProperty("limit")
    );
  }

  /*private _parseJoin(model: T, input: FindType | FindOneType): string {
    if (!input.relations) {
      return "";
    }

    const relations: string[] = input.relations.map((relationField) => {
      const relation: Relation = this.getRelationFromModel(
        model,
        relationField,
      );
      const join = joinTemplate(model.metadata.tableName, relation.relatedModel);
      switch (relation.type) {
        case RelationType.belongsTo:
          const belongsTo = relation as BelongsTo;
          return join.belongsTo(belongsTo.foreignKey);

        case RelationType.hasOne:
          return join.hasOne();
        case RelationType.hasMany:
          return join.hasMany(model.metadata.primaryKey as string);

        default:
          throw new Error("Relation type not supported");
      }
    });

    return relations.join("\n");
  }*/

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
  public async parseRelationInput(
    model: T,
    metadata: Metadata,
    input: FindOneType<T>,
    mysqlConnection: Pool,
    logs: boolean,
  ): Promise<void> {
    if (!input.relations) {
      return;
    }

    if (!metadata.primaryKey) {
      throw new Error("Model does not have a primary key");
    }

    try {
      const relationPromises = input.relations.map(
        async (inputRelation: any) => {
          const relation = this.getRelationFromModel(
            model,
            metadata,
            inputRelation,
          );
          const relationQuery = relationTemplates(model, relation);

          const [relatedModels] =
            await mysqlConnection.query<RowDataPacket[]>(relationQuery);
          if (relatedModels.length === 0) {
            Object.assign(model, { [inputRelation as keyof T]: null });
            log(relationQuery, logs);
            return;
          }

          if (relatedModels.length === 1) {
            Object.assign(model, {
              [inputRelation as keyof T]: relatedModels[0],
            });
            log(relationQuery, logs);
            return;
          }

          Object.assign(model, { [inputRelation as keyof T]: relatedModels });
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
    metadata: Metadata,
    input: string[],
    mysqlConnection: Pool,
    logs: boolean,
  ): Promise<void> {
    if (input.length === 0) {
      return;
    }

    if (!metadata.primaryKey) {
      throw new Error("Model does not have a primary key");
    }

    let relationQuery: string = "";
    try {
      const relationPromises = input.map(async (inputRelation: string) => {
        const relation = this.getRelationFromModel(
          model,
          metadata,
          inputRelation,
        );
        relationQuery = relationTemplates(model, relation);

        const [relatedModels] =
          await mysqlConnection.query<RowDataPacket[]>(relationQuery);
        if (relatedModels.length === 0) {
          Object.assign(model, { [inputRelation as keyof T]: null });
          log(relationQuery, logs);
          return;
        }

        if (relatedModels.length === 1) {
          Object.assign(model, {
            [inputRelation as keyof T]: relatedModels[0],
          });
          log(relationQuery, logs);
          return;
        }

        Object.assign(model, { [inputRelation as keyof T]: relatedModels });
        log(relationQuery, logs);
      });

      await Promise.all(relationPromises);
    } catch (error) {
      queryError("Query Error: " + relationQuery + error);
      throw new Error("Failed to parse relations " + error);
    }
  }
}
