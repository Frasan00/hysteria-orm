/**
 * MigrationParser converts a migration class into sql statements to run on the database
 */
import { Migration } from "./Migration";
import { createTable } from "../Templates/Migration/CREATETABLE";
import { alterTable } from "../Templates/Migration/ALTERTABLE";
import { dropColumn } from "../Templates/Migration/DROPCOLUMN";
import { dropTruncateTable } from "../Templates/Migration/DROPTRUNCATETABLE";

class MigrationParser {
  public parseCreateTableMigration<T extends Migration>(migration: T): string {
    return createTable(migration.tableName, migration.table.columnsToAdd);
  }

  public parseAlterTableMigration<T extends Migration>(migration: T): string {
    return alterTable(migration.tableName, migration.table.columnsToAlter);
  }

  public parseDropColumnMigration<T extends Migration>(migration: T): string {
    return dropColumn(migration.tableName, migration.table.columnsToDelete);
  }

  public parseDropTruncateTableMigration<T extends Migration>(
    migration: T,
  ): string {
    return dropTruncateTable(migration.table);
  }
}

export default new MigrationParser();
