import { eq } from "drizzle-orm";
import type { ModelAdapter, DbConfig, User, UserInput } from "../types.ts";
import * as mysqlSchema from "./schema-mysql.js";
import * as pgSchema from "./schema-pg.js";

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

export class DrizzleModelAdapter implements ModelAdapter {
  readonly name = "drizzle";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      this.db = drizzle(pool, {
        schema: mysqlSchema,
        mode: "default",
      });
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

  async create(data: UserInput): Promise<User> {
    const db = this.db as ReturnType<
      typeof import("drizzle-orm/node-postgres").drizzle
    >;
    if (this.dialect === "pg") {
      const rows = await db
        .insert(pgSchema.benchUsers)
        .values({ name: data.name, email: data.email })
        .returning();
      return toUser(rows[0] as unknown as Record<string, unknown>);
    }
    const mdb = this.db as ReturnType<
      typeof import("drizzle-orm/mysql2").drizzle
    >;
    const result = await mdb
      .insert(mysqlSchema.benchUsers)
      .values({ name: data.name, email: data.email });
    const id = (result as unknown as [{ insertId: number }])[0].insertId;
    const rows = await mdb
      .select()
      .from(mysqlSchema.benchUsers)
      .where(eq(mysqlSchema.benchUsers.id, id));
    return toUser(rows[0] as unknown as Record<string, unknown>);
  }

  async findAll(): Promise<User[]> {
    const schema = this.schema;
    const rows = await this.db.select().from(schema.benchUsers);
    return rows.map((r: Record<string, unknown>) => toUser(r));
  }

  async findById(id: number): Promise<User | null> {
    const schema = this.schema;
    const rows = await this.db
      .select()
      .from(schema.benchUsers)
      .where(eq(schema.benchUsers.id, id));
    return rows[0] ? toUser(rows[0] as Record<string, unknown>) : null;
  }

  async update(id: number, data: Partial<UserInput>): Promise<void> {
    const schema = this.schema;
    if (data.name !== undefined) {
      await this.db
        .update(schema.benchUsers)
        .set({ name: data.name })
        .where(eq(schema.benchUsers.id, id));
    }
  }

  async delete(id: number): Promise<void> {
    const schema = this.schema;
    await this.db.delete(schema.benchUsers).where(eq(schema.benchUsers.id, id));
  }

  async findUserWithPost(userId: number): Promise<unknown> {
    return this.db.query.benchUsers.findFirst({
      where: (t: { id: unknown }, { eq: e }: { eq: typeof eq }) =>
        e(t.id as ReturnType<typeof eq>, userId),
      with: { posts: { limit: 1 } },
    });
  }

  async findUserWithPosts(userId: number): Promise<unknown> {
    return this.db.query.benchUsers.findFirst({
      where: (t: { id: unknown }, { eq: e }: { eq: typeof eq }) =>
        e(t.id as ReturnType<typeof eq>, userId),
      with: { posts: true },
    });
  }

  async findPostWithUser(postId: number): Promise<unknown> {
    return this.db.query.benchPosts.findFirst({
      where: (t: { id: unknown }, { eq: e }: { eq: typeof eq }) =>
        e(t.id as ReturnType<typeof eq>, postId),
      with: { user: true },
    });
  }

  async findUserWithAddresses(userId: number): Promise<unknown> {
    return this.db.query.benchUsers.findFirst({
      where: (t: { id: unknown }, { eq: e }: { eq: typeof eq }) =>
        e(t.id as ReturnType<typeof eq>, userId),
      with: { userAddresses: { with: { address: true } } },
    });
  }
}
