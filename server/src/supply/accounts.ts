import { Account, Connection } from "@solana/web3.js";
import { sleep } from "../utils";

const SUPPLY_SIZE = 50;
const BATCH_SIZE = 10;

export const TX_PER_ACCOUNT =
  parseInt(process.env.TX_PER_ACCOUNT || "") || 1000;

export default class AccountSupply {
  private funded: Array<[Account, Date]> = [];
  private reserved: Array<[Account, Date]> = [];
  private replenishing = false;

  constructor(
    private name: string,
    private createAccount: () => Promise<Account>
  ) {
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

  private async replenish(): Promise<void> {
    if (this.replenishing) return;
    this.replenishing = true;

    while (this.funded.length < SUPPLY_SIZE) {
      const batchSize = Math.min(SUPPLY_SIZE - this.funded.length, BATCH_SIZE);
      const batch = await Promise.all(
        Array(batchSize)
          .fill(0)
          .map(async () => {
            try {
              return await this.createAccount();
            } catch (err) {
              console.error("Failed to replenish account supply", err);
              await sleep(1000);
              return undefined;
            }
          })
      );

      for (const account of batch) {
        const expiration = new Date();
        expiration.setDate(expiration.getDate() + 7);
        if (account) this.funded.push([account, expiration]);
      }

      console.log(`${this.name}: ${this.funded.length}`);
    }

    this.replenishing = false;
  }

  reserve(count: number): boolean {
    if (this.size() < count) return false;
    this.reserved = this.reserved.concat(this.funded.splice(0, count));
    return true;
  }

  unreserve(count: number): void {
    if (this.reserved.length < count) throw new Error("unable to unreserve");
    this.funded = this.funded.splice(0, count).concat(this.funded);
  }

  size(): number {
    const now = new Date();
    this.funded = this.funded.filter((next) => next[1] > now);
    return this.funded.length;
  }

  pop(count: number): Account[] {
    if (this.reserved.length < count) throw new Error("reserve depleted");
    const popped = this.reserved.splice(0, count);
    this.replenish();
    return popped.map(([account]) => account);
  }
}
