import { Account, Connection, FeeCalculator } from "@solana/web3.js";

const MIN_SUPPLY = 100;
const NUM_FUNDED_TRANSACTIONS = 1000;
const BATCH_SIZE = 10;

// Provides pre-funded accounts for break game clients
export default class AccountSupply {
  private funded: Array<Account> = [];
  private fundAmount: number;
  private replenishing = false;

  constructor(private connection: Connection, feeCalculator: FeeCalculator) {
    this.fundAmount =
      NUM_FUNDED_TRANSACTIONS * feeCalculator.maxLamportsPerSignature;
    this.replenish();
  }

  private async replenish(): Promise<void> {
    if (this.replenishing) return;
    this.replenishing = true;

    while (this.funded.length < MIN_SUPPLY) {
      const batchSize = Math.min(MIN_SUPPLY - this.funded.length, BATCH_SIZE);
      const batch = await Promise.all(
        Array(batchSize)
          .fill(0)
          .map(async () => {
            const account = new Account();
            try {
              await this.connection.requestAirdrop(
                account.publicKey,
                this.fundAmount
              );
            } catch (err) {
              console.error("Failed to replenish account supply", err);
              return undefined;
            }
            return account;
          })
      );

      for (const account of batch) {
        if (account) this.funded.push(account);
      }

      console.log(`Current funding supply: ${this.funded.length}`);
    }

    this.replenishing = false;
  }

  pop(): Account | undefined {
    const popped = this.funded.pop();
    this.replenish();
    return popped;
  }
}
