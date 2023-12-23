import { Table } from "./Table";
import path from "path";

export type MigrationType = "create" | "alter" | "rawQuery" | "drop";

export abstract class Migration {
  public migrationName: string = path.basename(__filename);
  public tableName!: string;
  public migrationType!: MigrationType;
  public table!: Table;
  public rawQuery: string = "";

  public abstract up(): void;
  public abstract down(): void;

  /**
   * @description Use this method to manage a table in your migration (create, alter, drop)
   * @param tableName
   * @param migrationType
   */
  public useTable(tableName: string, migrationType: MigrationType): void {
    this.tableName = tableName;
    this.migrationType = migrationType;
    this.table = new Table(this.tableName, this.migrationType);
  }

  /**
   * @description Use this method to run a raw query in your migration
   * @param query
   */
  public useRawQuery(query: string): void {
    this.migrationType = "rawQuery";
    this.rawQuery = query;
  }
}
