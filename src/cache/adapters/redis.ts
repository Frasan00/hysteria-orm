import type { Redis, RedisOptions } from "ioredis";
import { DriverNotFoundError } from "../../drivers/driver_constants";
import logger from "../../utils/logger";
import { CacheAdapter } from "../cache_adapter";

export class RedisCacheAdapter implements CacheAdapter {
  declare redisInstance: Redis;
  private ioRedisOptions: RedisOptions;

  constructor(ioRedisOptions: RedisOptions) {
    this.ioRedisOptions = ioRedisOptions;
  }

  private async getClient() {
    if (this.redisInstance) {
      return this.redisInstance;
    }

    const { default: redisImport } = await import("ioredis").catch(() => {
      logger.error(
        "RedisCacheAdapter::getClient ioredis driver not found and required for the RedisCacheAdapter",
      );

      throw new DriverNotFoundError("ioredis");
    });

    this.redisInstance = new redisImport(this.ioRedisOptions);
    return this.redisInstance;
  }

  async get<T = void>(key: string): Promise<T> {
    const client = await this.getClient();
    const value = await client.get(key);

    if (value === null || value === undefined) {
      return undefined as T;
    }

    return this.deserializeData(value) as T;
  }

  async set<T = any>(key: string, data: T, ttl?: number): Promise<void> {
    const client = await this.getClient();
    const serializedValue = this.serializeData(data);
    if (!serializedValue) {
      return;
    }

    if (ttl) {
      await client.set(key, serializedValue, "PX", ttl);
      return;
    }

    await client.set(key, serializedValue);
  }

  async invalidate(key: string): Promise<void> {
    const client = await this.getClient();
    await client.del(key);
  }

  private serializeData(data: any): string | undefined {
    if (data === null || data === undefined) {
      return undefined;
    }
    if (typeof data === "string") {
      return data;
    }
    if (Buffer.isBuffer(data)) {
      return data.toString("base64");
    }
    if (typeof data === "object" || Array.isArray(data)) {
      try {
        return JSON.stringify(data);
      } catch (error) {
        logger.error("RedisCacheAdapter::set failed to serialize data");
        throw error;
      }
    }
    return String(data);
  }

  private deserializeData(value: string): any {
    try {
      const parsed = JSON.parse(value);
      return parsed;
    } catch {
      return value;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.redisInstance) {
      return;
    }

    await this.redisInstance.quit();
  }
}
