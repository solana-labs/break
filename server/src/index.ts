import express from "express";
import cors from "cors";
import path from "path";
import Program from "./program";
import { Connection } from "@solana/web3.js";
import { url } from "./urls";
import AccountSupply from "./account_supply";

(async function(): Promise<void> {
  const port = process.env.PORT || 8080;
  const app = express();
  app.use(cors());
  app.use(express.json()); // for parsing application/json

  const publicPath = process.env.PUBLIC_PATH || "public";
  const staticPath = path.join(__dirname, publicPath);
  app.use("/", express.static(staticPath));
  console.log(`Serving static files from: ${staticPath}`);

  const connection = new Connection(url, "recent");
  const { feeCalculator } = await connection.getRecentBlockhash();
  const program = new Program(connection);
  const programId = await program.load();
  const accountSupply = new AccountSupply(connection, feeCalculator);

  app.get("/init", async (req, res) => {
    const account = accountSupply.pop();
    if (!account) {
      res.status(500).send("Account supply empty, try again");
      return;
    }

    res
      .send(
        JSON.stringify({
          programId: programId.toString(),
          accountKey: Buffer.from(account.secretKey).toString("hex")
        })
      )
      .end();
  });

  app.listen(port);
  console.log(`Server listening on port: ${port}`);
})();
