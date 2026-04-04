import type { RawQueryAdapter, DbConfig, UserInput } from "../types.ts";

/** Prisma raw adapter — requires running benchmark:setup:{dialect} first */
export class PrismaRawAdapter implements RawQueryAdapter {
  readonly name = "prisma";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private prisma: any;
  private dialect: "mysql" | "pg" = "pg";

  async connect(config: DbConfig): Promise<void> {
    this.dialect = config.dialect;
    const generatedPath =
      config.dialect === "pg"
        ? "./generated/pg/index.js"
        : "./generated/mysql/index.js";

    const url =
      config.dialect === "pg"
        ? `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`
        : `mysql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`;

    if (config.dialect === "pg") {
      const { PrismaPg } = await import("@prisma/adapter-pg");
      const { PrismaClient } = await import(
        new URL(generatedPath, import.meta.url).href
      );
      const adapter = new PrismaPg(url);
      this.prisma = new PrismaClient({ adapter, log: [] });
    } else {
      process.env.DATABASE_URL = url;
      const { PrismaClient } = await import(
        new URL(generatedPath, import.meta.url).href
      );
      this.prisma = new PrismaClient({ log: [] });
    }
    await this.prisma.$connect();
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }

  async rawCreate(data: UserInput): Promise<Record<string, unknown>> {
    if (this.dialect === "pg") {
      const rows = await this.prisma.$queryRaw<Record<string, unknown>[]>`
        INSERT INTO bench_users (name, email) VALUES (${data.name}, ${data.email}) RETURNING *`;
      return rows[0];
    }
    await this.prisma.$executeRaw`
      INSERT INTO bench_users (name, email) VALUES (${data.name}, ${data.email})`;
    const rows = await this.prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT * FROM bench_users WHERE id = LAST_INSERT_ID()`;
    return rows[0];
  }

  async rawFindAll(): Promise<Record<string, unknown>[]> {
    return this.prisma.$queryRaw<
      Record<string, unknown>[]
    >`SELECT * FROM bench_users`;
  }

  async rawFindById(id: number): Promise<Record<string, unknown> | null> {
    const rows = await this.prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT * FROM bench_users WHERE id = ${id}`;
    return rows[0] ?? null;
  }

  async rawUpdate(id: number, data: Partial<UserInput>): Promise<void> {
    if (data.name !== undefined) {
      await this.prisma.$executeRaw`
        UPDATE bench_users SET name = ${data.name} WHERE id = ${id}`;
    }
  }

  async rawDelete(id: number): Promise<void> {
    await this.prisma.$executeRaw`DELETE FROM bench_users WHERE id = ${id}`;
  }
}
