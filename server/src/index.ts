import express from "express";
import cors from "cors";
import path from "path";
import Program from "./program";
import { Connection, PublicKey } from "@solana/web3.js";
import { url, urlTls } from "./urls";
import AccountSupply from "./account_supply";

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function init(): Promise<{
  programId: PublicKey;
  accountSupply: AccountSupply;
}> {
  const connection = new Connection(url, "recent");
  const program = new Program(connection);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const programId = await program.load();
      const { feeCalculator } = await connection.getRecentBlockhash();
      const minAccountBalance = await connection.getMinimumBalanceForRentExemption(
        0
      );
      const accountSupply = new AccountSupply(
        connection,
        feeCalculator,
        minAccountBalance
      );
      return { programId, accountSupply };
    } catch (err) {
      console.error("Failed to initialize server", err);
      await sleep(1000);
      console.log("Retrying initialization");
    }
  }
}

(async function(): Promise<void> {
  const port = process.env.PORT || 8080;
  const app = express();
  app.use(cors());
  app.use(express.json()); // for parsing application/json

  const publicPath = process.env.PUBLIC_PATH || "public";
  const staticPath = path.join(__dirname, publicPath);
  app.use("/", express.static(staticPath));
  console.log(`Serving static files from: ${staticPath}`);

  const { programId, accountSupply } = await init();
  console.log("Program initialized");

  app.get("/init", async (req, res) => {
    const account = accountSupply.pop();
    const minAccountBalance = accountSupply.minAccountBalance;
    if (!account) {
      res.status(500).send("Account supply empty, try again");
      return;
    }

    res
      .send(
        JSON.stringify({
          programId: programId.toString(),
          accountKey: Buffer.from(account.secretKey).toString("hex"),
          minAccountBalance,
          rpcUrl: url,
          rpcUrlTls: urlTls
        })
      )
      .end();
  });

  /* final catch-all route to index.html defined last */
  app.get("/*", (req, res) => {
    res.sendFile(path.join(staticPath, "/index.html"));
  });

  app.listen(port);
  console.log(`Server listening on port: ${port}`);
})();
