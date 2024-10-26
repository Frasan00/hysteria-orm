import { Model } from "../model";
import { Relation, RelationEnum } from "./relation";

export class HasOne extends Relation {
  type: RelationEnum;
  foreignKey: string;

  constructor(
    relatedModel: typeof Model,
    columnName: string,
    foreignKey: string,
  ) {
    super(relatedModel, columnName);
    this.foreignKey = foreignKey;
    this.type = RelationEnum.hasOne;
  }
}
