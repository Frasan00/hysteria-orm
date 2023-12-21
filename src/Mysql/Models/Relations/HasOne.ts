import { Relation, RelationType } from "./Relation";
import { Model } from "../Model";

export class HasOne extends Relation {
  public type: RelationType;
  public foreignKey: string;

  public constructor(relatedModel: string, foreignKey: string) {
    super(relatedModel);
    this.foreignKey = foreignKey;
    this.type = RelationType.hasOne;
  }
}
