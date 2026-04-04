import mysql from "mysql2/promise";
import type { RawQueryAdapter, DbConfig, UserInput } from "../types.ts";

export class Mysql2RawAdapter implements RawQueryAdapter {
  readonly name = "mysql2";
  private pool!: mysql.Pool;

  async connect(config: DbConfig): Promise<void> {
    this.pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
    });
    await this.pool.query("SELECT 1"); // verify connection
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
  }

  async rawCreate(data: UserInput): Promise<Record<string, unknown>> {
    const [result] = await this.pool.query<mysql.ResultSetHeader>(
      "INSERT INTO bench_users (name, email) VALUES (?, ?)",
      [data.name, data.email],
    );
    const id = result.insertId;
    const [rows] = await this.pool.query<mysql.RowDataPacket[]>(
      "SELECT * FROM bench_users WHERE id = ?",
      [id],
    );
    return rows[0] as Record<string, unknown>;
  }

  async rawFindAll(): Promise<Record<string, unknown>[]> {
    const [rows] = await this.pool.query<mysql.RowDataPacket[]>(
      "SELECT * FROM bench_users",
    );
    return rows as Record<string, unknown>[];
  }

  async rawFindById(id: number): Promise<Record<string, unknown> | null> {
    const [rows] = await this.pool.query<mysql.RowDataPacket[]>(
      "SELECT * FROM bench_users WHERE id = ?",
      [id],
    );
    return (rows[0] as Record<string, unknown>) ?? null;
  }

  async rawUpdate(id: number, data: Partial<UserInput>): Promise<void> {
    if (data.name !== undefined) {
      await this.pool.query("UPDATE bench_users SET name = ? WHERE id = ?", [
        data.name,
        id,
      ]);
    }
  }

  async rawDelete(id: number): Promise<void> {
    await this.pool.query("DELETE FROM bench_users WHERE id = ?", [id]);
  }
}
