import { Model } from "../Model";

/**
 * @description Options for the relation
 * @property {string} softDeleteColumn - The column name for the soft delete column, if set, the relation will only return rows that have not been soft deleted
 * @property {string} softDeleteType - The type of the soft delete column
 */
export interface RelationOptions {
  softDeleteColumn: string;
  softDeleteType: "date" | "boolean";
}

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
  public model: typeof Model = Model;
  public columnName: string = "";
  public foreignKey?: string;
  public relatedModel: string = "";
  public options?: RelationOptions;

  protected constructor(
    model: typeof Model,
    columnName: string,
    options?: RelationOptions,
  ) {
    this.model = model;
    this.columnName = columnName;
    this.relatedModel = this.model.table;
    this.options = options;
  }
}
