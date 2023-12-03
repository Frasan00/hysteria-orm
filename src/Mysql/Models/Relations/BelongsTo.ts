import { Relation, RelationType } from "./Relation";
import { Model } from "../Model";

export class BelongsTo extends Relation {
  public type: RelationType;

  public constructor(relatedModel: string, foreignKey: string) {
    super(relatedModel, foreignKey);
    this.type = RelationType.belongsTo;
  }
}
