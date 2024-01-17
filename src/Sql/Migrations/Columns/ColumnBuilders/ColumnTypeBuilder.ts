import { Column } from "../Column";
import { ColumnConfigBuilder } from "./ColumnConfigBuilder";
import { Table } from "../../Table";
import { MigrationType } from "../../Migration";

export class ColumnTypeBuilder {
  protected column: Column;
  protected table: Table;
  protected migrationType: MigrationType;

  constructor(column: Column, table: Table, migrationType: MigrationType) {
    this.column = column;
    this.table = table;
    this.migrationType = migrationType;
  }

  public string(name: string, length: number = 100): ColumnConfigBuilder {
    this.column.name = name;
    this.column.type = "VARCHAR";
    this.column.length = length;
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }

  public text(name: string): ColumnConfigBuilder {
    this.column.name = name;
    this.column.type = "TEXT";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }

  public int(name: string, length: number = 100): ColumnConfigBuilder {
    this.column.name = name;
    this.column.type = "INT";
    this.column.length = length;
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }

  public bigInt(name: string): ColumnConfigBuilder {
    this.column.name = name;
    this.column.type = "BIGINT";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }

  public float(name: string): ColumnConfigBuilder {
    this.column.name = name;
    this.column.type = "FLOAT";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }

  public double(name: string): ColumnConfigBuilder {
    this.column.name = name;
    this.column.type = "DOUBLE";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }

  public decimal(name: string): ColumnConfigBuilder {
    this.column.name = name;
    this.column.type = "DECIMAL";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }

  public boolean(name: string): ColumnConfigBuilder {
    this.column.name = name;
    this.column.type = "BOOLEAN";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }

  public date(name: string): ColumnConfigBuilder {
    this.column.name = name;
    this.column.type = "DATE";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }

  public dateTime(name: string): ColumnConfigBuilder {
    this.column.name = name;
    this.column.type = "DATETIME";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }

  public time(name: string): ColumnConfigBuilder {
    this.column.name = name;
    this.column.type = "TIME";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }

  public timestamp(name: string): ColumnConfigBuilder {
    this.column.name = name;
    this.column.type = "TIMESTAMP";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }

  public bit(name: string): ColumnConfigBuilder {
    this.column.name = name;
    this.column.type = "BIT";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }

  public enum(name: string, values: string[]): ColumnConfigBuilder {
    this.column.name = name;
    this.column.type = "ENUM";
    this.column.values = values;
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }

  public set(name: string, values: string[]): ColumnConfigBuilder {
    this.column.name = name;
    this.column.type = "SET";
    this.column.values = values;
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }

  public uuid(name: string): ColumnConfigBuilder {
    this.column.name = name;
    this.column.type = "UUID";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }

  public char(name: string): ColumnConfigBuilder {
    this.column.name = name;
    this.column.type = "CHAR";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }

  public tinyText(name: string): ColumnConfigBuilder {
    this.column.name = name;
    this.column.type = "TINYTEXT";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }

  public mediumText(name: string): ColumnConfigBuilder {
    this.column.name = name;
    this.column.type = "MEDIUMTEXT";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }

  public longText(name: string): ColumnConfigBuilder {
    this.column.name = name;
    this.column.type = "LONGTEXT";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }

  public tinyInteger(name: string): ColumnConfigBuilder {
    this.column.name = name;
    this.column.type = "TINYINT";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }

  public smallInteger(name: string): ColumnConfigBuilder {
    this.column.name = name;
    this.column.type = "SMALLINT";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }

  public mediumInteger(name: string): ColumnConfigBuilder {
    this.column.name = name;
    this.column.type = "MEDIUMINT";
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }

  public renameColumn(oldName: string, newName: string): ColumnConfigBuilder {
    this.column.oldName = oldName;
    this.column.name = newName;
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
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
    return new ColumnConfigBuilder(this.column, this.table, this.migrationType);
  }

  public after(columnName: string): ColumnTypeBuilder {
    this.column.after = columnName;
    return this;
  }
}
