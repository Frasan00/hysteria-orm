export class Model {
    constructor(tableName, primaryKey) {
        Object.defineProperty(this, "metadata", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.metadata = {
            tableName: tableName || this.constructor.name,
            primaryKey: primaryKey,
        };
    }
}
