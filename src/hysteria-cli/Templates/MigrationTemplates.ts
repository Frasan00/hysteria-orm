class MigrationTemplates {
  public basicMigrationTemplate(): string {
    return `import { Migration } from 'hysteria-orm';

export default class extends Migration {
  public up(): void {
    // Your migration logic here
  }

  public down(): void {
    // Your rollback logic here
  }
}
`;
  }
}

export default new MigrationTemplates();
