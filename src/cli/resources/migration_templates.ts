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
        const extractedNames = Object.values(result).map(
          (row: any) => row[`Tables_in_${database}`],
        );
        return extractedNames;
      case "cockroachdb":
      case "postgres":
        return result.map((row: any) => row.table_name);
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
      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }
  }

  dropAllTablesTemplate(dbType: SqlDataSourceType, tables: string[]): string {
    switch (dbType) {
      case "mysql":
      case "mariadb":
      case "cockroachdb":
      case "postgres":
        return `DROP TABLE IF EXISTS ${tables.join(", ")} CASCADE;`;
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
    return `SELECT * FROM migrations;`;
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
}

export default new MigrationTemplates();
