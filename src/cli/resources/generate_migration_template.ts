export class GenerateMigrationTemplate {
  static async generate(
    input: string[] | { up: string[]; down: string[] },
    mode?: "raw" | "code",
  ) {
    if (mode === "code" || (!Array.isArray(input) && "up" in input)) {
      const { up, down } = input as { up: string[]; down: string[] };
      const template = `import { Migration } from "hysteria-orm";

export default class extends Migration {
  async up() {
${up.map((line) => `    ${line}`).join("\n")}
  }

  async down() {
${down.map((line) => `    ${line}`).join("\n")}
  }
}`;
      return template;
    }

    const sqlStatements = input as string[];
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
