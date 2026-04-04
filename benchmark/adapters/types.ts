export type Dialect = "mysql" | "pg";

export interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  dialect: Dialect;
}

export interface UserInput {
  name: string;
  email: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

export interface SeedData {
  userId: number;
  postId: number;
  addressId: number;
}

export interface BenchmarkStats {
  min: number;
  max: number;
  mean: number;
  median: number;
  p95: number;
  p99: number;
  total: number;
  iterations: number;
}

export interface BenchmarkResult {
  adapter: string;
  suite: "model" | "raw";
  operation: string;
  dialect: Dialect;
  stats: BenchmarkStats;
}

/** Implemented by ORM adapters (model-based CRUD + relation loading) */
export interface ModelAdapter {
  readonly name: string;
  connect(config: DbConfig): Promise<void>;
  disconnect(): Promise<void>;

  // CRUD
  create(data: UserInput): Promise<User>;
  findAll(): Promise<User[]>;
  findById(id: number): Promise<User | null>;
  update(id: number, data: Partial<UserInput>): Promise<void>;
  delete(id: number): Promise<void>;

  // Relation loading
  findUserWithPost(userId: number): Promise<unknown>; // 1:1  user → first post
  findUserWithPosts(userId: number): Promise<unknown>; // 1:N  user → posts[]
  findPostWithUser(postId: number): Promise<unknown>; // N:1  post → user
  findUserWithAddresses(userId: number): Promise<unknown>; // N:N  user → addresses[]
}

/** Implemented by all adapters including raw drivers (no model, raw SQL only) */
export interface RawQueryAdapter {
  readonly name: string;
  connect(config: DbConfig): Promise<void>;
  disconnect(): Promise<void>;

  rawCreate(data: UserInput): Promise<Record<string, unknown>>;
  rawFindAll(): Promise<Record<string, unknown>[]>;
  rawFindById(id: number): Promise<Record<string, unknown> | null>;
  rawUpdate(id: number, data: Partial<UserInput>): Promise<void>;
  rawDelete(id: number): Promise<void>;
}
