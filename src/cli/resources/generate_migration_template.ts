export class GenerateMigrationTemplate {
  static async generate(sqlStatements: string[]) {
    const template = `import { Migration } from "hysteria-orm";

export default class extends Migration {
  async up() {
${sqlStatements
  .map((statement) => {
    const escapedStatement = statement
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t");
    return `    this.schema.rawQuery('${escapedStatement}');`;
  })
  .join("\n")}
  }

  async down() {}
}`;
    return template;
  }
}
