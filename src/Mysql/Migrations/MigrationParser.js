import { createTable } from "../Templates/Migration/CREATETABLE";
import { alterTable } from "../Templates/Migration/ALTERTABLE";
import { dropColumn } from "../Templates/Migration/DROPCOLUMN";
import { dropTruncateTable } from "../Templates/Migration/DROPTRUNCATETABLE";
class MigrationParser {
    parseCreateTableMigration(migration) {
        return createTable(migration.tableName, migration.table.columnsToAdd);
    }
    parseAlterTableMigration(migration) {
        return alterTable(migration.tableName, migration.table.columnsToAlter);
    }
    parseDropColumnMigration(migration) {
        return dropColumn(migration.tableName, migration.table.columnsToDelete);
    }
    parseDropTruncateTableMigration(migration) {
        return dropTruncateTable(migration.table);
    }
}
export default new MigrationParser();
