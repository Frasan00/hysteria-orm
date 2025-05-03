import { Model } from "../model";
import { Relation, RelationEnum } from "./relation";

export class ManyToMany extends Relation {
  type = RelationEnum.manyToMany;
  /**
   * @description The model that establishes the relation
   */
  primaryModel: string;
  /**
   * @description The model that is being related to
   */
  relatedModel: string;
  /**
   * @description The foreign key of the related model in the through table
   */
  relatedModelForeignKey: string;
  /**
   * @description The table that joins the two models
   */
  throughModel: string;
  /**
   * @description The foreign key of the primary model in the through table
   */
  throughModelForeignKey: string;

  constructor(
    model: typeof Model,
    columnName: string,
    data: {
      primaryModel: string;
      throughModel: string;
      throughModelForeignKey: string;
      relatedModelForeignKey: string;
    },
  ) {
    super(model, columnName);
    this.primaryModel = data.primaryModel;
    this.relatedModel = model.table;
    this.throughModel = data.throughModel;
    this.throughModelForeignKey = data.throughModelForeignKey;
    this.relatedModelForeignKey = data.relatedModelForeignKey;
  }
}
