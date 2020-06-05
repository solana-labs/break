import { Account, Connection, FeeCalculator, PublicKey } from "@solana/web3.js";

import Faucet from "./faucet";

export const TX_PER_ACCOUNT =
  parseInt(process.env.TX_PER_ACCOUNT || "") || 1000;
const SUPPLY_SIZE = 50;
const BATCH_SIZE = 10;
const TX_PER_BYTE = 8;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class AccountSupply {
  private funded: Array<[Account, Date]> = [];
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

  size(): number {
    const now = new Date();
    this.funded = this.funded.filter((next) => next[1] > now);
    return this.funded.length;
  }

  pop(count: number): Account[] {
    if (this.size() < count) throw new Error("supply depleted");
    const popped = this.funded.splice(0, count);
    this.replenish();
    return popped.map(([account]) => account);
  }
}

// Provides pre-funded accounts for break game clients
export class FeeAccountSupply {
  constructor(private supply: AccountSupply, public accountCost: number) {}

  pop(count: number): Account[] {
    return this.supply.pop(count);
  }

  size(): number {
    return this.supply.size();
  }

  static async create(
    connection: Connection,
    faucet: Faucet,
    feeCalculator: FeeCalculator
  ): Promise<FeeAccountSupply> {
    const rent = await AccountSupply.calculateRent(connection, 0);
    const signatureFee = feeCalculator.lamportsPerSignature;
    const fundAmount = TX_PER_ACCOUNT * (signatureFee + rent) + rent;
    const supply = new AccountSupply("Fee Account Supply", async () => {
      const account = new Account();
      await faucet.fundAccount(account.publicKey, fundAmount);
      return account;
    });
    const cost = fundAmount + signatureFee;
    return new FeeAccountSupply(supply, cost);
  }
}

// Provides program data accounts for break game clients
export class ProgramDataAccountSupply {
  constructor(
    private supply: AccountSupply,
    public accountSpace: number,
    public accountCost: number
  ) {}

  pop(count: number): Account[] {
    return this.supply.pop(count);
  }

  size(): number {
    return this.supply.size();
  }

  static async create(
    connection: Connection,
    faucet: Faucet,
    feeCalculator: FeeCalculator,
    programId: PublicKey
  ): Promise<ProgramDataAccountSupply> {
    const space = Math.ceil(TX_PER_ACCOUNT / TX_PER_BYTE);
    const rent = await AccountSupply.calculateRent(connection, space);
    const supply = new AccountSupply("Program Data Account Supply", () =>
      faucet.createProgramDataAccount(rent, programId, space)
    );
    const signatureFee = feeCalculator.lamportsPerSignature;
    const cost = rent + 2 * signatureFee;
    return new ProgramDataAccountSupply(supply, space, cost);
  }
}
