import { Model } from "../Model";

export enum RelationType {
  hasOne = "hasOne", // One to One without foreign key
  belongsTo = "belongsTo", // One to One with foreign key
  hasMany = "hasMany",
}

/**
 * Main Model -> Related Model
 */

export abstract class Relation {
  public abstract type: RelationType;
  public foreignKey?: string;
  public relatedModel: string;

  protected constructor(relatedModel: string) {
    this.relatedModel = relatedModel;
  }
}
