export class DropColumn {
    constructor(name, foreignKey = false) {
        Object.defineProperty(this, "name", {
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
        this.name = name;
        this.foreignKey = foreignKey;
    }
    getColumn() {
        return this;
    }
}
