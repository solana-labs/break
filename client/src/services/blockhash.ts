import { Blockhash, Connection } from "@solana/web3.js";

const BLOCKHASH_INTERVAL_MS = 30000;

export class BlockhashService {
  blockhash?: Blockhash;
  blockhashTimer?: number;
  starting = false;

  start = async (connection: Connection) => {
    if (this.starting || (this.blockhashTimer && this.blockhash)) return;
    this.starting = true;
    try {
      await this.refresh(connection);
      if (!this.blockhash) {
        throw new Error("Failed to start blockhash poller");
      }
      this.blockhashTimer = window.setInterval(
        () => this.refresh(connection),
        BLOCKHASH_INTERVAL_MS
      );
    } finally {
      this.starting = false;
    }
  };

  stop = () => {
    this.blockhash = undefined;
    clearInterval(this.blockhashTimer);
    this.blockhashTimer = undefined;
  };

  get current(): Blockhash {
    if (!this.blockhash) {
      throw new Error("No blockhash available");
    }

    return this.blockhash;
  }

  private refresh = async (connection: Connection) => {
    try {
      this.blockhash = (await connection.getRecentBlockhash()).blockhash;
    } catch (err) {
      this.blockhash = undefined;
      console.error("Failed to refresh blockhash", err);
    }
  };
}
