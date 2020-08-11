import { Account, Connection } from "@solana/web3.js";
import { sleep } from "../utils";
import { promisify } from "util";
import Redis from "redis";

const SUPPLY_SIZE = 50;
const BATCH_SIZE = 4;

export const TX_PER_ACCOUNT =
  parseInt(process.env.TX_PER_ACCOUNT || "") || 1000;

export default class AccountSupply {
  private client?: Redis.RedisClient;
  private funded: Array<[Account, Date]> = [];
  private reserved: Array<[Account, Date]> = [];
  private replenishing = false;

  constructor(
    private name: string,
    private faucetAccount: Account,
    private createAccount: (fromAccount: Account) => Promise<Account>
  ) {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      console.log(this.name, "Connecting to", redisUrl);
      this.client = Redis.createClient({ url: redisUrl });
    }
    this.replenish();
  }

  static async calculateRent(
    connection: Connection,
    space: number
  ): Promise<number> {
    const rentExemptBalance = await connection.getMinimumBalanceForRentExemption(
      space
    );
    const { slotsPerEpoch } = await connection.getEpochSchedule();
    const slotsPerSecond = 2.5;
    const slotsPerYear = 365.25 * 24.0 * 60.0 * 60.0 * slotsPerSecond;
    const epochsPerYear = slotsPerYear / slotsPerEpoch;
    const epochsPerWeek = epochsPerYear / (365.25 / 7);
    const paddingMultiplier = 2.0;
    const rentPerEpoch = Math.round(
      (paddingMultiplier * rentExemptBalance) / (2.0 * epochsPerYear)
    );
    const rentEpochsToCover = Math.max(epochsPerWeek, 2);
    return Math.ceil(rentPerEpoch * rentEpochsToCover);
  }

  async pushAccount([account, expiration]: [Account, Date]): Promise<void> {
    if (this.client) {
      const key = Buffer.from(account.secretKey).toString("base64");
      const expiry = expiration.getTime();
      const value = JSON.stringify({ key, expiry });
      await promisify(this.client.rpush).bind(this.client, this.name, value)();
    } else {
      this.funded.push([account, expiration]);
    }
  }

  async popAccount(): Promise<[Account, Date] | undefined> {
    if (this.client) {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const value = await promisify(this.client.lpop).bind(
          this.client,
          this.name
        )();
        if (value === null) return undefined;
        const { key, expiry } = JSON.parse(value);
        if (expiry < Date.now()) continue;
        const account = new Account(Buffer.from(key, "base64"));
        return [account, new Date(expiry)];
      }
    } else {
      const next = this.funded.shift();
      if (next) {
        const [account, expiration] = next;
        if (expiration >= new Date()) return [account, expiration];
      }
    }
  }

  async size(): Promise<number> {
    if (this.client) {
      return await promisify(this.client.llen).bind(this.client, this.name)();
    } else {
      return this.funded.length;
    }
  }

  private async replenish(): Promise<void> {
    if (this.replenishing) return;
    this.replenishing = true;

    let size = await this.size();
    while (size < SUPPLY_SIZE) {
      const batchSize = Math.min(SUPPLY_SIZE - size, BATCH_SIZE);
      const batch = await this.createBatch(this.faucetAccount, batchSize);

      const incomplete = batch.length < batchSize;
      for (const account of batch) {
        const expiration = new Date();
        expiration.setDate(expiration.getDate() + 7);
        await this.pushAccount([account, expiration]);
      }

      size = await this.size();
      console.log(`${this.name}: ${size}`);
      if (incomplete) await sleep(1000);
    }

    this.replenishing = false;
  }

  async createBatch(
    fromAccount: Account,
    count: number
  ): Promise<Array<Account>> {
    const batch = [];
    const accounts = await Promise.all(
      Array(count)
        .fill(0)
        .map(async () => {
          try {
            return await this.createAccount(fromAccount);
          } catch (err) {
            console.error("Failed to replenish account supply", err);
            return undefined;
          }
        })
    );

    for (const account of accounts) {
      if (account !== undefined) batch.push(account);
    }

    return batch;
  }

  async reserve(count: number): Promise<boolean> {
    const reserved = [];
    for (let i = 0; i < count; i++) {
      const next = await this.popAccount();
      if (!next) break;
      reserved.push(next);
    }

    if (reserved.length < count) {
      for (const account of reserved) {
        await this.pushAccount(account);
      }
      return false;
    } else {
      this.reserved = this.reserved.concat(reserved);
      return true;
    }
  }

  async unreserve(count: number): Promise<void> {
    if (this.reserved.length < count) throw new Error("unable to unreserve");
    const unreserved = this.reserved.splice(0, count);
    for (const account of unreserved) {
      await this.pushAccount(account);
    }
  }

  pop(count: number): Account[] {
    if (this.reserved.length < count) throw new Error("reserve depleted");
    const popped = this.reserved.splice(0, count);
    this.replenish();
    return popped.map(([account]) => account);
  }
}
