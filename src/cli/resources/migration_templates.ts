import { SqlDataSourceType } from "../../sql/sql_data_source_types";

class MigrationTemplates {
  parseGetAllTables(
    dbType: SqlDataSourceType,
    database: string,
    result: any,
  ): string[] {
    switch (dbType) {
      case "mysql":
      case "mariadb":
        const rows = result[0];
        return rows.map((row: any) => row[`Tables_in_${database}`]);
      case "cockroachdb":
      case "postgres":
        return result.rows.map((row: any) => row.table_name);
      case "mssql":
        return result.recordset.map((row: any) => row.TABLE_NAME);
      case "oracledb":
        return (result.rows || [])
          .map((row: any) => {
            if (Array.isArray(row)) return row[0];
            return row?.TABLE_NAME;
          })
          .filter(
            (name: any): name is string =>
              typeof name === "string" && name.length > 0,
          );
      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }
  }

  getAllTablesTemplate(dbType: SqlDataSourceType, database: string): string {
    switch (dbType) {
      case "mysql":
      case "mariadb":
        return `SHOW TABLES FROM ${database};`;
      case "cockroachdb":
      case "postgres":
        return `SELECT table_name
FROM information_schema.tables
WHERE table_catalog = '${database}'
  AND table_schema = 'public'
  AND table_type = 'BASE TABLE';`;
      case "mssql":
        return `SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_CATALOG = '${database}'
  AND TABLE_TYPE = 'BASE TABLE';`;
      case "oracledb":
        return `SELECT TABLE_NAME FROM USER_TABLES`;
      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }
  }

  dropAllTablesTemplate(dbType: SqlDataSourceType, tables: string[]): string {
    if (!tables.length) {
      return "SELECT 1;";
    }

    switch (dbType) {
      case "mysql":
      case "mariadb":
      case "cockroachdb":
      case "postgres":
        return `DROP TABLE IF EXISTS ${tables.join(", ")} CASCADE;`;
      case "mssql":
        return tables
          .map((table) => `DROP TABLE IF EXISTS [${table}];`)
          .join("\n");
      case "oracledb":
        // Oracle doesn't support DROP TABLE IF EXISTS or CASCADE in standard syntax
        // Use PURGE to immediately free space
        return (
          tables
            .map((table) => `DROP TABLE "${table}" CASCADE CONSTRAINTS PURGE`)
            .join(";\n") + ";"
        );
      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }
  }

  basicMigrationTemplate(js: boolean = false): string {
    if (js) {
      return `import { Migration } from 'hysteria-orm';

export default class extends Migration {
  async up() {
    // Your migration logic here
  }

  async down() {
    // Your rollback logic here
  }
}
`;
    }

    return `import { Migration } from 'hysteria-orm';

export default class extends Migration {
  async up(): Promise<void> {
    // Your migration logic here
  }

  async down(): Promise<void> {
    // Your rollback logic here
  }
}
`;
  }

  createMigrationTemplate(js: boolean = false, table: string): string {
    if (js) {
      return `import { Migration } from 'hysteria-orm';

export default class extends Migration {
  async up() {
    this.schema.createTable(
      '${table}',
      (table) => {
        // Your create table logic here
      },
    );
  }

  async down() {
    // Your rollback logic here
  }
}
`;
    }

    return `import { Migration } from 'hysteria-orm';

export default class extends Migration {
  async up(): Promise<void> {
    this.schema.createTable(
      '${table}',
      (table) => {
        // Your create table logic here
      },
    );
  }

  async down(): Promise<void> {
    // Your rollback logic here
  }
}
`;
  }

  alterMigrationTemplate(js: boolean = false, table: string): string {
    if (js) {
      return `import { Migration } from 'hysteria-orm';

export default class extends Migration {
  async up() {
    this.schema.alterTable(
      '${table}',
      (table) => {
        // Your alter table logic here
      },
    );
  }

  async down() {
    // Your rollback logic here
  }
}
`;
    }

    return `import { Migration } from 'hysteria-orm';

export default class extends Migration {
  async up(): Promise<void> {
    this.schema.alterTable(
      '${table}',
      (table) => {
        // Your alter table logic here
      },
    );
  }

  async down(): Promise<void> {
    // Your rollback logic here
  }
}
`;
  }

  selectAllFromMigrationsTemplate(): string {
    return `SELECT * FROM migrations`;
  }

  migrationTableTemplateMysql(): string {
    return `CREATE TABLE IF NOT EXISTS \`migrations\`(
    \`id\` INT NOT NULL AUTO_INCREMENT,
    \`name\` VARCHAR(255) NOT NULL,
    \`timestamp\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;
  }

  migrationTableTemplatePg(): string {
    return `CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;
  }

  migrationTableTemplateSQLite(): string {
    const now = new Date().toISOString();
    return `CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT '${now}'
);`;
  }

  migrationTableTemplateMssql(): string {
    return `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='migrations' AND xtype='U')
CREATE TABLE [migrations] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(255) NOT NULL,
    [timestamp] DATETIME NOT NULL DEFAULT GETDATE(),
    PRIMARY KEY ([id])
);`;
  }

  migrationTableTemplateOracle(): string {
    return `CREATE TABLE "migrations" (
    "id" NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "name" VARCHAR2(255) NOT NULL,
    "timestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
)`;
  }
}

export default new MigrationTemplates();
