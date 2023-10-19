import { createClient } from "redis";
import type { RedisClientType } from "redis";

export class PassportCache {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL,
    });

    this.client.on("error", (err) => {
      console.error(`REDIS CONNECTION ERROR: ${String(err)}`);
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
}
