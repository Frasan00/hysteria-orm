import type { RedisOptions, Redis } from "ioredis";
import { HysteriaError } from "../../errors/hysteria_error";
import logger from "../../utils/logger";
import { env } from "../../env/env";
import { DriverNotFoundError } from "../../drivers/driver_constants";

/**
 * @description The RedisStorable type is a type that can be stored in redis
 */
export type RedisStorable =
  | string
  | number
  | boolean
  | Buffer
  | Array<any>
  | Record<string, any>;

/**
 * @description The RedisFetchable type is a type that can be fetched from redis
 */
export type RedisFetchable =
  | string
  | number
  | boolean
  | Record<string, any>
  | Array<any>
  | null;

/**
 * @description The RedisDataSource class is a wrapper around the ioredis library that provides a simple interface to interact with a redis database
 */
export class RedisDataSource {
  static isConnected: boolean;
  protected static redisDataSourceInstance: RedisDataSource;
  isConnected: boolean;
  protected ioRedisConnection: Redis;

  constructor(ioRedisConnection: Redis) {
    this.isConnected = false;
    this.ioRedisConnection = ioRedisConnection;
  }

  /**
   * @description Returns the raw ioredis connection
   * @returns {Redis}
   */
  static get ioredis() {
    return this.redisDataSourceInstance.ioRedisConnection;
  }

  /**
   * @description Returns the raw ioredis connection
   * @returns {Redis}
   */
  get ioredis() {
    return this.ioRedisConnection;
  }

  /**
   * @description Connects to the redis database establishing a connection. If no connection details are provided, the default values from the env will be taken instead
   * @description The User input connection details will always come first
   * @description This is intended as a singleton connection to the redis database, if you need multiple connections, use the getConnection method
   */
  static async connect(input?: RedisOptions): Promise<void> {
    if (this.isConnected) {
      return;
    }

    const port = input?.port || +(env.REDIS_PORT as string) || 6379;
    const redisImport = await import("ioredis").catch(() => {
      throw new DriverNotFoundError("ioredis");
    });

    this.redisDataSourceInstance = new RedisDataSource(
      new redisImport.default({
        host: input?.host || env.REDIS_HOST,
        username: input?.username || env.REDIS_USERNAME,
        port: port,
        password: input?.password || env.REDIS_PASSWORD,
        ...input,
      }),
    );

    try {
      await this.redisDataSourceInstance.ioRedisConnection.ping();
      this.redisDataSourceInstance.isConnected = true;
      this.isConnected = true;
    } catch (error) {
      throw new HysteriaError(
        "RedisDataSource::connect",
        "CONNECTION_NOT_ESTABLISHED",
      );
    }
  }

  /**
   * @description Establishes a connection to the redis database and returns the connection
   * @param input
   * @returns
   */
  static async getConnection(input?: RedisOptions): Promise<RedisDataSource> {
    const ioRedis = await import("ioredis").catch(() => {
      throw new DriverNotFoundError("ioredis");
    });

    const ioRedisConnection = new ioRedis.default({
      host: input?.host || env.REDIS_HOST,
      username: input?.username || env.REDIS_USERNAME,
      port: input?.port || +(env.REDIS_PORT as string) || 6379,
      password: input?.password || env.REDIS_PASSWORD,
      ...input,
    });

    const connection = new RedisDataSource(ioRedisConnection);
    await connection.ioRedisConnection.ping();
    connection.isConnected = true;
    return connection;
  }

  /**
   * @description Sets a key-value pair in the redis database
   * @param {string} key - The key
   * @param {string} value - The value
   * @param {number} expirationTime - The expiration time in milliseconds
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
        await this.redisDataSourceInstance.ioRedisConnection.setex(
          key,
          expirationTime,
          value,
        );
        return;
      }

      await this.redisDataSourceInstance.ioRedisConnection.set(key, value);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::set", "SET_FAILED");
    }
  }

  /**
   * @description Gets the value of a key in the redis database
   * @param {string} key - The key
   * @returns {Promise<string>}
   */
  static async get<T = RedisFetchable>(key: string): Promise<T | null> {
    try {
      const value =
        await this.redisDataSourceInstance.ioRedisConnection.get(key);
      return this.getValue<T>(value);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::get", "SET_FAILED");
    }
  }

  /**
   * @description Gets the value of a key in the redis database as a buffer
   */
  static async getBuffer(key: string): Promise<Buffer | null> {
    try {
      return await this.redisDataSourceInstance.ioRedisConnection.getBuffer(
        key,
      );
    } catch (error) {
      throw new HysteriaError("RedisDataSource::getBuffer", "GET_FAILED");
    }
  }

  /**
   * @description Gets the value of a key in the redis database and deletes the key
   * @param {string} key - The key
   * @returns {Promise
   * <T | null>}
   */
  static async consume<T = RedisFetchable>(key: string): Promise<T | null> {
    try {
      const value =
        await this.redisDataSourceInstance.ioRedisConnection.get(key);
      await this.redisDataSourceInstance.ioRedisConnection.del(key);
      return this.getValue<T>(value);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::consume", "GET_FAILED");
    }
  }

  /**
   * @description Deletes a key from the redis database
   * @param {string} key - The key
   * @returns {Promise<void>}
   */
  static async delete(key: string): Promise<void> {
    try {
      await this.redisDataSourceInstance.ioRedisConnection.del(key);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::delete", "DELETE_FAILED");
    }
  }

  /**
   * @description Flushes all the data in the redis database
   * @returns {Promise<void>}
   */
  static async flushAll(): Promise<void> {
    try {
      await this.redisDataSourceInstance.ioRedisConnection.flushall();
    } catch (error) {
      throw new HysteriaError("RedisDataSource::flushAll", "FLUSH_FAILED");
    }
  }

  /**
   * @description Disconnects from the redis database
   * @returns {Promise<void>}
   */
  static async disconnect(): Promise<void> {
    try {
      await this.redisDataSourceInstance.ioRedisConnection.quit();
      this.redisDataSourceInstance.isConnected = false;
    } catch (error) {
      throw new HysteriaError(
        "RedisDataSource::disconnect",
        "DISCONNECT_FAILED",
      );
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
        await this.ioRedisConnection.setex(key, expirationTime, value);
        return;
      }

      await this.ioRedisConnection.set(key, value);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::set", "SET_FAILED");
    }
  }

  /**
   * @description Gets the value of a key in the redis database
   * @param {string} key - The key
   * @returns {Promise<string>}
   */
  async get<T = RedisFetchable>(key: string): Promise<T | null> {
    try {
      const value = await this.ioRedisConnection.get(key);
      return RedisDataSource.getValue<T>(value);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::get", "GET_FAILED");
    }
  }

  /**
   * @description Gets the value of a key in the redis database as a buffer
   */
  async getBuffer(key: string): Promise<Buffer | null> {
    try {
      return await this.ioRedisConnection.getBuffer(key);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::getBuffer", "GET_FAILED");
    }
  }

  /**
   * @description Gets the value of a key in the redis database and deletes the key
   * @param {string} key - The key
   * @returns {Promise
   * <T | null>}
   */
  async consume<T = RedisFetchable>(key: string): Promise<T | null> {
    try {
      const value = await this.ioRedisConnection.get(key);
      await this.ioRedisConnection.del(key);
      return RedisDataSource.getValue<T>(value);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::consume", "GET_FAILED");
    }
  }

  /**
   * @description Deletes a key from the redis database
   * @param {string} key - The key
   * @returns {Promise<void>}
   */
  async delete(key: string): Promise<void> {
    try {
      await this.ioRedisConnection.del(key);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::delete", "DELETE_FAILED");
    }
  }

  /**
   * @description Flushes all the data in the redis database
   * @returns {Promise<void>}
   */
  async flushAll(): Promise<void> {
    try {
      await this.ioRedisConnection.flushall();
    } catch (error) {
      throw new HysteriaError("RedisDataSource::flushAll", "FLUSH_FAILED");
    }
  }

  /**
   * @description Disconnects from the redis database
   * @returns {Promise<void>}
   */
  async disconnect(forceError?: boolean): Promise<void> {
    try {
      await this.ioRedisConnection.quit();
      this.isConnected = false;
    } catch (error) {
      if (forceError) {
        throw new HysteriaError(
          "RedisDataSource::disconnect",
          "DISCONNECT_FAILED",
        );
      }

      logger.warn("RedisDataSource::disconnect DISCONNECT_FAILED");
    }
  }

  protected static getValue<T = RedisFetchable>(
    value: string | null,
  ): T | null {
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

    if (!Number.isNaN(Number(value))) {
      return Number(value) as T;
    }

    if (Array.isArray(value)) {
      return value as T;
    }

    return value as T;
  }
}
