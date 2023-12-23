export class Column {
    constructor() {
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "oldName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // used for alter table
        Object.defineProperty(this, "type", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "values", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "length", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "alter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // used for alter table
        Object.defineProperty(this, "after", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // used for alter table
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                nullable: true,
                unique: false,
                autoIncrement: false,
                primary: false,
                defaultValue: false,
                autoCreate: false,
                autoUpdate: false,
                references: undefined,
                unsigned: false,
                cascade: false,
            }
        });
    }
    getColumn() {
        return this;
    }
}
