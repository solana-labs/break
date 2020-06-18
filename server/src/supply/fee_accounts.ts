import { Account, Connection, FeeCalculator } from "@solana/web3.js";
import AccountSupply, { TX_PER_ACCOUNT } from "./accounts";
import Faucet from "../faucet";

// Provides pre-funded accounts for break game clients
export default class FeeAccountSupply {
  constructor(private supply: AccountSupply, public accountCost: number) {}

  reserve(count: number): boolean {
    return this.supply.reserve(count);
  }

  unreserve(count: number): void {
    return this.supply.unreserve(count);
  }

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
