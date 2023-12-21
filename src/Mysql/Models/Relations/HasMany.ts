import { Relation, RelationType } from "./Relation";
import { Model } from "../Model";

export class HasMany extends Relation {
  public type: RelationType = RelationType.hasMany;
  public foreignKey: string;

  public constructor(relatedModel: string, foreignKey: string) {
    super(relatedModel);
    this.foreignKey = foreignKey;
    this.type = RelationType.hasMany;
  }
}
