import { Table } from "./Table";

type MigrationType = "create" | "alter" | "drop" | "rename";

export abstract class Migration {
  public table!: Table;
  public abstract migrationType: MigrationType;

  public async up(): Promise<void> {
    this.table.
  }
  public async down(): Promise<void> {}
}
