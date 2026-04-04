import { Sequelize, QueryTypes } from "sequelize";
import type { RawQueryAdapter, DbConfig, UserInput } from "../types.ts";

export class SequelizeRawAdapter implements RawQueryAdapter {
  readonly name = "sequelize";
  private sequelize!: Sequelize;
  private dialect: "mysql" | "pg" = "pg";

  async connect(config: DbConfig): Promise<void> {
    this.dialect = config.dialect;
    this.sequelize = new Sequelize({
      dialect: config.dialect === "pg" ? "postgres" : "mysql",
      host: config.host,
      port: config.port,
      username: config.user,
      password: config.password,
      database: config.database,
      logging: false,
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    });
    await this.sequelize.authenticate();
  }

  async disconnect(): Promise<void> {
    await this.sequelize.close();
  }

  async rawCreate(data: UserInput): Promise<Record<string, unknown>> {
    if (this.dialect === "pg") {
      const rows = await this.sequelize.query<Record<string, unknown>>(
        "INSERT INTO bench_users (name, email) VALUES (?, ?) RETURNING *",
        { replacements: [data.name, data.email], type: QueryTypes.SELECT },
      );
      return rows[0];
    }
    const [insertId] = await this.sequelize.query(
      "INSERT INTO bench_users (name, email) VALUES (?, ?)",
      { replacements: [data.name, data.email], type: QueryTypes.INSERT },
    );
    const rows = await this.sequelize.query<Record<string, unknown>>(
      "SELECT * FROM bench_users WHERE id = ?",
      { replacements: [insertId as number], type: QueryTypes.SELECT },
    );
    return rows[0];
  }

  async rawFindAll(): Promise<Record<string, unknown>[]> {
    return this.sequelize.query<Record<string, unknown>>(
      "SELECT * FROM bench_users",
      { type: QueryTypes.SELECT },
    );
  }

  async rawFindById(id: number): Promise<Record<string, unknown> | null> {
    const rows = await this.sequelize.query<Record<string, unknown>>(
      "SELECT * FROM bench_users WHERE id = ?",
      { replacements: [id], type: QueryTypes.SELECT },
    );
    return rows[0] ?? null;
  }

  async rawUpdate(id: number, data: Partial<UserInput>): Promise<void> {
    if (data.name !== undefined) {
      await this.sequelize.query(
        "UPDATE bench_users SET name = ? WHERE id = ?",
        { replacements: [data.name, id], type: QueryTypes.UPDATE },
      );
    }
  }

  async rawDelete(id: number): Promise<void> {
    await this.sequelize.query("DELETE FROM bench_users WHERE id = ?", {
      replacements: [id],
      type: QueryTypes.DELETE,
    });
  }
}
