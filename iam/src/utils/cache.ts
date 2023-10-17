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
      // Send pd alert
    }
  }

  public async set(key: string, value: string): Promise<void> {
    try {
      await this.client.set(key, value);
    } catch (err) {
      // Send pd alert
    }
  }

  public async get(key: string): Promise<string | null> {
    try {
      const value = await this.client.get(key);
      return value;
    } catch (err) {
      // Send pd alert
      return null;
    }
  }

  public async setMap(hash: string, object: Record<string, string | number>): Promise<void> {
    try {
      await this.client.hSet(hash, object);
    } catch (err) {
      // Send pd alert
    }
  }

  public async getMap(hash: string): Promise<Record<string, string>> {
    try {
      const value = await this.client.hGetAll(hash);
      return value;
    } catch (err) {
      // Send pd alert
      return {};
    }
  }
}

export default PassportCache;
