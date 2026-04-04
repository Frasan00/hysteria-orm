import { Pool } from "pg";
import type { RawQueryAdapter, DbConfig, UserInput } from "../types.ts";

export class PgRawAdapter implements RawQueryAdapter {
  readonly name = "pg";
  private pool!: Pool;

  async connect(config: DbConfig): Promise<void> {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      max: 10,
    });
    await this.pool.query("SELECT 1"); // verify connection
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
  }

  async rawCreate(data: UserInput): Promise<Record<string, unknown>> {
    const result = await this.pool.query(
      "INSERT INTO bench_users (name, email) VALUES ($1, $2) RETURNING *",
      [data.name, data.email],
    );
    return result.rows[0] as Record<string, unknown>;
  }

  async rawFindAll(): Promise<Record<string, unknown>[]> {
    const result = await this.pool.query("SELECT * FROM bench_users");
    return result.rows as Record<string, unknown>[];
  }

  async rawFindById(id: number): Promise<Record<string, unknown> | null> {
    const result = await this.pool.query(
      "SELECT * FROM bench_users WHERE id = $1",
      [id],
    );
    return (result.rows[0] as Record<string, unknown>) ?? null;
  }

  async rawUpdate(id: number, data: Partial<UserInput>): Promise<void> {
    if (data.name !== undefined) {
      await this.pool.query("UPDATE bench_users SET name = $1 WHERE id = $2", [
        data.name,
        id,
      ]);
    }
  }

  async rawDelete(id: number): Promise<void> {
    await this.pool.query("DELETE FROM bench_users WHERE id = $1", [id]);
  }
}
