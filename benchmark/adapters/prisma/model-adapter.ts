import type { ModelAdapter, DbConfig, User, UserInput } from "../types.ts";

/** Prisma model adapter — requires running benchmark:setup:{dialect} first */
export class PrismaModelAdapter implements ModelAdapter {
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

  private toUser(r: Record<string, unknown>): User {
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

  async create(data: UserInput): Promise<User> {
    const result = await this.prisma.benchUser.create({
      data: { name: data.name, email: data.email },
    });
    return this.toUser(result);
  }

  async findAll(): Promise<User[]> {
    const rows = await this.prisma.benchUser.findMany();
    return rows.map((r: Record<string, unknown>) => this.toUser(r));
  }

  async findById(id: number): Promise<User | null> {
    const row = await this.prisma.benchUser.findUnique({ where: { id } });
    return row ? this.toUser(row) : null;
  }

  async update(id: number, data: Partial<UserInput>): Promise<void> {
    await this.prisma.benchUser.update({ where: { id }, data });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.benchUser.delete({ where: { id } });
  }

  async findUserWithPost(userId: number): Promise<unknown> {
    return this.prisma.benchUser.findUnique({
      where: { id: userId },
      include: { posts: { take: 1 } },
    });
  }

  async findUserWithPosts(userId: number): Promise<unknown> {
    return this.prisma.benchUser.findUnique({
      where: { id: userId },
      include: { posts: true },
    });
  }

  async findPostWithUser(postId: number): Promise<unknown> {
    return this.prisma.benchPost.findUnique({
      where: { id: postId },
      include: { user: true },
    });
  }

  async findUserWithAddresses(userId: number): Promise<unknown> {
    return this.prisma.benchUser.findUnique({
      where: { id: userId },
      include: { userAddresses: { include: { address: true } } },
    });
  }
}
