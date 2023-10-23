/* eslint-disable jest/no-export */
// InMemoryRedisClient.ts
type Expirations = { [key: string]: number };
type Store = { [key: string]: any };

export class InMemoryRedisClient {
  private store: Store;
  private expirations: Expirations;
  private timer: NodeJS.Timeout;

  constructor() {
    this.store = {}; // In-memory data store
    this.expirations = {}; // Keys' expiration time in milliseconds
  }

  async connect(): Promise<void> {
    return Promise.resolve();
  }

  async set(key: string, value: any): Promise<string> {
    this.store[key] = value;
    return Promise.resolve("OK");
  }

  async get(key: string): Promise<any | null> {
    return Promise.resolve(this.store[key] || null);
  }

  async hSet(key: string, field: string, value: any): Promise<string> {
    if (!this.store[key]) {
      this.store[key] = {};
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    this.store[key][field] = value;
    return Promise.resolve("OK");
  }

  hGetAll(key: string): Promise<any> {
    return Promise.resolve(this.store[key] || null);
  }

  async del(key: string): Promise<number> {
    delete this.store[key];
    return Promise.resolve(1);
  }

  async expire(key: string, seconds: number): Promise<number> {
    this.expirations[key] = Date.now() + seconds * 1000;
    return Promise.resolve(1);
  }

  private async expireKeys(): Promise<void> {
    const now = Date.now();
    for (const [key, expiration] of Object.entries(this.expirations)) {
      if (now > expiration) {
        await this.del(key);
        delete this.expirations[key];
      }
    }
  }

  // Add an event emitter simulation for the "error" event
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/ban-types
  on(eventName: string, callback: Function): void {
    if (eventName === "error") {
      // Handle how you want to trigger errors. For this example, no errors are triggered.
    }
  }
}

export const createClient = (): InMemoryRedisClient => new InMemoryRedisClient();

// TODO: remove
describe("mock redis", () => {
  it("should mock redis", () => {
    expect(true).toBe(true);
  });
});
