export class InitTemplates {
  static initTemplate(type: string): string {
    const port = this.getDefaultPort(type);
    const database = type === "sqlite" ? "database.db" : "database";
    const importType =
      type === "mongodb"
        ? "mongo"
        : type === "redis"
          ? "redis"
          : "SqlDataSource";

    if (type === "mongodb" || type === "redis") {
      return this.handleNoSqlConnection(
        type,
        importType === "SqlDataSource" ? "sql" : importType,
      );
    }

    return `
import { ${importType} } from "hysteria-orm";

const db = new ${importType}({
  type: "${type}",
  database: "${database}",${
    type === "sqlite"
      ? `
  logs: true,
  migrations: {
    path: "database/migrations",
  },`
      : `
  port: ${port},
  host: "localhost",
  username: "root",
  password: "root",
  logs: true,
  migrations: {
    path: "database/migrations",
  },`
  }
});

await db.connect().catch((err) => {
  console.error(err);
  process.exit(1);
});

export default db;
`;
  }

  private static handleNoSqlConnection(
    type: string,
    importType: string,
  ): string {
    const config = this.getNoSqlConnectionConfig(type);
    if (config) {
      return `
import { ${importType} } from "hysteria-orm";

const db = await ${importType}.connect(${config}).catch((err) => {
  console.error(err);
  process.exit(1);
});

export default db;`;
    }

    return "";
  }

  private static getNoSqlConnectionConfig(type: string): string {
    switch (type) {
      case "mongodb":
        return "mongodb://localhost:27017/database?authSource=admin";
      case "redis":
        return `{
  host: "localhost",
  port: 6379,
  password: "root",
  username: "default",
  db: 0,
}`;
      default:
        return "";
    }
  }

  private static getDefaultPort(type: string): number {
    switch (type) {
      case "mysql":
        return 3306;
      case "postgres":
        return 5432;
      case "mariadb":
        return 3306;
      case "cockroachdb":
        return 26257;
      case "mssql":
        return 1433;
      case "mongodb":
        return 27017;
      case "redis":
        return 6379;
      case "oracledb":
        return 1521;
      default:
        return 3306;
    }
  }
}
