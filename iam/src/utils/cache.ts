import { createClient } from "redis";
import type { RedisClientType } from "redis";

class PassportCache {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL,
    });

    this.client.on("error", (err) => {
      // Send pd alert
    });
  }

  async init(): Promise<void> {
    await this.connect();
  }

  private async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (err) {
      console.error("REDIS CONNECTION ERROR: Error connecting to redis");
    }
  }

  public async set(key: string, value: string): Promise<void> {
    try {
      await this.client.set(key, value);
    } catch (err) {
      console.error("REDIS CONNECTION ERROR: Error writing to redis");
    }
  }

  public async get(key: string): Promise<string | null> {
    try {
      const value = await this.client.get(key);
      return value;
    } catch (err) {
      console.error("REDIS CONNECTION ERROR: Error reading from redis");
      return null;
    }
  }

  public async setMap(hash: string, object: Record<string, string | number>): Promise<void> {
    try {
      await this.client.hSet(hash, object);
    } catch (err) {
      console.error("REDIS CONNECTION ERROR: Error writing to redis");
    }
  }

  public async getMap(hash: string): Promise<Record<string, string>> {
    try {
      const value = await this.client.hGetAll(hash);
      return value;
    } catch (err) {
      console.error("REDIS CONNECTION ERROR: Error reading from redis");
      return {};
    }
  }
}

export default PassportCache;
