import "reflect-metadata";
import { DataSource, Repository } from "typeorm";
import type { ModelAdapter, DbConfig, User, UserInput } from "../types.ts";
import {
  BenchUserSchema,
  BenchPostSchema,
  BenchAddressSchema,
  BenchUserAddressSchema,
  IBenchUser,
  IBenchPost,
} from "./entities.ts";

function toUser(r: IBenchUser): User {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    createdAt: r.createdAt,
  };
}

export class TypeOrmModelAdapter implements ModelAdapter {
  readonly name = "typeorm";
  private dataSource!: DataSource;
  private userRepo!: Repository<IBenchUser>;
  private postRepo!: Repository<IBenchPost>;

  async connect(config: DbConfig): Promise<void> {
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
    this.userRepo = this.dataSource.getRepository<IBenchUser>("BenchUser");
    this.postRepo = this.dataSource.getRepository<IBenchPost>("BenchPost");
  }

  async disconnect(): Promise<void> {
    await this.dataSource.destroy();
  }

  async create(data: UserInput): Promise<User> {
    const user = await this.userRepo.save({
      name: data.name,
      email: data.email,
    });
    return toUser(user);
  }

  async findAll(): Promise<User[]> {
    const users = await this.userRepo.find();
    return users.map(toUser);
  }

  async findById(id: number): Promise<User | null> {
    const user = await this.userRepo.findOneBy({ id });
    return user ? toUser(user) : null;
  }

  async update(id: number, data: Partial<UserInput>): Promise<void> {
    await this.userRepo.update({ id }, data);
  }

  async delete(id: number): Promise<void> {
    await this.userRepo.delete({ id });
  }

  async findUserWithPost(userId: number): Promise<unknown> {
    return this.userRepo.findOne({
      where: { id: userId },
      relations: ["posts"],
    });
  }

  async findUserWithPosts(userId: number): Promise<unknown> {
    return this.userRepo.findOne({
      where: { id: userId },
      relations: ["posts"],
    });
  }

  async findPostWithUser(postId: number): Promise<unknown> {
    return this.postRepo.findOne({
      where: { id: postId },
      relations: ["user"],
    });
  }

  async findUserWithAddresses(userId: number): Promise<unknown> {
    return this.userRepo.findOne({
      where: { id: userId },
      relations: ["userAddresses", "userAddresses.address"],
    });
  }
}
