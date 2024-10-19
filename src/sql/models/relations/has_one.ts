import { Model } from "../model";
import { Relation, RelationEnum, RelationOptions } from "./relation";

export class HasOne extends Relation {
  public type: RelationEnum;
  public foreignKey: string;

  public constructor(
    relatedModel: typeof Model,
    columnName: string,
    foreignKey: string,
    options?: RelationOptions,
  ) {
    super(relatedModel, columnName, options);
    this.foreignKey = foreignKey;
    this.type = RelationEnum.hasOne;
  }
}
