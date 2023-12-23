import { ColumnConfigBuilder } from "./ColumnConfigBuilder";
export class ColumnTypeBuilder {
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
    string(name, length = 100) {
        this.column.name = name;
        this.column.type = "VARCHAR";
        this.column.length = length;
        return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
    }
    text(name) {
        this.column.name = name;
        this.column.type = "TEXT";
        return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
    }
    int(name, length = 100) {
        this.column.name = name;
        this.column.type = "INT";
        this.column.length = length;
        return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
    }
    bigInt(name) {
        this.column.name = name;
        this.column.type = "BIGINT";
        return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
    }
    float(name) {
        this.column.name = name;
        this.column.type = "FLOAT";
        return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
    }
    double(name) {
        this.column.name = name;
        this.column.type = "DOUBLE";
        return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
    }
    decimal(name) {
        this.column.name = name;
        this.column.type = "DECIMAL";
        return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
    }
    boolean(name) {
        this.column.name = name;
        this.column.type = "BOOLEAN";
        return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
    }
    date(name) {
        this.column.name = name;
        this.column.type = "DATE";
        return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
    }
    dateTime(name) {
        this.column.name = name;
        this.column.type = "DATETIME";
        return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
    }
    time(name) {
        this.column.name = name;
        this.column.type = "TIME";
        return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
    }
    timestamp(name) {
        this.column.name = name;
        this.column.type = "TIMESTAMP";
        return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
    }
    bit(name) {
        this.column.name = name;
        this.column.type = "BIT";
        return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
    }
    enum(name, values) {
        this.column.name = name;
        this.column.type = "ENUM";
        this.column.values = values;
        return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
    }
    set(name, values) {
        this.column.name = name;
        this.column.type = "SET";
        this.column.values = values;
        return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
    }
    uuid(name) {
        this.column.name = name;
        this.column.type = "UUID";
        return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
    }
    char(name) {
        this.column.name = name;
        this.column.type = "CHAR";
        return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
    }
    tinyText(name) {
        this.column.name = name;
        this.column.type = "TINYTEXT";
        return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
    }
    mediumText(name) {
        this.column.name = name;
        this.column.type = "MEDIUMTEXT";
        return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
    }
    longText(name) {
        this.column.name = name;
        this.column.type = "LONGTEXT";
        return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
    }
    tinyInteger(name) {
        this.column.name = name;
        this.column.type = "TINYINT";
        return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
    }
    smallInteger(name) {
        this.column.name = name;
        this.column.type = "SMALLINT";
        return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
    }
    mediumInteger(name) {
        this.column.name = name;
        this.column.type = "MEDIUMINT";
        return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
    }
    renameColumn(oldName, newName) {
        this.column.oldName = oldName;
        this.column.name = newName;
        return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
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
        return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
    }
    after(columnName) {
        this.column.after = columnName;
        return this;
    }
}
