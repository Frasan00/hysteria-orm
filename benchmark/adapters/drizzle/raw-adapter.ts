import { eq } from "drizzle-orm";
import type { RawQueryAdapter, DbConfig, UserInput } from "../types.ts";
import * as mysqlSchema from "./schema-mysql.js";
import * as pgSchema from "./schema-pg.js";

export class DrizzleRawAdapter implements RawQueryAdapter {
  readonly name = "drizzle";
  private db!: any;
  private dialect: "mysql" | "pg" = "pg";
  private rawPool: unknown;

  async connect(config: DbConfig): Promise<void> {
    this.dialect = config.dialect;

    if (config.dialect === "mysql") {
      const mysql = await import("mysql2/promise");
      const { drizzle } = await import("drizzle-orm/mysql2");
      const pool = mysql.default.createPool({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        waitForConnections: true,
        connectionLimit: 10,
      });
      this.rawPool = pool;
      this.db = drizzle(pool, { schema: mysqlSchema, mode: "default" });
    } else {
      const { Pool } = await import("pg");
      const { drizzle } = await import("drizzle-orm/node-postgres");
      const pool = new Pool({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        max: 10,
      });
      this.rawPool = pool;
      this.db = drizzle(pool, { schema: pgSchema });
    }
  }

  async disconnect(): Promise<void> {
    if (this.dialect === "mysql") {
      await (this.rawPool as import("mysql2/promise").Pool).end();
    } else {
      await (this.rawPool as import("pg").Pool).end();
    }
  }

  private get schema() {
    return this.dialect === "mysql" ? mysqlSchema : pgSchema;
  }

  async rawCreate(data: UserInput): Promise<Record<string, unknown>> {
    if (this.dialect === "pg") {
      const rows = await this.db
        .insert(pgSchema.benchUsers)
        .values({ name: data.name, email: data.email })
        .returning();
      return rows[0] as Record<string, unknown>;
    }
    const [{ id }] = await this.db
      .insert(mysqlSchema.benchUsers)
      .values({ name: data.name, email: data.email })
      .$returningId();
    const rows = await this.db
      .select()
      .from(mysqlSchema.benchUsers)
      .where(eq(mysqlSchema.benchUsers.id, id));
    return rows[0] as Record<string, unknown>;
  }

  async rawFindAll(): Promise<Record<string, unknown>[]> {
    const schema = this.schema;
    return this.db.select().from(schema.benchUsers) as Promise<
      Record<string, unknown>[]
    >;
  }

  async rawFindById(id: number): Promise<Record<string, unknown> | null> {
    const schema = this.schema;
    const rows = await this.db
      .select()
      .from(schema.benchUsers)
      .where(eq(schema.benchUsers.id, id));
    return (rows[0] as Record<string, unknown>) ?? null;
  }

  async rawUpdate(id: number, data: Partial<UserInput>): Promise<void> {
    const schema = this.schema;
    if (data.name !== undefined) {
      await this.db
        .update(schema.benchUsers)
        .set({ name: data.name })
        .where(eq(schema.benchUsers.id, id));
    }
  }

  async rawDelete(id: number): Promise<void> {
    const schema = this.schema;
    await this.db.delete(schema.benchUsers).where(eq(schema.benchUsers.id, id));
  }
}
