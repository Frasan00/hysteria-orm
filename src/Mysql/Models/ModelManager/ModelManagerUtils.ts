import { FindType, FindOneType } from "./ModelManagerTypes";
import selectTemplate from "../../Templates/Query/SELECT";
import { Model } from "../Model";
import insertTemplate from "../../Templates/Query/INSERT";
import updateTemplate from "../../Templates/Query/UPDATE";
import deleteTemplate from "../../Templates/Query/DELETE";
import { Relation } from "../Relations/Relation";
import { log, queryError } from "../../../Logger";
import relationTemplates from "../../Templates/Query/RELATIONS";
import { Pool, RowDataPacket } from "mysql2/promise";
import whereTemplate from "../../Templates/Query/WHERE.TS";

class ModelManagerUtils<T extends Model> {
  public parseSelectQueryInput(
    model: T,
    input: FindType | FindOneType,
  ): string {
    let query = "";
    query += this.parseSelect(model.metadata.tableName, input);
    query += this.parseWhere(model.metadata.tableName, input);
    query += this.parseQueryFooter(model.metadata.tableName, input);

    return query;
  }

  private parseSelect(
    tableName: string,
    input: FindType | FindOneType,
  ): string {
    const select = selectTemplate(tableName);
    return input.select
      ? select.selectColumns(...input.select)
      : select.selectAll;
  }

  private parseWhere(tableName: string, input: FindType | FindOneType): string {
    const where = whereTemplate(tableName);
    if (!input.where) {
      return "";
    }

    let query = "";
    const entries = Object.entries(input.where);
    for (let index = 0; index < entries.length; index++) {
      const [key, value] = entries[index];

      if (index === 0) {
        query += where.where(key, value);
        continue;
      }
      query += where.andWhere(key, value);
    }

    return query;
  }
  private parseQueryFooter(
    tableName: string,
    input: FindType | FindOneType,
  ): string {
    if (!this.isFindType(input)) {
      return "";
    }

    const select = selectTemplate(tableName);
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

  public parseInsert(model: T): string {
    const keys = Object.keys(model);
    const values = Object.values(model);
    const insert = insertTemplate(model.metadata.tableName);

    return insert.insert(keys, values);
  }

  public parseUpdate(model: T): string {
    const update = updateTemplate(model.metadata.tableName);
    const keys = Object.keys(model);
    const values = Object.values(model);
    return update.update(keys, values);
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

  private getRelationFromModel(model: T, relationField: string): Relation {
    const relation = model[relationField as keyof T] as Relation;
    if (!relation) {
      throw new Error(
        "Relation " +
          relationField +
          " not found in model " +
          model.metadata.tableName,
      );
    }

    return relation;
  }

  // Parses and fills input relations directly into the model
  public async parseRelationInput(
    model: T,
    input: FindOneType,
    mysqlConnection: Pool,
    logs: boolean,
  ): Promise<void> {
    if (!input.relations) {
      return;
    }

    if (!model.metadata.primaryKey) {
      throw new Error("Model does not have a primary key");
    }

    try {
      const relationPromises = input.relations.map(
        async (inputRelation: string) => {
          const relation = this.getRelationFromModel(model, inputRelation);
          const relationQuery = relationTemplates(model, relation);
          console.log(relationQuery);

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
    input: string[],
    mysqlConnection: Pool,
    logs: boolean,
  ): Promise<void> {
    if (input.length === 0) {
      return;
    }

    if (!model.metadata.primaryKey) {
      throw new Error("Model does not have a primary key");
    }

    let relationQuery: string = "";
    try {
      const relationPromises = input.map(async (inputRelation: string) => {
        const relation = this.getRelationFromModel(model, inputRelation);
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

export default new ModelManagerUtils();
