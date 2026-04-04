import { Sequelize } from "sequelize";
import type { ModelAdapter, DbConfig, User, UserInput } from "../types.ts";
import {
  BenchAddress,
  BenchPost,
  BenchUser,
  initSequelizeModels,
} from "./models.js";

function toUser(r: BenchUser): User {
  return {
    id: r.id!,
    name: r.name,
    email: r.email,
    createdAt: r.createdAt ?? new Date(),
  };
}

export class SequelizeModelAdapter implements ModelAdapter {
  readonly name = "sequelize";
  private sequelize!: Sequelize;
  private models!: ReturnType<typeof initSequelizeModels>;

  async connect(config: DbConfig): Promise<void> {
    this.sequelize = new Sequelize({
      dialect: config.dialect === "pg" ? "postgres" : "mysql",
      host: config.host,
      port: config.port,
      username: config.user,
      password: config.password,
      database: config.database,
      logging: false,
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    });
    this.models = initSequelizeModels(this.sequelize);
    await this.sequelize.authenticate();
  }

  async disconnect(): Promise<void> {
    await this.sequelize.close();
  }

  async create(data: UserInput): Promise<User> {
    const user = await this.models.BenchUser.create({
      name: data.name,
      email: data.email,
    });
    return toUser(user);
  }

  async findAll(): Promise<User[]> {
    const users = await this.models.BenchUser.findAll();
    return users.map(toUser);
  }

  async findById(id: number): Promise<User | null> {
    const user = await this.models.BenchUser.findByPk(id);
    return user ? toUser(user) : null;
  }

  async update(id: number, data: Partial<UserInput>): Promise<void> {
    await this.models.BenchUser.update(data, { where: { id } });
  }

  async delete(id: number): Promise<void> {
    await this.models.BenchUser.destroy({ where: { id } });
  }

  async findUserWithPost(userId: number): Promise<unknown> {
    return this.models.BenchUser.findByPk(userId, {
      include: [{ model: BenchPost, as: "post" }],
    });
  }

  async findUserWithPosts(userId: number): Promise<unknown> {
    return this.models.BenchUser.findByPk(userId, {
      include: [{ model: BenchPost, as: "posts" }],
    });
  }

  async findPostWithUser(postId: number): Promise<unknown> {
    return this.models.BenchPost.findByPk(postId, {
      include: [{ model: BenchUser, as: "user" }],
    });
  }

  async findUserWithAddresses(userId: number): Promise<unknown> {
    return this.models.BenchUser.findByPk(userId, {
      include: [{ model: BenchAddress, as: "addresses" }],
    });
  }
}
