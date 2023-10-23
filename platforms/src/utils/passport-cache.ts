import { createClient } from "redis";
import type { RedisClientType } from "redis";

export class PassportCache {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL,
    });

    this.client.on("error", (err: any) => {
      console.error(`REDIS CONNECTION ERROR: ${String(err)}`);
    });
  }

  async init(): Promise<void> {
    await this.connect();
  }

  private async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (err: any) {
      console.error("REDIS CONNECTION ERROR: Error connecting to redis");
    }
  }

  public async set(key: string, value: string): Promise<void> {
    try {
      await this.client.set(key, value);
    } catch (err: any) {
      console.error(`REDIS CONNECTION ERROR: Error writing to redis ${String(err)}`);
    }
  }

  public async get(key: string): Promise<string | null> {
    try {
      const value = await this.client.get(key);
      return value;
    } catch (err: any) {
      console.error("REDIS CONNECTION ERROR: Error reading from redis");
      return null;
    }
  }

  public async setHash(key: string, field: string, value: string | null): Promise<void> {
    try {
      await this.client.hSet(key, field, value);
    } catch (err: any) {
      console.error(`REDIS CONNECTION ERROR: Error writing to redis ${String(err)}`);
    }
  }

  public async getHash(key: string): Promise<{ [k: string]: string } | null> {
    try {
      const value = await this.client.hGetAll(key);
      return value;
    } catch (err: any) {
      console.error("REDIS CONNECTION ERROR: Error reading from redis");
      return null;
    }
  }

  public async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (err: any) {
      console.error("REDIS CONNECTION ERROR: Error deleting redis entry");
      return null;
    }
  }

  public async setTimeOut(key: string, expiresInSeconds: number): Promise<void> {
    try {
      await this.client.expire(key, expiresInSeconds);
    } catch (err: any) {
      console.error("REDIS CONNECTION ERROR: Error setting timeout");
      return null;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
    } catch (err: any) {
      console.error("REDIS CONNECTION ERROR: Error closing redis connection");
      return null;
    }
  }
}
