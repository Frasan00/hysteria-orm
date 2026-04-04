import "reflect-metadata";
import { DataSource } from "typeorm";
import type { RawQueryAdapter, DbConfig, UserInput } from "../types.ts";
import {
  BenchUserSchema,
  BenchPostSchema,
  BenchAddressSchema,
  BenchUserAddressSchema,
} from "./entities.ts";

export class TypeOrmRawAdapter implements RawQueryAdapter {
  readonly name = "typeorm";
  private dataSource!: DataSource;
  private dialect: "mysql" | "pg" = "pg";

  async connect(config: DbConfig): Promise<void> {
    this.dialect = config.dialect;
    this.dataSource = new DataSource({
      type: config.dialect === "pg" ? "postgres" : "mysql",
      host: config.host,
      port: config.port,
      username: config.user,
      password: config.password,
      database: config.database,
      synchronize: false,
      logging: false,
      entities: [
        BenchUserSchema,
        BenchPostSchema,
        BenchAddressSchema,
        BenchUserAddressSchema,
      ],
    });
    await this.dataSource.initialize();
  }

  async disconnect(): Promise<void> {
    await this.dataSource.destroy();
  }

  async rawCreate(data: UserInput): Promise<Record<string, unknown>> {
    if (this.dialect === "pg") {
      const result = await this.dataSource
        .createQueryBuilder()
        .insert()
        .into("bench_users")
        .values({ name: data.name, email: data.email })
        .returning("*")
        .execute();
      return result.raw[0] as Record<string, unknown>;
    }
    const result = await this.dataSource
      .createQueryBuilder()
      .insert()
      .into("bench_users")
      .values({ name: data.name, email: data.email })
      .execute();
    const id = (result.raw as { insertId: number }).insertId;
    return this.dataSource
      .createQueryBuilder()
      .select("u.*")
      .from("bench_users", "u")
      .where("u.id = :id", { id })
      .getRawOne() as Promise<Record<string, unknown>>;
  }

  async rawFindAll(): Promise<Record<string, unknown>[]> {
    return this.dataSource
      .createQueryBuilder()
      .select("u.*")
      .from("bench_users", "u")
      .getRawMany() as Promise<Record<string, unknown>[]>;
  }

  async rawFindById(id: number): Promise<Record<string, unknown> | null> {
    return this.dataSource
      .createQueryBuilder()
      .select("u.*")
      .from("bench_users", "u")
      .where("u.id = :id", { id })
      .getRawOne() as Promise<Record<string, unknown> | null>;
  }

  async rawUpdate(id: number, data: Partial<UserInput>): Promise<void> {
    if (data.name !== undefined) {
      await this.dataSource
        .createQueryBuilder()
        .update("bench_users")
        .set({ name: data.name })
        .where("id = :id", { id })
        .execute();
    }
  }

  async rawDelete(id: number): Promise<void> {
    await this.dataSource
      .createQueryBuilder()
      .delete()
      .from("bench_users")
      .where("id = :id", { id })
      .execute();
  }
}
