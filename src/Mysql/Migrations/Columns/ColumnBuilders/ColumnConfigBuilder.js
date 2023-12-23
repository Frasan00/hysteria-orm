export class ColumnConfigBuilder {
    constructor(column, table, migrationType) {
        Object.defineProperty(this, "column", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "table", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "migrationType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.column = column;
        this.table = table;
        this.migrationType = migrationType;
    }
    nullable() {
        this.column.config.nullable = true;
        return this;
    }
    notNullable() {
        this.column.config.nullable = false;
        return this;
    }
    unique() {
        this.column.config.unique = true;
        return this;
    }
    autoIncrement() {
        this.column.config.autoIncrement = true;
        return this;
    }
    primary() {
        this.column.config.primary = true;
        return this;
    }
    cascade() {
        this.column.config.cascade = true;
        return this;
    }
    defaultValue(value) {
        this.column.config.defaultValue = value;
        return this;
    }
    autoCreate() {
        this.column.config.autoCreate = true;
        return this;
    }
    autoUpdate() {
        this.column.config.autoUpdate = true;
        return this;
    }
    references(table, column) {
        this.column.config.references = {
            table,
            column,
        };
        return this;
    }
    unsigned() {
        this.column.config.unsigned = true;
        return this;
    }
    commit() {
        switch (this.migrationType) {
            case "create":
                this.table.columnsToAdd.push(this.column);
                break;
            case "alter":
                this.table.columnsToAlter.push(this.column);
                break;
        }
    }
    alter() {
        this.column.alter = true;
        return this;
    }
    after(columnName) {
        this.column.after = columnName;
        return this;
    }
}
