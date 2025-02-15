class Migration_templates {
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

export default new Migration_templates();
