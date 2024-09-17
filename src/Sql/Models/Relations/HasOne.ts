import { Relation, RelationOptions, RelationType } from "./Relation";
import { Model } from "../Model";

export class HasOne extends Relation {
  public type: RelationType;
  public foreignKey: string;

  public constructor(
    relatedModel: typeof Model,
    foreignKey: string,
    options?: RelationOptions,
  ) {
    super(relatedModel, options);
    this.foreignKey = foreignKey;
    this.type = RelationType.hasOne;
  }
}
