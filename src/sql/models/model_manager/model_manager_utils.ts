import { HysteriaError } from "../../../errors/hysteria_error";
import { log } from "../../../utils/logger";
import { RelationQueryBuilder } from "../../model_query_builder/model_query_builder_types";
import deleteTemplate from "../../resources/query/DELETE";
import insertTemplate from "../../resources/query/INSERT";
import relationTemplates from "../../resources/query/RELATION";
import updateTemplate from "../../resources/query/UPDATE";
import { SqlDataSource } from "../../sql_data_source";
import { SqlDataSourceType } from "../../sql_data_source_types";
import { execSql } from "../../sql_runner/sql_runner";
import { Model } from "../model";
import { getRelations } from "../model_decorators";
import { Relation } from "../relations/relation";

export default class SqlModelManagerUtils<T extends Model> {
  private dbType: SqlDataSourceType;
  private sqlDataSource: SqlDataSource;

  constructor(dbType: SqlDataSourceType, sqlDataSource: SqlDataSource) {
    this.dbType = dbType;
    this.sqlDataSource = sqlDataSource;
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
      throw new HysteriaError(
        "SqlModelManagerUtils::getRelationFromModel",
        `RELATION_NOT_FOUND_IN_MODEL_${relationField}`,
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
      throw new HysteriaError(
        "SqlModelManagerUtils::parseQueryBuilderRelations",
        "MODEL_HAS_NO_PRIMARY_KEY",
      );
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
          let result = await execSql(query, params, this.sqlDataSource, "raw", {
            sqlLiteOptions: {
              typeofModel: typeofModel,
            },
          });

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
            if (row.relation_name) {
              delete row.relation_name;
            }

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
}
