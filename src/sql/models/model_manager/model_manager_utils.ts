import { HysteriaError } from "../../../errors/hysteria_error";
import { SqlDataSource } from "../../sql_data_source";
import { SqlDataSourceType } from "../../sql_data_source_types";
import { getRelations } from "../decorators/model_decorators";
import { Model } from "../model";
import { Relation } from "../relations/relation";

export default class SqlModelManagerUtils<T extends Model> {
  protected dbType: SqlDataSourceType;
  protected sqlDataSource: SqlDataSource;

  constructor(dbType: SqlDataSourceType, sqlDataSource: SqlDataSource) {
    this.dbType = dbType;
    this.sqlDataSource = sqlDataSource;
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
}
