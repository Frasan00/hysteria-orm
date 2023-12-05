import { Relation, RelationType } from "./Relation";
import { Model } from "../Model";

export class HasOne extends Relation {
  public type: RelationType;

  public constructor(relatedModel: string, foreignKey: string) {
    super(relatedModel, foreignKey);
    this.type = RelationType.hasOne;
  }
}