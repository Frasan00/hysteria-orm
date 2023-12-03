import { Relation, RelationType } from "./Relation";
import { Model } from "../Model";

export class HasMany extends Relation {
  public type: RelationType = RelationType.hasMany;

  constructor(relatedModel: string, foreignKey: string) {
    super(relatedModel, foreignKey);
  }
}
