import { Relation, RelationOptions, RelationType } from "./Relation";
import { Model } from "../Model";

export class BelongsTo extends Relation {
  public type: RelationType;
  public foreignKey: string;

  public constructor(
    relatedModel: typeof Model,
    columnName: string,
    foreignKey: string,
    options?: RelationOptions,
  ) {
    super(relatedModel, columnName, options);
    this.foreignKey = foreignKey;
    this.type = RelationType.belongsTo;
  }
}
