import { SqlDataSource } from "../../../src/sql/sql_data_source.js";
import type { ModelAdapter, DbConfig, User, UserInput } from "../types.ts";
import { BenchPost, BenchUser } from "./models.js";

function toUser(r: Record<string, unknown>): User {
  return {
    id: r.id as number,
    name: r.name as string,
    email: r.email as string,
    createdAt:
      r.createdAt instanceof Date
        ? r.createdAt
        : new Date(r.createdAt as string),
  };
}

export class HysteriaModelAdapter implements ModelAdapter {
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

  async create(data: UserInput): Promise<User> {
    if (this.dialect === "pg") {
      const result = await this.sql
        .from(BenchUser)
        .insert(data, { returning: ["*"] });
      return toUser(result as unknown as Record<string, unknown>);
    }
    // MySQL: insert then select last inserted
    const user = await this.sql
      .from(BenchUser)
      .insert(data, { returning: ["*"] });
    return toUser(user as unknown as Record<string, unknown>);
  }

  async findAll(): Promise<User[]> {
    const rows = await this.sql.from(BenchUser).many();
    return rows.map((r) => toUser(r as unknown as Record<string, unknown>));
  }

  async findById(id: number): Promise<User | null> {
    const row = await this.sql.from(BenchUser).findOneByPrimaryKey(id);
    return row ? toUser(row as unknown as Record<string, unknown>) : null;
  }

  async update(id: number, data: Partial<UserInput>): Promise<void> {
    await this.sql.from(BenchUser).updateRecord(id, data);
  }

  async delete(id: number): Promise<void> {
    await this.sql.from(BenchUser).deleteRecord(id);
  }

  async findUserWithPost(userId: number): Promise<unknown> {
    return this.sql.from(BenchUser).where("id", userId).load("post").one();
  }

  async findUserWithPosts(userId: number): Promise<unknown> {
    return this.sql.from(BenchUser).where("id", userId).load("posts").one();
  }

  async findPostWithUser(postId: number): Promise<unknown> {
    return this.sql.from(BenchPost).where("id", postId).load("user").one();
  }

  async findUserWithAddresses(userId: number): Promise<unknown> {
    return this.sql.from(BenchUser).where("id", userId).load("addresses").one();
  }
}
