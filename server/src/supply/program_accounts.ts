import { Account, Connection, FeeCalculator, PublicKey } from "@solana/web3.js";
import Faucet from "../faucet";
import AccountSupply, { TX_PER_ACCOUNT } from "./accounts";

const TX_PER_BYTE = 8;

// Provides program state accounts for break game clients
export default class ProgramAccountSupply {
  constructor(
    private supply: AccountSupply,
    public accountSpace: number,
    public accountCost: number
  ) {}

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
    feeCalculator: FeeCalculator,
    programId: PublicKey
  ): Promise<ProgramAccountSupply> {
    const space = Math.ceil(TX_PER_ACCOUNT / TX_PER_BYTE);
    const rent = await AccountSupply.calculateRent(connection, space);
    const supply = new AccountSupply("Program Data Account Supply", () =>
      faucet.createProgramDataAccount(rent, programId, space)
    );
    const signatureFee = feeCalculator.lamportsPerSignature;
    const cost = rent + 2 * signatureFee;
    return new ProgramAccountSupply(supply, space, cost);
  }
}
