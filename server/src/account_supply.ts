import { Account, Connection, FeeCalculator, PublicKey } from "@solana/web3.js";

import Faucet from "./faucet";

export const TX_PER_ACCOUNT =
  parseInt(process.env.TX_PER_ACCOUNT || "") || 1000;
const SUPPLY_SIZE = 50;
const BATCH_SIZE = 10;
const TX_PER_BYTE = 8;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class AccountSupply {
  private funded: Array<[Account, Date]> = [];
  private replenishing = false;

  constructor(
    private name: string,
    private creator: (account: Account) => Promise<void>
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
    return rentPerEpoch * rentEpochsToCover;
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
            const account = new Account();
            try {
              await this.creator(account);
            } catch (err) {
              console.error("Failed to replenish account supply", err);
              await sleep(1000);
              return undefined;
            }
            return account;
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

  pop(): Account | undefined {
    let popped = this.funded.shift();

    const now = new Date();
    while (popped && popped[1] < now) {
      popped = this.funded.shift();
    }

    this.replenish();
    return popped && popped[0];
  }
}

// Provides pre-funded accounts for break game clients
export class PayerAccountSupply {
  constructor(private supply: AccountSupply) {}

  pop(): Account | undefined {
    return this.supply.pop();
  }

  static async create(
    connection: Connection,
    faucet: Faucet,
    feeCalculator: FeeCalculator
  ): Promise<PayerAccountSupply> {
    const rent = await AccountSupply.calculateRent(connection, 0);
    const signatureFee = feeCalculator.lamportsPerSignature;
    const fundAmount = TX_PER_ACCOUNT * (signatureFee + rent) + rent;
    const supply = new AccountSupply(
      "Payer Account Supply",
      (account: Account) => {
        return faucet.fundAccount(account.publicKey, fundAmount);
      }
    );
    return new PayerAccountSupply(supply);
  }
}

// Provides program accounts for break game clients
export class ProgramAccountSupply {
  constructor(private supply: AccountSupply, public accountSpace: number) {}

  pop(): Account | undefined {
    return this.supply.pop();
  }

  static async create(
    connection: Connection,
    faucet: Faucet,
    programId: PublicKey
  ): Promise<ProgramAccountSupply> {
    const space = Math.ceil(TX_PER_ACCOUNT / TX_PER_BYTE);
    const rent = await AccountSupply.calculateRent(connection, space);
    const supply = new AccountSupply(
      "Program Account Supply",
      (account: Account) => {
        return faucet.createProgramAccount(account, rent, programId, space);
      }
    );
    return new ProgramAccountSupply(supply, space);
  }
}
