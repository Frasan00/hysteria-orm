import { Model } from "../model";
import { Relation, RelationEnum } from "./relation";

export class HasMany extends Relation {
  type: RelationEnum = RelationEnum.hasMany;
  foreignKey: string;

  constructor(
    relatedModel: typeof Model,
    columnName: string,
    foreignKey: string,
  ) {
    super(relatedModel, columnName);
    this.foreignKey = foreignKey;
    this.type = RelationEnum.hasMany;
  }
}
