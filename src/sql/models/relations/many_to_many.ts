import { Model } from "../model";
import { Relation, RelationEnum } from "./relation";

export class ManyToMany extends Relation {
  type = RelationEnum.manyToMany;
  throughModel: string = "";
  foreignKey: string = "";
  relatedModelForeignKey: string = "";

  constructor(
    model: typeof Model,
    columnName: string,
    throughModel: string,
    foreignKey: string,
  ) {
    super(model, columnName);
    this.columnName = columnName;
    this.foreignKey = foreignKey;
    this.throughModel = throughModel;
  }
}
