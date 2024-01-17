import { Column } from "../Column";
import { Table } from "../../Table";
import { MigrationType } from "../../Migration";

export class ColumnConfigBuilder {
  protected column: Column;
  protected table: Table;
  protected migrationType: MigrationType;

  constructor(column: Column, table: Table, migrationType: MigrationType) {
    this.column = column;
    this.table = table;
    this.migrationType = migrationType;
  }

  public nullable(): ColumnConfigBuilder {
    this.column.config.nullable = true;
    return this;
  }

  public notNullable(): ColumnConfigBuilder {
    this.column.config.nullable = false;
    return this;
  }

  public unique(): ColumnConfigBuilder {
    this.column.config.unique = true;
    return this;
  }

  public autoIncrement(): ColumnConfigBuilder {
    this.column.config.autoIncrement = true;
    return this;
  }

  public primary(): ColumnConfigBuilder {
    this.column.config.primary = true;
    return this;
  }

  public cascade(): ColumnConfigBuilder {
    this.column.config.cascade = true;
    return this;
  }

  public defaultValue(value: string): ColumnConfigBuilder {
    this.column.config.defaultValue = value;
    return this;
  }

  public autoCreate(): ColumnConfigBuilder {
    this.column.config.autoCreate = true;
    return this;
  }

  public autoUpdate(): ColumnConfigBuilder {
    this.column.config.autoUpdate = true;
    return this;
  }

  public references(table: string, column: string): ColumnConfigBuilder {
    this.column.config.references = {
      table,
      column,
    };
    return this;
  }

  public unsigned(): ColumnConfigBuilder {
    this.column.config.unsigned = true;
    return this;
  }

  public commit(): void {
    switch (this.migrationType) {
      case "create":
        this.table.columnsToAdd.push(this.column);
        break;
      case "alter":
        this.table.columnsToAlter.push(this.column);
        break;
    }
  }

  public alter(): ColumnConfigBuilder {
    this.column.alter = true;
    return this;
  }

  public after(columnName: string): ColumnConfigBuilder {
    this.column.after = columnName;
    return this;
  }
}
