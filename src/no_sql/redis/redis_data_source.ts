import Redis, { RedisOptions } from "ioredis";

/**
 * @description The Redis_data_source class is a wrapper around the ioredis library that provides a simple interface to interact with a redis database
 */
export type RedisStorable =
  | string
  | number
  | boolean
  | Buffer
  | Array<any>
  | Record<string, any>;

/**
 * @description The RedisGiveable type is a type that can be stored in the redis database
 */
export type RedisGiveable =
  | string
  | number
  | boolean
  | Record<string, any>
  | Array<any>
  | null;

export class RedisDataSource {
  public static isConnected: boolean;
  protected static redisConnection: Redis;
  public isConnected: boolean;
  protected redisConnection: Redis;

  public constructor(input?: RedisOptions) {
    this.isConnected = false;
    const port = input?.port || +(process.env.REDIS_PORT as string) || 6379;

    this.redisConnection = new Redis({
      host: input?.host || process.env.REDIS_HOST,
      username: input?.username || process.env.REDIS_USERNAME,
      port: port,
      password: input?.password || process.env.REDIS_PASSWORD,
      ...input,
    });
  }

  /**
   * @description Connects to the redis database establishing a connection. If no connection details are provided, the default values from the env will be taken instead
   * @description The User input connection details will always come first
   * @description This is intended as a singleton connection to the redis database, if you need multiple connections, use the getConnection method
   * @param {RedisDataSourceInput} input - Details for the redis connection
   */
  static async connect(input?: RedisOptions): Promise<void> {
    if (RedisDataSource.isConnected) {
      return;
    }

    const port = input?.port || +(process.env.REDIS_PORT as string) || 6379;
    RedisDataSource.redisConnection = new Redis({
      host: input?.host || process.env.REDIS_HOST,
      username: input?.username || process.env.REDIS_USERNAME,
      port: port,
      password: input?.password || process.env.REDIS_PASSWORD,
      ...input,
    });

    try {
      await RedisDataSource.redisConnection.ping();
      RedisDataSource.isConnected = true;
    } catch (error) {
      throw new Error(`Failed to connect to Redis: ${error}`);
    }
  }

  /**
   * @description Establishes a connection to the redis database and returns the connection
   * @param input
   * @returns
   */
  static async getConnection(input?: RedisOptions): Promise<RedisDataSource> {
    const connection = new RedisDataSource(input);
    await connection.redisConnection.ping();
    connection.isConnected = true;
    return connection;
  }

  /**
   * @description Sets a key-value pair in the redis database
   * @param {string} key - The key
   * @param {string} value - The value
   * @param {number} expirationTime - The expiration time in milliseconds
   * @returns {Promise<void>}
   */
  static async set(
    key: string,
    value: RedisStorable,
    expirationTime?: number,
  ): Promise<void> {
    expirationTime = expirationTime ? expirationTime / 1000 : undefined;

    if (typeof value === "object" && !Buffer.isBuffer(value)) {
      value = JSON.stringify(value);
    }

    if (typeof value === "boolean") {
      value = value.toString();
    }

    try {
      if (expirationTime) {
        await RedisDataSource.redisConnection.setex(key, expirationTime, value);
        return;
      }

      await RedisDataSource.redisConnection.set(key, value);
    } catch (error) {
      throw new Error(`Failed to set key-value pair in Redis: ${error}`);
    }
  }

  /**
   * @description Gets the value of a key in the redis database
   * @param {string} key - The key
   * @returns {Promise<string>}
   */
  static async get<T = RedisGiveable>(key: string): Promise<T | null> {
    try {
      const value = await RedisDataSource.redisConnection.get(key);
      return RedisDataSource.getValue<T>(value);
    } catch (error) {
      throw new Error(`Failed to get value from Redis: ${error}`);
    }
  }

  /**
   * @description Gets the value of a key in the redis database as a buffer
   */
  static async getBuffer(key: string): Promise<Buffer | null> {
    try {
      return await RedisDataSource.redisConnection.getBuffer(key);
    } catch (error) {
      throw new Error(`Failed to get value from Redis: ${error}`);
    }
  }

  /**
   * @description Gets the value of a key in the redis database and deletes the key
   * @param {string} key - The key
   * @returns {Promise
   * <T | null>}
   */
  static async getAndDelete<T = RedisGiveable>(key: string): Promise<T | null> {
    try {
      const value = await RedisDataSource.redisConnection.get(key);
      await RedisDataSource.redisConnection.del(key);
      return RedisDataSource.getValue<T>(value);
    } catch (error) {
      throw new Error(`Failed to get value from Redis: ${error}`);
    }
  }

  /**
   * @description Deletes a key from the redis database
   * @param {string} key - The key
   * @returns {Promise<void>}
   */
  static async delete(key: string): Promise<void> {
    try {
      await RedisDataSource.redisConnection.del(key);
    } catch (error) {
      throw new Error(`Failed to delete key from Redis: ${error}`);
    }
  }

  /**
   * @description Flushes all the data in the redis database
   * @returns {Promise<void>}
   */
  static async flushAll(): Promise<void> {
    try {
      await RedisDataSource.redisConnection.flushall();
    } catch (error) {
      throw new Error(`Failed to flush Redis database: ${error}`);
    }
  }

  /**
   * @description Returns the raw redis connection that uses the ioredis library
   * @returns {Redis}
   */
  static getRawConnection(): Redis {
    if (!RedisDataSource.isConnected || !RedisDataSource.redisConnection) {
      throw new Error("redis connection not established");
    }

    return RedisDataSource.redisConnection;
  }

  /**
   * @description Disconnects from the redis database
   * @returns {Promise<void>}
   */
  static async disconnect(): Promise<void> {
    try {
      await RedisDataSource.redisConnection.quit();
      RedisDataSource.isConnected = false;
    } catch (error) {
      throw new Error(`Failed to disconnect from Redis: ${error}`);
    }
  }

  /**
   * @description Sets a key-value pair in the redis database
   * @param {string} key - The key
   * @param {string} value - The value
   * @param {number} expirationTime - The expiration time in milliseconds
   * @returns {Promise<void>}
   */
  async set(
    key: string,
    value: RedisStorable,
    expirationTime?: number,
  ): Promise<void> {
    expirationTime = expirationTime ? expirationTime / 1000 : undefined;

    if (typeof value === "object" && !Buffer.isBuffer(value)) {
      value = JSON.stringify(value);
    }

    if (typeof value === "boolean") {
      value = value.toString();
    }

    try {
      if (expirationTime) {
        await this.redisConnection.setex(key, expirationTime, value);
        return;
      }

      await this.redisConnection.set(key, value);
    } catch (error) {
      throw new Error(`Failed to set key-value pair in Redis: ${error}`);
    }
  }

  /**
   * @description Gets the value of a key in the redis database
   * @param {string} key - The key
   * @returns {Promise<string>}
   */
  async get<T = RedisGiveable>(key: string): Promise<T | null> {
    try {
      const value = await this.redisConnection.get(key);
      return RedisDataSource.getValue<T>(value);
    } catch (error) {
      throw new Error(`Failed to get value from Redis: ${error}`);
    }
  }

  /**
   * @description Gets the value of a key in the redis database as a buffer
   */
  async getBuffer(key: string): Promise<Buffer | null> {
    try {
      return await this.redisConnection.getBuffer(key);
    } catch (error) {
      throw new Error(`Failed to get value from Redis: ${error}`);
    }
  }

  /**
   * @description Gets the value of a key in the redis database and deletes the key
   * @param {string} key - The key
   * @returns {Promise
   * <T | null>}
   */
  async getAndDelete<T = RedisGiveable>(key: string): Promise<T | null> {
    try {
      const value = await this.redisConnection.get(key);
      await this.redisConnection.del(key);
      return RedisDataSource.getValue<T>(value);
    } catch (error) {
      throw new Error(`Failed to get value from Redis: ${error}`);
    }
  }

  /**
   * @description Deletes a key from the redis database
   * @param {string} key - The key
   * @returns {Promise<void>}
   */
  async delete(key: string): Promise<void> {
    try {
      await this.redisConnection.del(key);
    } catch (error) {
      throw new Error(`Failed to delete key from Redis: ${error}`);
    }
  }

  /**
   * @description Flushes all the data in the redis database
   * @returns {Promise<void>}
   */
  async flushAll(): Promise<void> {
    try {
      await this.redisConnection.flushall();
    } catch (error) {
      throw new Error(`Failed to flush Redis database: ${error}`);
    }
  }

  /**
   * @description Returns the raw redis connection that uses the ioredis library
   * @returns {Redis}
   */
  getRawConnection(): Redis {
    if (!this.isConnected || !this.redisConnection) {
      throw new Error("redis connection not established");
    }

    return this.redisConnection;
  }

  /**
   * @description Disconnects from the redis database
   * @returns {Promise<void>}
   */
  async disconnect(): Promise<void> {
    try {
      await this.redisConnection.quit();
      this.isConnected = false;
    } catch (error) {
      throw new Error(`Failed to disconnect from Redis: ${error}`);
    }
  }

  protected static getValue<T = RedisGiveable>(value: string | null): T | null {
    if (!value) {
      return null;
    }

    try {
      const jsonVal = JSON.parse(value);
      return jsonVal as T;
    } catch (_error) {}

    if (value === "true" || value === "false") {
      return Boolean(value) as T;
    }

    if (Number(value)) {
      return Number(value) as T;
    }

    if (Array.isArray(value)) {
      return value as T;
    }

    return value as T;
  }
}
