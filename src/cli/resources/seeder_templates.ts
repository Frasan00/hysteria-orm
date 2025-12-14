export class SeederTemplates {
  static seederTemplate(): string {
    return `import { BaseSeeder } from "hysteria-orm";

export default class extends BaseSeeder {
  /**
   * Run the seeder
   */
  async run(): Promise<void> {
    console.log('Seeder completed');
  }
}
`;
  }
}
