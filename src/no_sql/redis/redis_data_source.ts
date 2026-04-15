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

export interface RedisDataSourceInput extends RedisOptions {
  lazyLoad?: boolean;
}

/**
 * @description The RedisDataSource class is a wrapper around the ioredis library that provides a simple interface to interact with a redis database
 */
export class RedisDataSource {
  readonly OK = "OK";

  isConnected: boolean;
  protected ioRedisConnection: Redis | null = null;
  private inputOptions: RedisDataSourceInput;
  private lazyLoad: boolean;
  private connecting: Promise<void> | null = null;

  constructor(input?: RedisDataSourceInput) {
    this.isConnected = false;
    this.inputOptions = input || {};
    this.lazyLoad = input?.lazyLoad ?? false;
  }

  /**
   * @description Returns the raw ioredis connection
   * @returns {Redis}
   */
  get ioredis(): Redis {
    if (!this.ioRedisConnection) {
      throw new HysteriaError(
        "RedisDataSource::ioredis connection not established",
        "CONNECTION_NOT_ESTABLISHED",
      );
    }
    return this.ioRedisConnection;
  }

  /**
   * @description Establishes a connection to the redis database. The ioredis driver is dynamically imported.
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    const port = this.inputOptions.port || +(env.REDIS_PORT as string) || 6379;
    const redisImport = await import("ioredis").catch(() => {
      throw new DriverNotFoundError("ioredis");
    });

    this.ioRedisConnection = new redisImport.default({
      host: this.inputOptions.host || env.REDIS_HOST,
      username: this.inputOptions.username || env.REDIS_USERNAME,
      port: port,
      password: this.inputOptions.password || env.REDIS_PASSWORD,
      ...this.inputOptions,
    });

    try {
      await this.ioRedisConnection.ping();
      this.isConnected = true;
    } catch (error) {
      throw new HysteriaError(
        "RedisDataSource::connect",
        "CONNECTION_NOT_ESTABLISHED",
      );
    }
  }

  /**
   * @description Ensures the connection is established. If lazyLoad is true and not connected, connects automatically.
   */
  private async ensureConnected(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    if (!this.lazyLoad) {
      throw new HysteriaError(
        "RedisDataSource::ensureConnected",
        "CONNECTION_NOT_ESTABLISHED",
      );
    }

    if (!this.connecting) {
      this.connecting = this.connect().finally(() => {
        this.connecting = null;
      });
    }

    await this.connecting;
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
    await this.ensureConnected();
    expirationTime = expirationTime ? expirationTime / 1000 : undefined;

    if (typeof value === "object" && !Buffer.isBuffer(value)) {
      value = JSON.stringify(value);
    }

    if (typeof value === "boolean") {
      value = value.toString();
    }

    try {
      if (expirationTime) {
        await this.ioredis.setex(key, expirationTime, value);
        return;
      }

      await this.ioredis.set(key, value);
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
      const value = await this.ioredis.get(key);
      return RedisDataSource.getValue<T>(value);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::get", "GET_FAILED");
    }
  }

  /**
   * @description Gets the value of a key in the redis database as a buffer
   */
  async getBuffer(key: string): Promise<Buffer | null> {
    await this.ensureConnected();
    try {
      return await this.ioredis.getBuffer(key);
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
      const value = await this.ioredis.get(key);
      await this.ioredis.del(key);
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
    await this.ensureConnected();
    try {
      await this.ioredis.del(key);
    } catch (error) {
      throw new HysteriaError("RedisDataSource::delete", "DELETE_FAILED");
    }
  }

  /**
   * @description Flushes all the data in the redis database
   * @returns {Promise<void>}
   */
  async flushAll(): Promise<void> {
    await this.ensureConnected();
    try {
      await this.ioredis.flushall();
    } catch (error) {
      throw new HysteriaError("RedisDataSource::flushAll", "FLUSH_FAILED");
    }
  }

  /**
   * @description Disconnects from the redis database
   * @returns {Promise<void>}
   */
  async disconnect(forceError?: boolean): Promise<void> {
    if (!this.isConnected || !this.ioRedisConnection) {
      return;
    }

    try {
      await this.ioRedisConnection.quit();
      this.isConnected = false;
      this.ioRedisConnection = null;
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
  async lpush(key: string, ...values: RedisStorable[]): Promise<number> {
    await this.ensureConnected();
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

      return await this.ioredis.lpush(key, ...processedValues);
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
    await this.ensureConnected();
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

      return await this.ioredis.rpush(key, ...processedValues);
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
      const value = await this.ioredis.lpop(key);
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
      const value = await this.ioredis.rpop(key);
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
      const values = await this.ioredis.lrange(key, start, stop);
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
    await this.ensureConnected();
    try {
      return await this.ioredis.llen(key);
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
  async hset(
    key: string,
    field: string,
    value: RedisStorable,
  ): Promise<number> {
    await this.ensureConnected();
    try {
      if (typeof value === "object" && !Buffer.isBuffer(value)) {
        value = JSON.stringify(value);
      }

      if (typeof value === "boolean") {
        value = value.toString();
      }

      return await this.ioredis.hset(key, field, value);
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
    await this.ensureConnected();
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

      return await this.ioredis.hmset(key, processedHash);
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
      const value = await this.ioredis.hget(key, field);
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
      const hash = await this.ioredis.hgetall(key);
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
      const values = await this.ioredis.hmget(key, ...fields);
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
    await this.ensureConnected();
    try {
      return await this.ioredis.hdel(key, ...fields);
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
    await this.ensureConnected();
    try {
      return await this.ioredis.hexists(key, field);
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
    await this.ensureConnected();
    try {
      return await this.ioredis.hkeys(key);
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
    await this.ensureConnected();
    try {
      return await this.ioredis.hlen(key);
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
  async sadd(key: string, ...members: RedisStorable[]): Promise<number> {
    await this.ensureConnected();
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

      return await this.ioredis.sadd(key, ...processedMembers);
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
      const members = await this.ioredis.smembers(key);
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
    await this.ensureConnected();
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

      return await this.ioredis.srem(key, ...processedMembers);
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
    await this.ensureConnected();
    try {
      if (typeof member === "object" && !Buffer.isBuffer(member)) {
        member = JSON.stringify(member);
      }
      if (typeof member === "boolean") {
        member = member.toString();
      }

      return await this.ioredis.sismember(key, member);
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
    await this.ensureConnected();
    try {
      return await this.ioredis.scard(key);
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
      const members = await this.ioredis.sinter(...keys);
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
      const members = await this.ioredis.sunion(...keys);
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
      const members = await this.ioredis.sdiff(...keys);
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
    await this.ensureConnected();
    try {
      if (typeof scoreOrScoreMembers === "number" && member !== undefined) {
        // Single member zadd
        let processedMember = member;
        if (typeof member === "object" && !Buffer.isBuffer(member)) {
          processedMember = JSON.stringify(member);
        } else if (typeof member === "boolean") {
          processedMember = member.toString();
        }
        return await this.ioredis.zadd(
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

        return await this.ioredis.zadd(key, ...args);
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
        result = await this.ioredis.zrange(key, start, stop, "WITHSCORES");

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

      result = await this.ioredis.zrange(key, start, stop);

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
        result = await this.ioredis.zrevrange(key, start, stop, "WITHSCORES");

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

      result = await this.ioredis.zrevrange(key, start, stop);

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
    await this.ensureConnected();
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

      return await this.ioredis.zrem(key, ...processedMembers);
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
    await this.ensureConnected();
    try {
      if (typeof member === "object" && !Buffer.isBuffer(member)) {
        member = JSON.stringify(member);
      }
      if (typeof member === "boolean") {
        member = member.toString();
      }

      const score = await this.ioredis.zscore(key, member);
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
    await this.ensureConnected();
    try {
      return await this.ioredis.zcard(key);
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
  async subscribe(
    channels: string[],
    handler: RedisMessageHandler,
  ): Promise<void> {
    await this.ensureConnected();
    try {
      // Subscribe to channels
      await this.ioredis.subscribe(...channels);

      // Set up message handler
      this.ioredis.on("message", handler);
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
    await this.ensureConnected();
    try {
      await this.ioredis.unsubscribe(...channels);
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
    await this.ensureConnected();
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

      return await this.ioredis.publish(channel, processedMessage);
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
    await this.ensureConnected();
    try {
      // Subscribe to patterns
      await this.ioredis.psubscribe(...patterns);

      // Set up message handler
      this.ioredis.on(
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
    await this.ensureConnected();
    try {
      await this.ioredis.punsubscribe(...patterns);
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
  async exists(key: string): Promise<number> {
    await this.ensureConnected();
    try {
      return await this.ioredis.exists(key);
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
    await this.ensureConnected();
    try {
      return await this.ioredis.expire(key, seconds);
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
    await this.ensureConnected();
    try {
      return await this.ioredis.expireat(key, timestamp);
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
    await this.ensureConnected();
    try {
      return await this.ioredis.pexpire(key, milliseconds);
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
    await this.ensureConnected();
    try {
      return await this.ioredis.ttl(key);
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
    await this.ensureConnected();
    try {
      return await this.ioredis.pttl(key);
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
    await this.ensureConnected();
    try {
      return await this.ioredis.persist(key);
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
    await this.ensureConnected();
    try {
      return await this.ioredis.keys(pattern);
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
    await this.ensureConnected();
    try {
      return await this.ioredis.rename(key, newKey);
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
    await this.ensureConnected();
    try {
      return await this.ioredis.type(key);
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
