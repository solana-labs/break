import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import WebSocket from "ws";

import Program from "./program";
import { Connection, PublicKey } from "@solana/web3.js";
import { url, urlTls } from "./urls";
import AccountSupply, { NUM_FUNDED_TRANSACTIONS } from "./account_supply";
import TpuProxy from "./tpu_proxy";
import Faucet from "./faucet";

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class Server {
  programId?: PublicKey;
  accountSupply?: AccountSupply;

  init = async (connection: Connection, tpuProxy: TpuProxy): Promise<void> => {
    const program = new Program(connection);
    let programId, accountSupply;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const { feeCalculator } = await connection.getRecentBlockhash();
        const faucet = new Faucet(connection, feeCalculator);
        accountSupply = await AccountSupply.create(
          connection,
          faucet,
          feeCalculator
        );
        console.log("Account Supply Created");
        await tpuProxy.connect();
        programId = await program.load(faucet, feeCalculator);
        console.log("Program Loaded");
        break;
      } catch (err) {
        console.error("Failed to initialize server", err);
        await sleep(1000);
        console.log("Retrying initialization");
      }
    }

    this.programId = programId;
    this.accountSupply = accountSupply;
  };
}

(async function(): Promise<void> {
  const app = express();
  app.use(cors());
  app.use(express.json()); // for parsing application/json

  const publicPath = process.env.PUBLIC_PATH || "public";
  const staticPath = path.join(__dirname, publicPath);
  app.use("/", express.static(staticPath));
  console.log(`Serving static files from: ${staticPath}`);

  const connection = new Connection(url, "recent");
  const tpuProxy = new TpuProxy(connection);
  const server = new Server();
  console.log(`Connecting to cluster: ${url}`);
  server.init(connection, tpuProxy);

  app.get("/init", async (req, res) => {
    const programId = server.programId;
    const accountSupply = server.accountSupply;

    if (!tpuProxy.connected()) {
      res.status(500).send("Tpu proxy reconnecting, try again");
      return;
    }

    if (!programId || !accountSupply) {
      res.status(500).send("Server has not initialized, try again");
      return;
    }

    const account = accountSupply.pop();
    if (!account) {
      res.status(500).send("Account supply empty, try again");
      return;
    }

    res
      .send(
        JSON.stringify({
          programId: programId.toString(),
          accountKey: Buffer.from(account.secretKey).toString("hex"),
          accountCapacity: NUM_FUNDED_TRANSACTIONS,
          minAccountBalance: accountSupply.minAccountBalance,
          creationFee: accountSupply.creationFee,
          rpcUrl: urlTls
        })
      )
      .end();
  });

  /* final catch-all route to index.html defined last */
  app.get("/*", (req, res) => {
    res.sendFile(path.join(staticPath, "/index.html"));
  });

  const httpServer = http.createServer(app);

  // Start websocket server
  const wss = new WebSocket.Server({ server: httpServer });
  wss.on("connection", function connection(ws) {
    ws.on("message", tpuProxy.onTransaction);
  });

  const port = process.env.PORT || 8080;
  httpServer.listen(port);
  console.log(`Server listening on port: ${port}`);
})();
