import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import WebSocket from "ws";

import Program from "./program";
import { Connection, PublicKey } from "@solana/web3.js";
import { url, urlTls } from "./urls";
import AccountSupply from "./account_supply";
import TpuProxy from "./tpu_proxy";

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function init(): Promise<{
  programId: PublicKey;
  accountSupply: AccountSupply;
  tpuProxy: TpuProxy;
}> {
  const connection = new Connection(url, "recent");
  const program = new Program(connection);
  const tpuProxy = new TpuProxy(connection);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await tpuProxy.connect();
      const programId = await program.load();
      console.log("Program Loaded");
      const { feeCalculator } = await connection.getRecentBlockhash();
      const minAccountBalance = await connection.getMinimumBalanceForRentExemption(
        0
      );
      const creationFee = feeCalculator.lamportsPerSignature;
      const accountSupply = new AccountSupply(
        connection,
        creationFee,
        minAccountBalance
      );
      return { programId, accountSupply, tpuProxy };
    } catch (err) {
      console.error("Failed to initialize server", err);
      await sleep(1000);
      console.log("Retrying initialization");
    }
  }
}

(async function(): Promise<void> {
  const app = express();
  app.use(cors());
  app.use(express.json()); // for parsing application/json

  const publicPath = process.env.PUBLIC_PATH || "public";
  const staticPath = path.join(__dirname, publicPath);
  app.use("/", express.static(staticPath));
  console.log(`Serving static files from: ${staticPath}`);

  const { programId, accountSupply, tpuProxy } = await init();
  console.log("Server initialized");

  app.get("/init", async (req, res) => {
    const account = accountSupply.pop();
    if (!account) {
      res.status(500).send("Account supply empty, try again");
      return;
    }
    if (tpuProxy.connecting) {
      res.status(500).send("Tpu proxy reconnecting, try again");
      return;
    }

    res
      .send(
        JSON.stringify({
          programId: programId.toString(),
          accountKey: Buffer.from(account.secretKey).toString("hex"),
          minAccountBalance: accountSupply.minAccountBalance,
          creationFee: accountSupply.creationFee,
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

  const server = http.createServer(app);

  // Start websocket server
  const wss = new WebSocket.Server({ server });
  wss.on("connection", function connection(ws) {
    ws.on("message", tpuProxy.onTransaction);
  });

  const port = process.env.PORT || 8080;
  server.listen(port);
  console.log(`Server listening on port: ${port}`);
})();
