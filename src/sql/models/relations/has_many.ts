import { Model } from "../model";
import { Relation, RelationEnum, RelationOptions } from "./relation";

export class HasMany extends Relation {
  type: RelationEnum = RelationEnum.hasMany;
  foreignKey: string;

  constructor(
    relatedModel: typeof Model,
    columnName: string,
    foreignKey: string,
    options?: RelationOptions,
  ) {
    super(relatedModel, columnName, options);
    this.foreignKey = foreignKey;
    this.type = RelationEnum.hasMany;
  }
}
