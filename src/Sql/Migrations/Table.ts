import { Column } from "./Columns/Column";
import { DropColumn } from "./Columns/DropColumn";
import { ColumnTypeBuilder } from "./Columns/ColumnBuilders/ColumnTypeBuilder";
import { MigrationType } from "./Migration";

export class Table {
  public tableName: string;
  public columnsToAdd: Column[] = [];
  public columnsToAlter: Column[] = [];
  public columnsToDelete: DropColumn[] = [];
  public dropTable: boolean = false;
  public truncateTable: boolean = false;
  public migrationType!: MigrationType;

  constructor(tableName: string, migrationType: MigrationType) {
    this.tableName = tableName;
    this.migrationType = migrationType;
  }

  public column(): ColumnTypeBuilder {
    const column = new Column();
    return new ColumnTypeBuilder(column, this, this.migrationType);
  }

  public dropColumn(columnName: string, foreignKey?: boolean): void {
    const column = new DropColumn(columnName, foreignKey);
    this.columnsToDelete.push(column);
  }

  public drop(): void {
    this.dropTable = true;
  }

  public truncate(): void {
    this.truncateTable = true;
  }
}
