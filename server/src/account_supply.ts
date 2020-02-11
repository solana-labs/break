import { Account, Connection } from "@solana/web3.js";

const MIN_SUPPLY = 50;
const NUM_FUNDED_TRANSACTIONS = 1000;
const BATCH_SIZE = 10;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Provides pre-funded accounts for break game clients
export default class AccountSupply {
  private funded: Array<Account> = [];
  private fundAmount: number;
  private replenishing = false;

  constructor(
    private connection: Connection,
    public creationFee: number,
    public minAccountBalance: number
  ) {
    this.fundAmount =
      NUM_FUNDED_TRANSACTIONS * (creationFee + minAccountBalance);
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
              await sleep(1000);
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
