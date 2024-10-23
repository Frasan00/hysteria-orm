import { Model } from "../model";
import { Relation, RelationEnum, RelationOptions } from "./relation";

export class BelongsTo extends Relation {
  type: RelationEnum;
  foreignKey: string;

  constructor(
    relatedModel: typeof Model,
    columnName: string,
    foreignKey: string,
    options?: RelationOptions,
  ) {
    super(relatedModel, columnName, options);
    this.foreignKey = foreignKey;
    this.type = RelationEnum.belongsTo;
  }
}
