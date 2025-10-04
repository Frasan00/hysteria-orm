import type { Redis, RedisOptions } from "ioredis";
import { DriverNotFoundError } from "../../drivers/driver_constants";
import { env } from "../../env/env";
import { HysteriaError } from "../../errors/hysteria_error";
import logger from "../../utils/logger";

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
 * @description Type for Redis message handler callback
 */
export type RedisMessageHandler = (channel: string, message: string) => void;

/**
 * @description The RedisDataSource class is a wrapper around the ioredis library that provides a simple interface to interact with a redis database
 */
export class RedisDataSource {
  // Redis commands response types
  static readonly OK = "OK";
  readonly OK = "OK";

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

  /**
   * @description Adds one or more values to the beginning of a list
   * @param {string} key - The key of the list
   * @param {RedisStorable[]} values - The values to add
   * @returns {Promise<number>} - The length of the list after the push operation
   */
  static async lpush(key: string, ...values: RedisStorable[]): Promise<number> {
    try {
      const processedValues = values.map((value) => {
        if (typeof value === "object" && !Buffer.isBuffer(value)) {
          return JSON.stringify(value);
        }
        if (typeof value === "boolean") {
          return value.toString();
        }
        return value;
      });

      return await this.redisDataSourceInstance.ioRedisConnection.lpush(
        key,
        ...processedValues,
      );
    } catch (error) {
      throw new HysteriaError("RedisDataSource::lpush", "LPUSH_FAILED");
    }
  }

  /**
   * @description Adds one or more values to the end of a list
   * @param {string} key - The key of the list
   * @param {RedisStorable[]} values - The values to add
   * @returns {Promise<number>} - The length of the list after the push operation
   */
  static async rpush(key: string, ...values: RedisStorable[]): Promise<number> {
    try {
      const processedValues = values.map((value) => {
        if (typeof value === "object" && !Buffer.isBuffer(value)) {
          return JSON.stringify(value);
        }
        if (typeof value === "boolean") {
          return value.toString();
        }
        return value;
      });

      return await this.redisDataSourceInstance.ioRedisConnection.rpush(
        key,
        ...processedValues,
      );
    } catch (error) {
      throw new HysteriaError("RedisDataSource::rpush", "RPUSH_FAILED");
    }
  }

  /**
   * @description Removes and returns the first element of a list
   * @param {string} key - The key of the list
   * @returns {Promise<T | null>} - The popped value
   */
  static async lpop<T = RedisFetchable>(key: string): Promise<T | null> {
    try {
      const value =
        await this.redisDataSourceInstance.ioRedisConnection.lpop(key);
      return this.getValue<T>(value);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::lpop", "LPOP_FAILED");
    }
  }

  /**
   * @description Removes and returns the last element of a list
   * @param {string} key - The key of the list
   * @returns {Promise<T | null>} - The popped value
   */
  static async rpop<T = RedisFetchable>(key: string): Promise<T | null> {
    try {
      const value =
        await this.redisDataSourceInstance.ioRedisConnection.rpop(key);
      return this.getValue<T>(value);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::rpop", "RPOP_FAILED");
    }
  }

  /**
   * @description Gets a range of elements from a list
   * @param {string} key - The key of the list
   * @param {number} start - The starting index
   * @param {number} stop - The stopping index
   * @returns {Promise<T[]>} - Array of elements in the specified range
   */
  static async lrange<T = RedisFetchable>(
    key: string,
    start: number,
    stop: number,
  ): Promise<T[]> {
    try {
      const values =
        await this.redisDataSourceInstance.ioRedisConnection.lrange(
          key,
          start,
          stop,
        );
      return values
        .map((value) => this.getValue<T>(value))
        .filter((value) => value !== null) as T[];
    } catch (error) {
      throw new HysteriaError("RedisDataSource::lrange", "LRANGE_FAILED");
    }
  }

  /**
   * @description Gets the length of a list
   * @param {string} key - The key of the list
   * @returns {Promise<number>} - The length of the list
   */
  static async llen(key: string): Promise<number> {
    try {
      return await this.redisDataSourceInstance.ioRedisConnection.llen(key);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::llen", "LLEN_FAILED");
    }
  }

  /**
   * @description Adds one or more values to the beginning of a list
   * @param {string} key - The key of the list
   * @param {RedisStorable[]} values - The values to add
   * @returns {Promise<number>} - The length of the list after the push operation
   */
  async lpush(key: string, ...values: RedisStorable[]): Promise<number> {
    try {
      const processedValues = values.map((value) => {
        if (typeof value === "object" && !Buffer.isBuffer(value)) {
          return JSON.stringify(value);
        }
        if (typeof value === "boolean") {
          return value.toString();
        }
        return value;
      });

      return await this.ioRedisConnection.lpush(key, ...processedValues);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::lpush", "LPUSH_FAILED");
    }
  }

  /**
   * @description Adds one or more values to the end of a list
   * @param {string} key - The key of the list
   * @param {RedisStorable[]} values - The values to add
   * @returns {Promise<number>} - The length of the list after the push operation
   */
  async rpush(key: string, ...values: RedisStorable[]): Promise<number> {
    try {
      const processedValues = values.map((value) => {
        if (typeof value === "object" && !Buffer.isBuffer(value)) {
          return JSON.stringify(value);
        }
        if (typeof value === "boolean") {
          return value.toString();
        }
        return value;
      });

      return await this.ioRedisConnection.rpush(key, ...processedValues);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::rpush", "RPUSH_FAILED");
    }
  }

  /**
   * @description Removes and returns the first element of a list
   * @param {string} key - The key of the list
   * @returns {Promise<T | null>} - The popped value
   */
  async lpop<T = RedisFetchable>(key: string): Promise<T | null> {
    try {
      const value = await this.ioRedisConnection.lpop(key);
      return RedisDataSource.getValue<T>(value);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::lpop", "LPOP_FAILED");
    }
  }

  /**
   * @description Removes and returns the last element of a list
   * @param {string} key - The key of the list
   * @returns {Promise<T | null>} - The popped value
   */
  async rpop<T = RedisFetchable>(key: string): Promise<T | null> {
    try {
      const value = await this.ioRedisConnection.rpop(key);
      return RedisDataSource.getValue<T>(value);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::rpop", "RPOP_FAILED");
    }
  }

  /**
   * @description Gets a range of elements from a list
   * @param {string} key - The key of the list
   * @param {number} start - The starting index
   * @param {number} stop - The stopping index
   * @returns {Promise<T[]>} - Array of elements in the specified range
   */
  async lrange<T = RedisFetchable>(
    key: string,
    start: number,
    stop: number,
  ): Promise<T[]> {
    try {
      const values = await this.ioRedisConnection.lrange(key, start, stop);
      return values
        .map((value) => RedisDataSource.getValue<T>(value))
        .filter((value) => value !== null) as T[];
    } catch (error) {
      throw new HysteriaError("RedisDataSource::lrange", "LRANGE_FAILED");
    }
  }

  /**
   * @description Gets the length of a list
   * @param {string} key - The key of the list
   * @returns {Promise<number>} - The length of the list
   */
  async llen(key: string): Promise<number> {
    try {
      return await this.ioRedisConnection.llen(key);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::llen", "LLEN_FAILED");
    }
  }

  /**
   * @description Sets field in the hash stored at key to value
   * @param {string} key - The key of the hash
   * @param {string} field - The field to set
   * @param {RedisStorable} value - The value to set
   * @returns {Promise<number>} - 1 if field is a new field and value was set, 0 if field already exists and the value was updated
   */
  static async hset(
    key: string,
    field: string,
    value: RedisStorable,
  ): Promise<number> {
    try {
      if (typeof value === "object" && !Buffer.isBuffer(value)) {
        value = JSON.stringify(value);
      }

      if (typeof value === "boolean") {
        value = value.toString();
      }

      return await this.redisDataSourceInstance.ioRedisConnection.hset(
        key,
        field,
        value,
      );
    } catch (error) {
      throw new HysteriaError("RedisDataSource::hset", "HSET_FAILED");
    }
  }

  /**
   * @description Sets multiple fields in the hash stored at key to their respective values
   * @param {string} key - The key of the hash
   * @param {Record<string, RedisStorable>} hash - Object containing field-value pairs
   * @returns {Promise<string>} - "OK" if successful
   */
  static async hmset(
    key: string,
    hash: Record<string, RedisStorable>,
  ): Promise<string> {
    try {
      const processedHash: Record<string, string> = {};

      for (const [field, value] of Object.entries(hash)) {
        if (typeof value === "object" && !Buffer.isBuffer(value)) {
          processedHash[field] = JSON.stringify(value);
        } else if (typeof value === "boolean") {
          processedHash[field] = value.toString();
        } else {
          processedHash[field] = String(value);
        }
      }

      return await this.redisDataSourceInstance.ioRedisConnection.hmset(
        key,
        processedHash,
      );
    } catch (error) {
      throw new HysteriaError("RedisDataSource::hmset", "HMSET_FAILED");
    }
  }

  /**
   * @description Gets the value of a field in a hash
   * @param {string} key - The key of the hash
   * @param {string} field - The field to get
   * @returns {Promise<T | null>} - The value of the field
   */
  static async hget<T = RedisFetchable>(
    key: string,
    field: string,
  ): Promise<T | null> {
    try {
      const value = await this.redisDataSourceInstance.ioRedisConnection.hget(
        key,
        field,
      );
      return this.getValue<T>(value);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::hget", "HGET_FAILED");
    }
  }

  /**
   * @description Gets all the fields and values in a hash
   * @param {string} key - The key of the hash
   * @returns {Promise<Record<string, T>>} - Object containing field-value pairs
   */
  static async hgetall<T = RedisFetchable>(
    key: string,
  ): Promise<Record<string, T>> {
    try {
      const hash =
        await this.redisDataSourceInstance.ioRedisConnection.hgetall(key);
      const result: Record<string, T> = {};

      for (const [field, value] of Object.entries(hash)) {
        result[field] = this.getValue<T>(value) as T;
      }

      return result;
    } catch (error) {
      throw new HysteriaError("RedisDataSource::hgetall", "HGETALL_FAILED");
    }
  }

  /**
   * @description Gets values for multiple fields in a hash
   * @param {string} key - The key of the hash
   * @param {string[]} fields - The fields to get
   * @returns {Promise<Array<T | null>>} - Array of values
   */
  static async hmget<T = RedisFetchable>(
    key: string,
    ...fields: string[]
  ): Promise<Array<T | null>> {
    try {
      const values = await this.redisDataSourceInstance.ioRedisConnection.hmget(
        key,
        ...fields,
      );
      return values.map((value) => this.getValue<T>(value));
    } catch (error) {
      throw new HysteriaError("RedisDataSource::hmget", "HMGET_FAILED");
    }
  }

  /**
   * @description Deletes one or more fields from a hash
   * @param {string} key - The key of the hash
   * @param {string[]} fields - The fields to delete
   * @returns {Promise<number>} - The number of fields that were removed
   */
  static async hdel(key: string, ...fields: string[]): Promise<number> {
    try {
      return await this.redisDataSourceInstance.ioRedisConnection.hdel(
        key,
        ...fields,
      );
    } catch (error) {
      throw new HysteriaError("RedisDataSource::hdel", "HDEL_FAILED");
    }
  }

  /**
   * @description Checks if a field exists in a hash
   * @param {string} key - The key of the hash
   * @param {string} field - The field to check
   * @returns {Promise<number>} - 1 if the field exists, 0 if not
   */
  static async hexists(key: string, field: string): Promise<number> {
    try {
      return await this.redisDataSourceInstance.ioRedisConnection.hexists(
        key,
        field,
      );
    } catch (error) {
      throw new HysteriaError("RedisDataSource::hexists", "HEXISTS_FAILED");
    }
  }

  /**
   * @description Gets all the fields in a hash
   * @param {string} key - The key of the hash
   * @returns {Promise<string[]>} - Array of field names
   */
  static async hkeys(key: string): Promise<string[]> {
    try {
      return await this.redisDataSourceInstance.ioRedisConnection.hkeys(key);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::hkeys", "HKEYS_FAILED");
    }
  }

  /**
   * @description Gets the number of fields in a hash
   * @param {string} key - The key of the hash
   * @returns {Promise<number>} - The number of fields
   */
  static async hlen(key: string): Promise<number> {
    try {
      return await this.redisDataSourceInstance.ioRedisConnection.hlen(key);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::hlen", "HLEN_FAILED");
    }
  }

  /**
   * @description Sets field in the hash stored at key to value
   * @param {string} key - The key of the hash
   * @param {string} field - The field to set
   * @param {RedisStorable} value - The value to set
   * @returns {Promise<number>} - 1 if field is a new field and value was set, 0 if field already exists and the value was updated
   */
  async hset(
    key: string,
    field: string,
    value: RedisStorable,
  ): Promise<number> {
    try {
      if (typeof value === "object" && !Buffer.isBuffer(value)) {
        value = JSON.stringify(value);
      }

      if (typeof value === "boolean") {
        value = value.toString();
      }

      return await this.ioRedisConnection.hset(key, field, value);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::hset", "HSET_FAILED");
    }
  }

  /**
   * @description Sets multiple fields in the hash stored at key to their respective values
   * @param {string} key - The key of the hash
   * @param {Record<string, RedisStorable>} hash - Object containing field-value pairs
   * @returns {Promise<string>} - "OK" if successful
   */
  async hmset(
    key: string,
    hash: Record<string, RedisStorable>,
  ): Promise<string> {
    try {
      const processedHash: Record<string, string> = {};

      for (const [field, value] of Object.entries(hash)) {
        if (typeof value === "object" && !Buffer.isBuffer(value)) {
          processedHash[field] = JSON.stringify(value);
        } else if (typeof value === "boolean") {
          processedHash[field] = value.toString();
        } else {
          processedHash[field] = String(value);
        }
      }

      return await this.ioRedisConnection.hmset(key, processedHash);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::hmset", "HMSET_FAILED");
    }
  }

  /**
   * @description Gets the value of a field in a hash
   * @param {string} key - The key of the hash
   * @param {string} field - The field to get
   * @returns {Promise<T | null>} - The value of the field
   */
  async hget<T = RedisFetchable>(
    key: string,
    field: string,
  ): Promise<T | null> {
    try {
      const value = await this.ioRedisConnection.hget(key, field);
      return RedisDataSource.getValue<T>(value);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::hget", "HGET_FAILED");
    }
  }

  /**
   * @description Gets all the fields and values in a hash
   * @param {string} key - The key of the hash
   * @returns {Promise<Record<string, T>>} - Object containing field-value pairs
   */
  async hgetall<T = RedisFetchable>(key: string): Promise<Record<string, T>> {
    try {
      const hash = await this.ioRedisConnection.hgetall(key);
      const result: Record<string, T> = {};

      for (const [field, value] of Object.entries(hash)) {
        result[field] = RedisDataSource.getValue<T>(value) as T;
      }

      return result;
    } catch (error) {
      throw new HysteriaError("RedisDataSource::hgetall", "HGETALL_FAILED");
    }
  }

  /**
   * @description Gets values for multiple fields in a hash
   * @param {string} key - The key of the hash
   * @param {string[]} fields - The fields to get
   * @returns {Promise<Array<T | null>>} - Array of values
   */
  async hmget<T = RedisFetchable>(
    key: string,
    ...fields: string[]
  ): Promise<Array<T | null>> {
    try {
      const values = await this.ioRedisConnection.hmget(key, ...fields);
      return values.map((value) => RedisDataSource.getValue<T>(value));
    } catch (error) {
      throw new HysteriaError("RedisDataSource::hmget", "HMGET_FAILED");
    }
  }

  /**
   * @description Deletes one or more fields from a hash
   * @param {string} key - The key of the hash
   * @param {string[]} fields - The fields to delete
   * @returns {Promise<number>} - The number of fields that were removed
   */
  async hdel(key: string, ...fields: string[]): Promise<number> {
    try {
      return await this.ioRedisConnection.hdel(key, ...fields);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::hdel", "HDEL_FAILED");
    }
  }

  /**
   * @description Checks if a field exists in a hash
   * @param {string} key - The key of the hash
   * @param {string} field - The field to check
   * @returns {Promise<number>} - 1 if the field exists, 0 if not
   */
  async hexists(key: string, field: string): Promise<number> {
    try {
      return await this.ioRedisConnection.hexists(key, field);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::hexists", "HEXISTS_FAILED");
    }
  }

  /**
   * @description Gets all the fields in a hash
   * @param {string} key - The key of the hash
   * @returns {Promise<string[]>} - Array of field names
   */
  async hkeys(key: string): Promise<string[]> {
    try {
      return await this.ioRedisConnection.hkeys(key);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::hkeys", "HKEYS_FAILED");
    }
  }

  /**
   * @description Gets the number of fields in a hash
   * @param {string} key - The key of the hash
   * @returns {Promise<number>} - The number of fields
   */
  async hlen(key: string): Promise<number> {
    try {
      return await this.ioRedisConnection.hlen(key);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::hlen", "HLEN_FAILED");
    }
  }

  /**
   * @description Adds one or more members to a set
   * @param {string} key - The key of the set
   * @param {RedisStorable[]} members - The members to add
   * @returns {Promise<number>} - The number of elements added to the set
   */
  static async sadd(key: string, ...members: RedisStorable[]): Promise<number> {
    try {
      const processedMembers = members.map((member) => {
        if (typeof member === "object" && !Buffer.isBuffer(member)) {
          return JSON.stringify(member);
        }
        if (typeof member === "boolean") {
          return member.toString();
        }
        return member;
      });

      return await this.redisDataSourceInstance.ioRedisConnection.sadd(
        key,
        ...processedMembers,
      );
    } catch (error) {
      throw new HysteriaError("RedisDataSource::sadd", "SADD_FAILED");
    }
  }

  /**
   * @description Gets all members of a set
   * @param {string} key - The key of the set
   * @returns {Promise<T[]>} - Array of set members
   */
  static async smembers<T = RedisFetchable>(key: string): Promise<T[]> {
    try {
      const members =
        await this.redisDataSourceInstance.ioRedisConnection.smembers(key);
      return members
        .map((member) => this.getValue<T>(member))
        .filter((member) => member !== null) as T[];
    } catch (error) {
      throw new HysteriaError("RedisDataSource::smembers", "SMEMBERS_FAILED");
    }
  }

  /**
   * @description Removes one or more members from a set
   * @param {string} key - The key of the set
   * @param {RedisStorable[]} members - The members to remove
   * @returns {Promise<number>} - The number of members that were removed
   */
  static async srem(key: string, ...members: RedisStorable[]): Promise<number> {
    try {
      const processedMembers = members.map((member) => {
        if (typeof member === "object" && !Buffer.isBuffer(member)) {
          return JSON.stringify(member);
        }
        if (typeof member === "boolean") {
          return member.toString();
        }
        return member;
      });

      return await this.redisDataSourceInstance.ioRedisConnection.srem(
        key,
        ...processedMembers,
      );
    } catch (error) {
      throw new HysteriaError("RedisDataSource::srem", "SREM_FAILED");
    }
  }

  /**
   * @description Determines whether a member belongs to a set
   * @param {string} key - The key of the set
   * @param {RedisStorable} member - The member to check
   * @returns {Promise<number>} - 1 if the member exists in the set, 0 if not
   */
  static async sismember(key: string, member: RedisStorable): Promise<number> {
    try {
      if (typeof member === "object" && !Buffer.isBuffer(member)) {
        member = JSON.stringify(member);
      }
      if (typeof member === "boolean") {
        member = member.toString();
      }

      return await this.redisDataSourceInstance.ioRedisConnection.sismember(
        key,
        member,
      );
    } catch (error) {
      throw new HysteriaError("RedisDataSource::sismember", "SISMEMBER_FAILED");
    }
  }

  /**
   * @description Gets the number of members in a set
   * @param {string} key - The key of the set
   * @returns {Promise<number>} - The number of members in the set
   */
  static async scard(key: string): Promise<number> {
    try {
      return await this.redisDataSourceInstance.ioRedisConnection.scard(key);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::scard", "SCARD_FAILED");
    }
  }

  /**
   * @description Returns the intersection of multiple sets
   * @param {string[]} keys - The keys of the sets to intersect
   * @returns {Promise<T[]>} - Array of members in the intersection
   */
  static async sinter<T = RedisFetchable>(...keys: string[]): Promise<T[]> {
    try {
      const members =
        await this.redisDataSourceInstance.ioRedisConnection.sinter(...keys);
      return members
        .map((member) => this.getValue<T>(member))
        .filter((member) => member !== null) as T[];
    } catch (error) {
      throw new HysteriaError("RedisDataSource::sinter", "SINTER_FAILED");
    }
  }

  /**
   * @description Returns the union of multiple sets
   * @param {string[]} keys - The keys of the sets to union
   * @returns {Promise<T[]>} - Array of members in the union
   */
  static async sunion<T = RedisFetchable>(...keys: string[]): Promise<T[]> {
    try {
      const members =
        await this.redisDataSourceInstance.ioRedisConnection.sunion(...keys);
      return members
        .map((member) => this.getValue<T>(member))
        .filter((member) => member !== null) as T[];
    } catch (error) {
      throw new HysteriaError("RedisDataSource::sunion", "SUNION_FAILED");
    }
  }

  /**
   * @description Returns the difference between the first set and all successive sets
   * @param {string[]} keys - The keys of the sets to diff
   * @returns {Promise<T[]>} - Array of members in the difference
   */
  static async sdiff<T = RedisFetchable>(...keys: string[]): Promise<T[]> {
    try {
      const members =
        await this.redisDataSourceInstance.ioRedisConnection.sdiff(...keys);
      return members
        .map((member) => this.getValue<T>(member))
        .filter((member) => member !== null) as T[];
    } catch (error) {
      throw new HysteriaError("RedisDataSource::sdiff", "SDIFF_FAILED");
    }
  }

  /**
   * @description Adds one or more members to a set
   * @param {string} key - The key of the set
   * @param {RedisStorable[]} members - The members to add
   * @returns {Promise<number>} - The number of elements added to the set
   */
  async sadd(key: string, ...members: RedisStorable[]): Promise<number> {
    try {
      const processedMembers = members.map((member) => {
        if (typeof member === "object" && !Buffer.isBuffer(member)) {
          return JSON.stringify(member);
        }
        if (typeof member === "boolean") {
          return member.toString();
        }
        return member;
      });

      return await this.ioRedisConnection.sadd(key, ...processedMembers);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::sadd", "SADD_FAILED");
    }
  }

  /**
   * @description Gets all members of a set
   * @param {string} key - The key of the set
   * @returns {Promise<T[]>} - Array of set members
   */
  async smembers<T = RedisFetchable>(key: string): Promise<T[]> {
    try {
      const members = await this.ioRedisConnection.smembers(key);
      return members
        .map((member) => RedisDataSource.getValue<T>(member))
        .filter((member) => member !== null) as T[];
    } catch (error) {
      throw new HysteriaError("RedisDataSource::smembers", "SMEMBERS_FAILED");
    }
  }

  /**
   * @description Removes one or more members from a set
   * @param {string} key - The key of the set
   * @param {RedisStorable[]} members - The members to remove
   * @returns {Promise<number>} - The number of members that were removed
   */
  async srem(key: string, ...members: RedisStorable[]): Promise<number> {
    try {
      const processedMembers = members.map((member) => {
        if (typeof member === "object" && !Buffer.isBuffer(member)) {
          return JSON.stringify(member);
        }
        if (typeof member === "boolean") {
          return member.toString();
        }
        return member;
      });

      return await this.ioRedisConnection.srem(key, ...processedMembers);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::srem", "SREM_FAILED");
    }
  }

  /**
   * @description Determines whether a member belongs to a set
   * @param {string} key - The key of the set
   * @param {RedisStorable} member - The member to check
   * @returns {Promise<number>} - 1 if the member exists in the set, 0 if not
   */
  async sismember(key: string, member: RedisStorable): Promise<number> {
    try {
      if (typeof member === "object" && !Buffer.isBuffer(member)) {
        member = JSON.stringify(member);
      }
      if (typeof member === "boolean") {
        member = member.toString();
      }

      return await this.ioRedisConnection.sismember(key, member);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::sismember", "SISMEMBER_FAILED");
    }
  }

  /**
   * @description Gets the number of members in a set
   * @param {string} key - The key of the set
   * @returns {Promise<number>} - The number of members in the set
   */
  async scard(key: string): Promise<number> {
    try {
      return await this.ioRedisConnection.scard(key);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::scard", "SCARD_FAILED");
    }
  }

  /**
   * @description Returns the intersection of multiple sets
   * @param {string[]} keys - The keys of the sets to intersect
   * @returns {Promise<T[]>} - Array of members in the intersection
   */
  async sinter<T = RedisFetchable>(...keys: string[]): Promise<T[]> {
    try {
      const members = await this.ioRedisConnection.sinter(...keys);
      return members
        .map((member) => RedisDataSource.getValue<T>(member))
        .filter((member) => member !== null) as T[];
    } catch (error) {
      throw new HysteriaError("RedisDataSource::sinter", "SINTER_FAILED");
    }
  }

  /**
   * @description Returns the union of multiple sets
   * @param {string[]} keys - The keys of the sets to union
   * @returns {Promise<T[]>} - Array of members in the union
   */
  async sunion<T = RedisFetchable>(...keys: string[]): Promise<T[]> {
    try {
      const members = await this.ioRedisConnection.sunion(...keys);
      return members
        .map((member) => RedisDataSource.getValue<T>(member))
        .filter((member) => member !== null) as T[];
    } catch (error) {
      throw new HysteriaError("RedisDataSource::sunion", "SUNION_FAILED");
    }
  }

  /**
   * @description Returns the difference between the first set and all successive sets
   * @param {string[]} keys - The keys of the sets to diff
   * @returns {Promise<T[]>} - Array of members in the difference
   */
  async sdiff<T = RedisFetchable>(...keys: string[]): Promise<T[]> {
    try {
      const members = await this.ioRedisConnection.sdiff(...keys);
      return members
        .map((member) => RedisDataSource.getValue<T>(member))
        .filter((member) => member !== null) as T[];
    } catch (error) {
      throw new HysteriaError("RedisDataSource::sdiff", "SDIFF_FAILED");
    }
  }

  /**
   * @description Adds a member to a sorted set, or updates the score of an existing member
   * @param {string} key - The key of the sorted set
   * @param {number} score - The score associated with the member
   * @param {RedisStorable} member - The member to add or update
   * @returns {Promise<number>} - The number of new members added to the sorted set
   */
  static async zadd(
    key: string,
    score: number,
    member: RedisStorable,
  ): Promise<number>;
  static async zadd(
    key: string,
    scoreMembers: Array<[number, RedisStorable]>,
  ): Promise<number>;
  static async zadd(
    key: string,
    scoreOrScoreMembers: number | Array<[number, RedisStorable]>,
    member?: RedisStorable,
  ): Promise<number> {
    try {
      if (typeof scoreOrScoreMembers === "number" && member !== undefined) {
        // Single member zadd
        let processedMember = member;
        if (typeof member === "object" && !Buffer.isBuffer(member)) {
          processedMember = JSON.stringify(member);
        } else if (typeof member === "boolean") {
          processedMember = member.toString();
        }
        return await this.redisDataSourceInstance.ioRedisConnection.zadd(
          key,
          scoreOrScoreMembers,
          processedMember as string | number | Buffer,
        );
      } else if (Array.isArray(scoreOrScoreMembers)) {
        // Multiple members zadd
        const args: Array<number | string | Buffer> = [];

        for (const [score, member] of scoreOrScoreMembers) {
          args.push(score);

          if (typeof member === "object" && !Buffer.isBuffer(member)) {
            args.push(JSON.stringify(member));
          } else if (typeof member === "boolean") {
            args.push(member.toString());
          } else {
            args.push(member as string | number | Buffer);
          }
        }

        return await this.redisDataSourceInstance.ioRedisConnection.zadd(
          key,
          ...args,
        );
      }

      throw new Error("Invalid arguments for zadd");
    } catch (error) {
      throw new HysteriaError("RedisDataSource::zadd", "ZADD_FAILED");
    }
  }

  /**
   * @description Gets a range of members from a sorted set, ordered by score
   * @param {string} key - The key of the sorted set
   * @param {number} start - The starting index
   * @param {number} stop - The stopping index
   * @param {boolean} withScores - Whether to return the scores along with the members
   * @returns {Promise<T[] | Array<{value: T, score: number}>>} - Array of members or [member, score] pairs
   */
  static async zrange<T = RedisFetchable>(
    key: string,
    start: number,
    stop: number,
    withScores = false,
  ): Promise<T[] | Array<{ value: T; score: number }>> {
    try {
      let result: string[];

      if (withScores) {
        result = await this.redisDataSourceInstance.ioRedisConnection.zrange(
          key,
          start,
          stop,
          "WITHSCORES",
        );

        const membersWithScores: Array<{ value: T; score: number }> = [];
        for (let i = 0; i < result.length; i += 2) {
          const member = this.getValue<T>(result[i]);
          const score = Number(result[i + 1]);
          if (member !== null) {
            membersWithScores.push({ value: member, score });
          }
        }
        return membersWithScores;
      }

      result = await this.redisDataSourceInstance.ioRedisConnection.zrange(
        key,
        start,
        stop,
      );

      return result
        .map((member) => this.getValue<T>(member))
        .filter((member) => member !== null) as T[];
    } catch (error) {
      throw new HysteriaError("RedisDataSource::zrange", "ZRANGE_FAILED");
    }
  }

  /**
   * @description Gets a range of members from a sorted set, ordered by score in descending order
   * @param {string} key - The key of the sorted set
   * @param {number} start - The starting index
   * @param {number} stop - The stopping index
   * @param {boolean} withScores - Whether to return the scores along with the members
   * @returns {Promise<T[] | Array<{value: T, score: number}>>} - Array of members or [member, score] pairs
   */
  static async zrevrange<T = RedisFetchable>(
    key: string,
    start: number,
    stop: number,
    withScores = false,
  ): Promise<T[] | Array<{ value: T; score: number }>> {
    try {
      let result: string[];

      if (withScores) {
        result = await this.redisDataSourceInstance.ioRedisConnection.zrevrange(
          key,
          start,
          stop,
          "WITHSCORES",
        );

        const membersWithScores: Array<{ value: T; score: number }> = [];
        for (let i = 0; i < result.length; i += 2) {
          const member = this.getValue<T>(result[i]);
          const score = Number(result[i + 1]);
          if (member !== null) {
            membersWithScores.push({ value: member, score });
          }
        }
        return membersWithScores;
      }

      result = await this.redisDataSourceInstance.ioRedisConnection.zrevrange(
        key,
        start,
        stop,
      );

      return result
        .map((member) => this.getValue<T>(member))
        .filter((member) => member !== null) as T[];
    } catch (error) {
      throw new HysteriaError("RedisDataSource::zrevrange", "ZREVRANGE_FAILED");
    }
  }

  /**
   * @description Removes one or more members from a sorted set
   * @param {string} key - The key of the sorted set
   * @param {RedisStorable[]} members - The members to remove
   * @returns {Promise<number>} - The number of members removed
   */
  static async zrem(key: string, ...members: RedisStorable[]): Promise<number> {
    try {
      const processedMembers = members.map((member) => {
        if (typeof member === "object" && !Buffer.isBuffer(member)) {
          return JSON.stringify(member);
        }
        if (typeof member === "boolean") {
          return member.toString();
        }
        return member;
      });

      return await this.redisDataSourceInstance.ioRedisConnection.zrem(
        key,
        ...processedMembers,
      );
    } catch (error) {
      throw new HysteriaError("RedisDataSource::zrem", "ZREM_FAILED");
    }
  }

  /**
   * @description Gets the score of a member in a sorted set
   * @param {string} key - The key of the sorted set
   * @param {RedisStorable} member - The member to get the score of
   * @returns {Promise<number | null>} - The score of the member, or null if the member does not exist
   */
  static async zscore(
    key: string,
    member: RedisStorable,
  ): Promise<number | null> {
    try {
      if (typeof member === "object" && !Buffer.isBuffer(member)) {
        member = JSON.stringify(member);
      }
      if (typeof member === "boolean") {
        member = member.toString();
      }

      const score = await this.redisDataSourceInstance.ioRedisConnection.zscore(
        key,
        member,
      );
      return score !== null ? Number(score) : null;
    } catch (error) {
      throw new HysteriaError("RedisDataSource::zscore", "ZSCORE_FAILED");
    }
  }

  /**
   * @description Gets the number of members in a sorted set
   * @param {string} key - The key of the sorted set
   * @returns {Promise<number>} - The number of members in the sorted set
   */
  static async zcard(key: string): Promise<number> {
    try {
      return await this.redisDataSourceInstance.ioRedisConnection.zcard(key);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::zcard", "ZCARD_FAILED");
    }
  }

  /**
   * @description Adds a member to a sorted set, or updates the score of an existing member
   * @param {string} key - The key of the sorted set
   * @param {number} score - The score associated with the member
   * @param {RedisStorable} member - The member to add or update
   * @returns {Promise<number>} - The number of new members added to the sorted set
   */
  async zadd(
    key: string,
    score: number,
    member: RedisStorable,
  ): Promise<number>;
  async zadd(
    key: string,
    scoreMembers: Array<[number, RedisStorable]>,
  ): Promise<number>;
  async zadd(
    key: string,
    scoreOrScoreMembers: number | Array<[number, RedisStorable]>,
    member?: RedisStorable,
  ): Promise<number> {
    try {
      if (typeof scoreOrScoreMembers === "number" && member !== undefined) {
        // Single member zadd
        let processedMember = member;
        if (typeof member === "object" && !Buffer.isBuffer(member)) {
          processedMember = JSON.stringify(member);
        } else if (typeof member === "boolean") {
          processedMember = member.toString();
        }
        return await this.ioRedisConnection.zadd(
          key,
          scoreOrScoreMembers,
          processedMember as string | number | Buffer,
        );
      } else if (Array.isArray(scoreOrScoreMembers)) {
        // Multiple members zadd
        const args: Array<number | string | Buffer> = [];

        for (const [score, member] of scoreOrScoreMembers) {
          args.push(score);

          if (typeof member === "object" && !Buffer.isBuffer(member)) {
            args.push(JSON.stringify(member));
          } else if (typeof member === "boolean") {
            args.push(member.toString());
          } else {
            args.push(member as string | number | Buffer);
          }
        }

        return await this.ioRedisConnection.zadd(key, ...args);
      }

      throw new Error("Invalid arguments for zadd");
    } catch (error) {
      throw new HysteriaError("RedisDataSource::zadd", "ZADD_FAILED");
    }
  }

  /**
   * @description Gets a range of members from a sorted set, ordered by score
   * @param {string} key - The key of the sorted set
   * @param {number} start - The starting index
   * @param {number} stop - The stopping index
   * @param {boolean} withScores - Whether to return the scores along with the members
   * @returns {Promise<T[] | Array<{value: T, score: number}>>} - Array of members or [member, score] pairs
   */
  async zrange<T = RedisFetchable>(
    key: string,
    start: number,
    stop: number,
    withScores = false,
  ): Promise<T[] | Array<{ value: T; score: number }>> {
    try {
      let result: string[];

      if (withScores) {
        result = await this.ioRedisConnection.zrange(
          key,
          start,
          stop,
          "WITHSCORES",
        );

        const membersWithScores: Array<{ value: T; score: number }> = [];
        for (let i = 0; i < result.length; i += 2) {
          const member = RedisDataSource.getValue<T>(result[i]);
          const score = Number(result[i + 1]);
          if (member !== null) {
            membersWithScores.push({ value: member, score });
          }
        }
        return membersWithScores;
      }

      result = await this.ioRedisConnection.zrange(key, start, stop);

      return result
        .map((member) => RedisDataSource.getValue<T>(member))
        .filter((member) => member !== null) as T[];
    } catch (error) {
      throw new HysteriaError("RedisDataSource::zrange", "ZRANGE_FAILED");
    }
  }

  /**
   * @description Gets a range of members from a sorted set, ordered by score in descending order
   * @param {string} key - The key of the sorted set
   * @param {number} start - The starting index
   * @param {number} stop - The stopping index
   * @param {boolean} withScores - Whether to return the scores along with the members
   * @returns {Promise<T[] | Array<{value: T, score: number}>>} - Array of members or [member, score] pairs
   */
  async zrevrange<T = RedisFetchable>(
    key: string,
    start: number,
    stop: number,
    withScores = false,
  ): Promise<T[] | Array<{ value: T; score: number }>> {
    try {
      let result: string[];

      if (withScores) {
        result = await this.ioRedisConnection.zrevrange(
          key,
          start,
          stop,
          "WITHSCORES",
        );

        const membersWithScores: Array<{ value: T; score: number }> = [];
        for (let i = 0; i < result.length; i += 2) {
          const member = RedisDataSource.getValue<T>(result[i]);
          const score = Number(result[i + 1]);
          if (member !== null) {
            membersWithScores.push({ value: member, score });
          }
        }
        return membersWithScores;
      }

      result = await this.ioRedisConnection.zrevrange(key, start, stop);

      return result
        .map((member) => RedisDataSource.getValue<T>(member))
        .filter((member) => member !== null) as T[];
    } catch (error) {
      throw new HysteriaError("RedisDataSource::zrevrange", "ZREVRANGE_FAILED");
    }
  }

  /**
   * @description Removes one or more members from a sorted set
   * @param {string} key - The key of the sorted set
   * @param {RedisStorable[]} members - The members to remove
   * @returns {Promise<number>} - The number of members removed
   */
  async zrem(key: string, ...members: RedisStorable[]): Promise<number> {
    try {
      const processedMembers = members.map((member) => {
        if (typeof member === "object" && !Buffer.isBuffer(member)) {
          return JSON.stringify(member);
        }
        if (typeof member === "boolean") {
          return member.toString();
        }
        return member;
      });

      return await this.ioRedisConnection.zrem(key, ...processedMembers);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::zrem", "ZREM_FAILED");
    }
  }

  /**
   * @description Gets the score of a member in a sorted set
   * @param {string} key - The key of the sorted set
   * @param {RedisStorable} member - The member to get the score of
   * @returns {Promise<number | null>} - The score of the member, or null if the member does not exist
   */
  async zscore(key: string, member: RedisStorable): Promise<number | null> {
    try {
      if (typeof member === "object" && !Buffer.isBuffer(member)) {
        member = JSON.stringify(member);
      }
      if (typeof member === "boolean") {
        member = member.toString();
      }

      const score = await this.ioRedisConnection.zscore(key, member);
      return score !== null ? Number(score) : null;
    } catch (error) {
      throw new HysteriaError("RedisDataSource::zscore", "ZSCORE_FAILED");
    }
  }

  /**
   * @description Gets the number of members in a sorted set
   * @param {string} key - The key of the sorted set
   * @returns {Promise<number>} - The number of members in the sorted set
   */
  async zcard(key: string): Promise<number> {
    try {
      return await this.ioRedisConnection.zcard(key);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::zcard", "ZCARD_FAILED");
    }
  }

  /**
   * @description Subscribes to one or more channels
   * @param {string[]} channels - The channels to subscribe to
   * @param {RedisMessageHandler} handler - The function to call when a message is received
   * @returns {Promise<void>}
   */
  static async subscribe(
    channels: string[],
    handler: RedisMessageHandler,
  ): Promise<void> {
    try {
      // Subscribe to channels
      await this.redisDataSourceInstance.ioRedisConnection.subscribe(
        ...channels,
      );

      // Set up message handler
      this.redisDataSourceInstance.ioRedisConnection.on("message", handler);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::subscribe", "SUBSCRIBE_FAILED");
    }
  }

  /**
   * @description Unsubscribes from one or more channels
   * @param {string[]} channels - The channels to unsubscribe from
   * @returns {Promise<void>}
   */
  static async unsubscribe(...channels: string[]): Promise<void> {
    try {
      await this.redisDataSourceInstance.ioRedisConnection.unsubscribe(
        ...channels,
      );
    } catch (error) {
      throw new HysteriaError(
        "RedisDataSource::unsubscribe",
        "UNSUBSCRIBE_FAILED",
      );
    }
  }

  /**
   * @description Publishes a message to a channel
   * @param {string} channel - The channel to publish to
   * @param {RedisStorable} message - The message to publish
   * @returns {Promise<number>} - The number of clients that received the message
   */
  static async publish(
    channel: string,
    message: RedisStorable,
  ): Promise<number> {
    try {
      let processedMessage: string | Buffer;

      if (typeof message === "object" && !Buffer.isBuffer(message)) {
        processedMessage = JSON.stringify(message);
      } else if (typeof message === "boolean" || typeof message === "number") {
        processedMessage = message.toString();
      } else if (Buffer.isBuffer(message)) {
        processedMessage = message;
      } else {
        processedMessage = String(message);
      }

      return await this.redisDataSourceInstance.ioRedisConnection.publish(
        channel,
        processedMessage,
      );
    } catch (error) {
      throw new HysteriaError("RedisDataSource::publish", "PUBLISH_FAILED");
    }
  }

  /**
   * @description Pattern subscribe to channels
   * @param {string[]} patterns - The patterns to subscribe to
   * @param {RedisMessageHandler} handler - The function to call when a message is received
   * @returns {Promise<void>}
   */
  static async psubscribe(
    patterns: string[],
    handler: RedisMessageHandler,
  ): Promise<void> {
    try {
      // Subscribe to patterns
      await this.redisDataSourceInstance.ioRedisConnection.psubscribe(
        ...patterns,
      );

      // Set up message handler
      this.redisDataSourceInstance.ioRedisConnection.on(
        "pmessage",
        (_pattern: string, channel: string, message: string) => {
          handler(channel, message);
        },
      );
    } catch (error) {
      throw new HysteriaError(
        "RedisDataSource::psubscribe",
        "PSUBSCRIBE_FAILED",
      );
    }
  }

  /**
   * @description Pattern unsubscribe from channels
   * @param {string[]} patterns - The patterns to unsubscribe from
   * @returns {Promise<void>}
   */
  static async punsubscribe(...patterns: string[]): Promise<void> {
    try {
      await this.redisDataSourceInstance.ioRedisConnection.punsubscribe(
        ...patterns,
      );
    } catch (error) {
      throw new HysteriaError(
        "RedisDataSource::punsubscribe",
        "PUNSUBSCRIBE_FAILED",
      );
    }
  }

  /**
   * @description Subscribes to one or more channels
   * @param {string[]} channels - The channels to subscribe to
   * @param {RedisMessageHandler} handler - The function to call when a message is received
   * @returns {Promise<void>}
   */
  async subscribe(
    channels: string[],
    handler: RedisMessageHandler,
  ): Promise<void> {
    try {
      // Subscribe to channels
      await this.ioRedisConnection.subscribe(...channels);

      // Set up message handler
      this.ioRedisConnection.on("message", handler);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::subscribe", "SUBSCRIBE_FAILED");
    }
  }

  /**
   * @description Unsubscribes from one or more channels
   * @param {string[]} channels - The channels to unsubscribe from
   * @returns {Promise<void>}
   */
  async unsubscribe(...channels: string[]): Promise<void> {
    try {
      await this.ioRedisConnection.unsubscribe(...channels);
    } catch (error) {
      throw new HysteriaError(
        "RedisDataSource::unsubscribe",
        "UNSUBSCRIBE_FAILED",
      );
    }
  }

  /**
   * @description Publishes a message to a channel
   * @param {string} channel - The channel to publish to
   * @param {RedisStorable} message - The message to publish
   * @returns {Promise<number>} - The number of clients that received the message
   */
  async publish(channel: string, message: RedisStorable): Promise<number> {
    try {
      let processedMessage: string | Buffer;

      if (typeof message === "object" && !Buffer.isBuffer(message)) {
        processedMessage = JSON.stringify(message);
      } else if (typeof message === "boolean" || typeof message === "number") {
        processedMessage = message.toString();
      } else if (Buffer.isBuffer(message)) {
        processedMessage = message;
      } else {
        processedMessage = String(message);
      }

      return await this.ioRedisConnection.publish(channel, processedMessage);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::publish", "PUBLISH_FAILED");
    }
  }

  /**
   * @description Pattern subscribe to channels
   * @param {string[]} patterns - The patterns to subscribe to
   * @param {RedisMessageHandler} handler - The function to call when a message is received
   * @returns {Promise<void>}
   */
  async psubscribe(
    patterns: string[],
    handler: RedisMessageHandler,
  ): Promise<void> {
    try {
      // Subscribe to patterns
      await this.ioRedisConnection.psubscribe(...patterns);

      // Set up message handler
      this.ioRedisConnection.on(
        "pmessage",
        (_pattern: string, channel: string, message: string) => {
          handler(channel, message);
        },
      );
    } catch (error) {
      throw new HysteriaError(
        "RedisDataSource::psubscribe",
        "PSUBSCRIBE_FAILED",
      );
    }
  }

  /**
   * @description Pattern unsubscribe from channels
   * @param {string[]} patterns - The patterns to unsubscribe from
   * @returns {Promise<void>}
   */
  async punsubscribe(...patterns: string[]): Promise<void> {
    try {
      await this.ioRedisConnection.punsubscribe(...patterns);
    } catch (error) {
      throw new HysteriaError(
        "RedisDataSource::punsubscribe",
        "PUNSUBSCRIBE_FAILED",
      );
    }
  }

  /**
   * @description Checks if a key exists
   * @param {string} key - The key to check
   * @returns {Promise<number>} - 1 if the key exists, 0 if not
   */
  static async exists(key: string): Promise<number> {
    try {
      return await this.redisDataSourceInstance.ioRedisConnection.exists(key);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::exists", "EXISTS_FAILED");
    }
  }

  /**
   * @description Sets the expiration time of a key
   * @param {string} key - The key to set the expiration for
   * @param {number} seconds - The expiration time in seconds
   * @returns {Promise<number>} - 1 if the timeout was set, 0 if not
   */
  static async expire(key: string, seconds: number): Promise<number> {
    try {
      return await this.redisDataSourceInstance.ioRedisConnection.expire(
        key,
        seconds,
      );
    } catch (error) {
      throw new HysteriaError("RedisDataSource::expire", "EXPIRE_FAILED");
    }
  }

  /**
   * @description Sets the expiration time of a key using a UNIX timestamp
   * @param {string} key - The key to set the expiration for
   * @param {number} timestamp - UNIX timestamp in seconds
   * @returns {Promise<number>} - 1 if the timeout was set, 0 if not
   */
  static async expireat(key: string, timestamp: number): Promise<number> {
    try {
      return await this.redisDataSourceInstance.ioRedisConnection.expireat(
        key,
        timestamp,
      );
    } catch (error) {
      throw new HysteriaError("RedisDataSource::expireat", "EXPIREAT_FAILED");
    }
  }

  /**
   * @description Sets the expiration time of a key in milliseconds
   * @param {string} key - The key to set the expiration for
   * @param {number} milliseconds - The expiration time in milliseconds
   * @returns {Promise<number>} - 1 if the timeout was set, 0 if not
   */
  static async pexpire(key: string, milliseconds: number): Promise<number> {
    try {
      return await this.redisDataSourceInstance.ioRedisConnection.pexpire(
        key,
        milliseconds,
      );
    } catch (error) {
      throw new HysteriaError("RedisDataSource::pexpire", "PEXPIRE_FAILED");
    }
  }

  /**
   * @description Gets the remaining time to live of a key in seconds
   * @param {string} key - The key to get the TTL for
   * @returns {Promise<number>} - TTL in seconds, -1 if no expiry, -2 if key doesn't exist
   */
  static async ttl(key: string): Promise<number> {
    try {
      return await this.redisDataSourceInstance.ioRedisConnection.ttl(key);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::ttl", "TTL_FAILED");
    }
  }

  /**
   * @description Gets the remaining time to live of a key in milliseconds
   * @param {string} key - The key to get the TTL for
   * @returns {Promise<number>} - TTL in milliseconds, -1 if no expiry, -2 if key doesn't exist
   */
  static async pttl(key: string): Promise<number> {
    try {
      return await this.redisDataSourceInstance.ioRedisConnection.pttl(key);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::pttl", "PTTL_FAILED");
    }
  }

  /**
   * @description Removes the expiration time from a key
   * @param {string} key - The key to persist
   * @returns {Promise<number>} - 1 if the timeout was removed, 0 if not
   */
  static async persist(key: string): Promise<number> {
    try {
      return await this.redisDataSourceInstance.ioRedisConnection.persist(key);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::persist", "PERSIST_FAILED");
    }
  }

  /**
   * @description Gets all keys matching a pattern
   * @param {string} pattern - The pattern to match
   * @returns {Promise<string[]>} - Array of matching keys
   */
  static async keys(pattern: string): Promise<string[]> {
    try {
      return await this.redisDataSourceInstance.ioRedisConnection.keys(pattern);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::keys", "KEYS_FAILED");
    }
  }

  /**
   * @description Renames a key
   * @param {string} key - The key to rename
   * @param {string} newKey - The new name for the key
   * @returns {Promise<string>} - "OK" if successful
   */
  static async rename(key: string, newKey: string): Promise<string> {
    try {
      return await this.redisDataSourceInstance.ioRedisConnection.rename(
        key,
        newKey,
      );
    } catch (error) {
      throw new HysteriaError("RedisDataSource::rename", "RENAME_FAILED");
    }
  }

  /**
   * @description Returns the type of value stored at a key
   * @param {string} key - The key to check
   * @returns {Promise<string>} - Type of key (string, list, set, zset, hash, or none if key doesn't exist)
   */
  static async type(key: string): Promise<string> {
    try {
      return await this.redisDataSourceInstance.ioRedisConnection.type(key);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::type", "TYPE_FAILED");
    }
  }

  /**
   * @description Checks if a key exists
   * @param {string} key - The key to check
   * @returns {Promise<number>} - 1 if the key exists, 0 if not
   */
  async exists(key: string): Promise<number> {
    try {
      return await this.ioRedisConnection.exists(key);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::exists", "EXISTS_FAILED");
    }
  }

  /**
   * @description Sets the expiration time of a key
   * @param {string} key - The key to set the expiration for
   * @param {number} seconds - The expiration time in seconds
   * @returns {Promise<number>} - 1 if the timeout was set, 0 if not
   */
  async expire(key: string, seconds: number): Promise<number> {
    try {
      return await this.ioRedisConnection.expire(key, seconds);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::expire", "EXPIRE_FAILED");
    }
  }

  /**
   * @description Sets the expiration time of a key using a UNIX timestamp
   * @param {string} key - The key to set the expiration for
   * @param {number} timestamp - UNIX timestamp in seconds
   * @returns {Promise<number>} - 1 if the timeout was set, 0 if not
   */
  async expireat(key: string, timestamp: number): Promise<number> {
    try {
      return await this.ioRedisConnection.expireat(key, timestamp);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::expireat", "EXPIREAT_FAILED");
    }
  }

  /**
   * @description Sets the expiration time of a key in milliseconds
   * @param {string} key - The key to set the expiration for
   * @param {number} milliseconds - The expiration time in milliseconds
   * @returns {Promise<number>} - 1 if the timeout was set, 0 if not
   */
  async pexpire(key: string, milliseconds: number): Promise<number> {
    try {
      return await this.ioRedisConnection.pexpire(key, milliseconds);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::pexpire", "PEXPIRE_FAILED");
    }
  }

  /**
   * @description Gets the remaining time to live of a key in seconds
   * @param {string} key - The key to get the TTL for
   * @returns {Promise<number>} - TTL in seconds, -1 if no expiry, -2 if key doesn't exist
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.ioRedisConnection.ttl(key);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::ttl", "TTL_FAILED");
    }
  }

  /**
   * @description Gets the remaining time to live of a key in milliseconds
   * @param {string} key - The key to get the TTL for
   * @returns {Promise<number>} - TTL in milliseconds, -1 if no expiry, -2 if key doesn't exist
   */
  async pttl(key: string): Promise<number> {
    try {
      return await this.ioRedisConnection.pttl(key);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::pttl", "PTTL_FAILED");
    }
  }

  /**
   * @description Removes the expiration time from a key
   * @param {string} key - The key to persist
   * @returns {Promise<number>} - 1 if the timeout was removed, 0 if not
   */
  async persist(key: string): Promise<number> {
    try {
      return await this.ioRedisConnection.persist(key);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::persist", "PERSIST_FAILED");
    }
  }

  /**
   * @description Gets all keys matching a pattern
   * @param {string} pattern - The pattern to match
   * @returns {Promise<string[]>} - Array of matching keys
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.ioRedisConnection.keys(pattern);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::keys", "KEYS_FAILED");
    }
  }

  /**
   * @description Renames a key
   * @param {string} key - The key to rename
   * @param {string} newKey - The new name for the key
   * @returns {Promise<string>} - "OK" if successful
   */
  async rename(key: string, newKey: string): Promise<string> {
    try {
      return await this.ioRedisConnection.rename(key, newKey);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::rename", "RENAME_FAILED");
    }
  }

  /**
   * @description Returns the type of value stored at a key
   * @param {string} key - The key to check
   * @returns {Promise<string>} - Type of key (string, list, set, zset, hash, or none if key doesn't exist)
   */
  async type(key: string): Promise<string> {
    try {
      return await this.ioRedisConnection.type(key);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::type", "TYPE_FAILED");
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

    return value as T;
  }
}
