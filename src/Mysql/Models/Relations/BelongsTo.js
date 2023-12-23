import { Relation, RelationType } from "./Relation";
export class BelongsTo extends Relation {
    constructor(relatedModel, foreignKey) {
        super(relatedModel);
        Object.defineProperty(this, "type", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "foreignKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.foreignKey = foreignKey;
        this.type = RelationType.belongsTo;
    }
}
