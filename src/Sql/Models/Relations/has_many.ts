import { Relation, RelationOptions, RelationType } from "./relation";
import { Model } from "../model";

export class Has_many extends Relation {
  public type: RelationType = RelationType.hasMany;
  public foreignKey: string;

  public constructor(
    relatedModel: typeof Model,
    columnName: string,
    foreignKey: string,
    options?: RelationOptions,
  ) {
    super(relatedModel, columnName, options);
    this.foreignKey = foreignKey;
    this.type = RelationType.hasMany;
  }
}
