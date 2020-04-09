import { Account, Connection, FeeCalculator, PublicKey } from "@solana/web3.js";

import Faucet from "./faucet";

export const TX_PER_PAYER = parseInt(process.env.TX_PER_PAYER || "") || 1000;
const SUPPLY_SIZE = 50;
const BATCH_SIZE = 10;
const TX_PER_BYTE = 8;
const TPS_PER_ACCOUNT = 50;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class AccountSupply {
  private funded: Array<Account> = [];
  private replenishing = false;

  constructor(
    private name: string,
    private creator: (account: Account) => Promise<void>
  ) {
    this.replenish();
  }

  static async minBalance(
    connection: Connection,
    space: number
  ): Promise<number> {
    const rentExemptBalance = await connection.getMinimumBalanceForRentExemption(
      space
    );
    const { slotsPerEpoch } = await connection.getEpochSchedule();
    const slotsPerSecond = 0.4;
    const slotsPerYear = (365.25 * 24.0 * 60.0 * 60.0) / slotsPerSecond;
    const epochsPerYear = slotsPerYear / slotsPerEpoch;
    const paddingMultiplier = 2.0;
    const minBalanceForOneEpoch = rentExemptBalance / (2.0 * epochsPerYear);
    return 2 * Math.round(paddingMultiplier * minBalanceForOneEpoch);
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
        if (account) this.funded.push(account);
      }

      console.log(`${this.name}: ${this.funded.length}`);
    }

    this.replenishing = false;
  }

  pop(): Account | undefined {
    const popped = this.funded.shift();
    this.replenish();
    return popped;
  }
}

// Provides pre-funded accounts for break game clients
export class PayerAccountSupply {
  constructor(
    private supply: AccountSupply,
    public signatureFee: number,
    public minBalance: number
  ) {}

  pop(): Account | undefined {
    return this.supply.pop();
  }

  static async create(
    connection: Connection,
    faucet: Faucet,
    feeCalculator: FeeCalculator
  ): Promise<PayerAccountSupply> {
    const minBalance = await AccountSupply.minBalance(connection, 0);
    const signatureFee = feeCalculator.lamportsPerSignature;
    const fundAmount = TX_PER_PAYER * (signatureFee + minBalance);
    const supply = new AccountSupply(
      "Payer Account Supply",
      (account: Account) => {
        return faucet.fundAccount(account.publicKey, fundAmount);
      }
    );
    return new PayerAccountSupply(supply, signatureFee, minBalance);
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
    const space = Math.ceil(TPS_PER_ACCOUNT / TX_PER_BYTE);
    const minBalance = await AccountSupply.minBalance(connection, space);
    const supply = new AccountSupply(
      "Program Account Supply",
      (account: Account) => {
        return faucet.createProgramAccount(
          account,
          minBalance,
          programId,
          space
        );
      }
    );
    return new ProgramAccountSupply(supply, space);
  }
}
