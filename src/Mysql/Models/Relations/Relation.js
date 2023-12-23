export var RelationType;
(function (RelationType) {
    RelationType["hasOne"] = "hasOne";
    RelationType["belongsTo"] = "belongsTo";
    RelationType["hasMany"] = "hasMany";
})(RelationType || (RelationType = {}));
/**
 * Main Model -> Related Model
 */
export class Relation {
    constructor(relatedModel) {
        Object.defineProperty(this, "foreignKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "relatedModel", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.relatedModel = relatedModel;
    }
}
