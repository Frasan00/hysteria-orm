class MigrationTemplates {
  public basicMigrationTemplate(): string {
    return `import { Migration } from 'hysteria-orm';

export default class extends Migration {
  public async up(): Promise<void> {
    // Your migration logic here
  }

  public async down(): Promise<void> {
    // Your rollback logic here
  }

  public async afterUp(): Promise<void> {
    // Your logic after the up migration here
  }

  public async afterDown(): Promise<void> {
    // Your logic after the down migration here
  }
}
`;
  }

  public selectAllFromMigrationsTemplate(): string {
    return `
SELECT * FROM migrations;
`;
  }

  public migrationTableTemplate(): string {
    return `
CREATE TABLE IF NOT EXISTS \`migrations\`(
    \`id\` INT NOT NULL AUTO_INCREMENT,
    \`name\` VARCHAR(255) NOT NULL,
    \`timestamp\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;
  }

  public migrationTableTemplatePg(): string {
    return `
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;
  }

  public addMigrationTemplate(): string {
    return `
INSERT INTO migrations (name) VALUES (?);
`;
  }

  public removeMigrationTemplate(): string {
    return `
DELETE FROM migrations WHERE name = ?;
`;
  }
}

export default new MigrationTemplates();
