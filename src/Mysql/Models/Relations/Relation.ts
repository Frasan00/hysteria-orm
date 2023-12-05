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
  public relatedModel: string;
  public foreignKey?: string;

  protected constructor(relatedModel: string, foreignKey?: string) {
    this.relatedModel = relatedModel;
    this.foreignKey = foreignKey;
  }
}
