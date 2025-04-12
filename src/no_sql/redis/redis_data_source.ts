import Redis, { RedisOptions } from "ioredis";
import { HysteriaError } from "../../errors/hysteria_error";
import logger from "../../utils/logger";
import { env } from "../../env/env";

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
  protected static redisConnection: Redis;
  isConnected: boolean;
  protected redisConnection: Redis;

  constructor(input?: RedisOptions) {
    this.isConnected = false;
    const port = input?.port || +(env.REDIS_PORT as string) || 6379;

    this.redisConnection = new Redis({
      host: input?.host || env.REDIS_HOST,
      username: input?.username || env.REDIS_USERNAME,
      port: port,
      db: input?.db || +(env.REDIS_DATABASE as string) || 0,
      password: input?.password || env.REDIS_PASSWORD,
      ...input,
    });
  }

  /**
   * @description Connects to the redis database establishing a connection. If no connection details are provided, the default values from the env will be taken instead
   * @description The User input connection details will always come first
   * @description This is intended as a singleton connection to the redis database, if you need multiple connections, use the getConnection method
   */
  static async connect(input?: RedisOptions): Promise<void> {
    if (RedisDataSource.isConnected) {
      return;
    }

    const port = input?.port || +(env.REDIS_PORT as string) || 6379;
    RedisDataSource.redisConnection = new Redis({
      host: input?.host || env.REDIS_HOST,
      username: input?.username || env.REDIS_USERNAME,
      port: port,
      password: input?.password || env.REDIS_PASSWORD,
      ...input,
    });

    try {
      await RedisDataSource.redisConnection.ping();
      RedisDataSource.isConnected = true;
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
    const connection = new RedisDataSource(input);
    await connection.redisConnection.ping();
    connection.isConnected = true;
    return connection;
  }

  /**
   * @description Sets a key-value pair in the redis database
   * @param {string} key - The key
   * @param {string} value - The value
   * @param {number} expirationTime - The expiration time in milliseconds to maintain node standard
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
      const value = await RedisDataSource.redisConnection.get(key);
      return RedisDataSource.getValue<T>(value);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::get", "SET_FAILED");
    }
  }

  /**
   * @description Gets the value of a key in the redis database as a buffer
   */
  static async getBuffer(key: string): Promise<Buffer | null> {
    try {
      return await RedisDataSource.redisConnection.getBuffer(key);
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
  static async getAndDelete<T = RedisFetchable>(
    key: string,
  ): Promise<T | null> {
    try {
      const value = await RedisDataSource.redisConnection.get(key);
      await RedisDataSource.redisConnection.del(key);
      return RedisDataSource.getValue<T>(value);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::getAndDelete", "GET_FAILED");
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
      throw new HysteriaError("RedisDataSource::delete", "DELETE_FAILED");
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
      throw new HysteriaError("RedisDataSource::flushAll", "FLUSH_FAILED");
    }
  }

  /**
   * @description Returns the raw redis connection that uses the ioredis library
   * @returns {Redis}
   */
  static getRawConnection(): Redis {
    if (!RedisDataSource.isConnected || !RedisDataSource.redisConnection) {
      throw new HysteriaError(
        "RedisDataSource::getRawConnection",
        "CONNECTION_NOT_ESTABLISHED",
      );
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
        await this.redisConnection.setex(key, expirationTime, value);
        return;
      }

      await this.redisConnection.set(key, value);
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
      const value = await this.redisConnection.get(key);
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
      return await this.redisConnection.getBuffer(key);
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
  async getAndDelete<T = RedisFetchable>(key: string): Promise<T | null> {
    try {
      const value = await this.redisConnection.get(key);
      await this.redisConnection.del(key);
      return RedisDataSource.getValue<T>(value);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::getAndDelete", "GET_FAILED");
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
      throw new HysteriaError("RedisDataSource::delete", "DELETE_FAILED");
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
      throw new HysteriaError("RedisDataSource::flushAll", "FLUSH_FAILED");
    }
  }

  /**
   * @description Returns the raw redis connection that uses the ioredis library
   * @returns {Redis}
   */
  getRawConnection(): Redis {
    if (!this.isConnected || !this.redisConnection) {
      throw new HysteriaError(
        "RedisDataSource::getRawConnection",
        "CONNECTION_NOT_ESTABLISHED",
      );
    }

    return this.redisConnection;
  }

  /**
   * @description Disconnects from the redis database
   * @returns {Promise<void>}
   */
  async disconnect(forceError?: boolean): Promise<void> {
    try {
      await this.redisConnection.quit();
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

    if (Number(value)) {
      return Number(value) as T;
    }

    if (Array.isArray(value)) {
      return value as T;
    }

    return value as T;
  }
}
