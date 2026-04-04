import { SqlDataSource } from "../../../src/index.ts";
import type { RawQueryAdapter, DbConfig, UserInput } from "../types.ts";

export class HysteriaRawAdapter implements RawQueryAdapter {
  readonly name = "hysteria";
  private sql!: SqlDataSource;
  private dialect: "mysql" | "pg" = "pg";

  async connect(config: DbConfig): Promise<void> {
    this.dialect = config.dialect;
    this.sql = new SqlDataSource({
      type: config.dialect === "pg" ? "postgres" : "mysql",
      host: config.host,
      port: config.port,
      username: config.user,
      password: config.password,
      database: config.database,
      logs: false,
    });
    await this.sql.connect();
  }

  async disconnect(): Promise<void> {
    await this.sql.disconnect();
  }

  async rawCreate(data: UserInput): Promise<Record<string, unknown>> {
    if (this.dialect === "pg") {
      return this.sql
        .from("bench_users")
        .insert({ name: data.name, email: data.email }, ["*"]) as Promise<
        Record<string, unknown>
      >;
    }
    return this.sql
      .from("bench_users")
      .insert({ name: data.name, email: data.email }, ["*"]);
  }

  async rawFindAll(): Promise<Record<string, unknown>[]> {
    return this.sql.from("bench_users").many() as Promise<
      Record<string, unknown>[]
    >;
  }

  async rawFindById(id: number): Promise<Record<string, unknown> | null> {
    return this.sql.from("bench_users").where("id", id).one() as Promise<Record<
      string,
      unknown
    > | null>;
  }

  async rawUpdate(id: number, data: Partial<UserInput>): Promise<void> {
    if (data.name !== undefined) {
      await this.sql
        .from("bench_users")
        .where("id", id)
        .update({ name: data.name });
    }
  }

  async rawDelete(id: number): Promise<void> {
    await this.sql.from("bench_users").where("id", id).delete();
  }
}
