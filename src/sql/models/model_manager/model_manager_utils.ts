import { HysteriaError } from "../../../errors/hysteria_error";
import { SqlDataSource } from "../../sql_data_source";
import { SqlDataSourceType } from "../../sql_data_source_types";
import { getRelations } from "../decorators/model_decorators";
import { Model } from "../model";
import { Relation } from "../relations/relation";
import { ModelRelation } from "./model_manager_types";

export default class SqlModelManagerUtils<T extends Model> {
  protected dbType: SqlDataSourceType;
  protected sqlDataSource: SqlDataSource;
  protected modelRelations: Relation[];
  protected modelRelationsMap: Map<string, Relation>;

  constructor(
    typeofModel: typeof Model,
    dbType: SqlDataSourceType,
    sqlDataSource: SqlDataSource,
  ) {
    this.dbType = dbType;
    this.sqlDataSource = sqlDataSource;
    this.modelRelations = getRelations(typeofModel);
    this.modelRelationsMap = new Map(
      this.modelRelations.map((relation) => [relation.columnName, relation]),
    );
  }

  getRelationFromModel(relation: ModelRelation<T>): Relation {
    const modelRelation = this.modelRelationsMap.get(relation.toString());
    if (!modelRelation) {
      throw new HysteriaError(
        "SqlModelManagerUtils::getRelationFromModel",
        `RELATION_NOT_FOUND_IN_MODEL_${relation.toString()}`,
      );
    }

    return modelRelation;
  }
}
