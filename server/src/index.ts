import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import WebSocket from "ws";

import ProgramLoader from "./program";
import { Connection, PublicKey, Account } from "@solana/web3.js";
import { cluster, url, urlTls } from "./urls";
import {
  FeeAccountSupply,
  ProgramDataAccountSupply,
  TX_PER_ACCOUNT
} from "./account_supply";
import TpuProxy from "./tpu_proxy";
import Faucet from "./faucet";

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class Server {
  programId?: PublicKey;
  feeAccountSupply?: FeeAccountSupply;
  programDataAccountSupply?: ProgramDataAccountSupply;

  init = async (connection: Connection, tpuProxy: TpuProxy): Promise<void> => {
    const programLoader = new ProgramLoader(connection);
    let programId, feeAccountSupply, programDataAccountSupply;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const { feeCalculator } = await connection.getRecentBlockhash();
        const faucet = await Faucet.init(connection);
        console.log(
          `Airdrops ${faucet.airdropEnabled ? "enabled" : "disabled"}`
        );
        await tpuProxy.connect();
        programId = await programLoader.load(faucet, feeCalculator);
        console.log("Program Loaded");
        feeAccountSupply = await FeeAccountSupply.create(
          connection,
          faucet,
          feeCalculator
        );
        console.log("Fee Account Supply Created");
        programDataAccountSupply = await ProgramDataAccountSupply.create(
          connection,
          faucet,
          programId
        );
        console.log("Program Data Account Supply Created");
        break;
      } catch (err) {
        console.error("Failed to initialize server", err);
        await sleep(1000);
        console.log("Retrying initialization");
      }
    }

    this.programId = programId;
    this.feeAccountSupply = feeAccountSupply;
    this.programDataAccountSupply = programDataAccountSupply;
  };
}

(async function(): Promise<void> {
  const app = express();
  app.use(cors());
  app.use(express.json()); // for parsing application/json

  const rootPath = path.join(__dirname, "..", "..");
  const staticPath = path.join(rootPath, "client", "build");
  app.use("/", express.static(staticPath));
  console.log(`Serving static files from: ${staticPath}`);

  const connection = new Connection(url, "recent");
  const tpuProxy = new TpuProxy(connection);
  const server = new Server();
  console.log(`Connecting to cluster: ${url}`);
  server.init(connection, tpuProxy);

  app.get("/refresh", async (req, res) => {
    const splitParam = parseInt(req.query["split"]);
    const split = isNaN(splitParam) ? 4 : Math.max(1, Math.min(32, splitParam));
    const feeAccountSupply = server.feeAccountSupply;
    const programDataAccountSupply = server.programDataAccountSupply;

    if (!feeAccountSupply || !programDataAccountSupply) {
      res.status(500).send("Server has not initialized, try again");
      return;
    }

    if (
      feeAccountSupply.size() < split ||
      programDataAccountSupply.size() < split
    ) {
      res.status(500).send("Account supply depleted, try again");
      return;
    }

    const programDataAccounts = programDataAccountSupply
      .pop(split)
      .map(account => account.publicKey.toBase58());
    const accountKeys = feeAccountSupply.pop(split).map(account => {
      return Buffer.from(account.secretKey).toString("hex");
    });

    res
      .send(
        JSON.stringify({
          programDataAccounts,
          programDataAccountSpace: programDataAccountSupply.accountSpace,
          accountKeys,
          accountCapacity: TX_PER_ACCOUNT
        })
      )
      .end();
  });

  app.get("/init", async (req, res) => {
    const splitParam = parseInt(req.query["split"]);
    const split = isNaN(splitParam) ? 4 : Math.max(1, Math.min(50, splitParam));
    const programId = server.programId;
    const feeAccountSupply = server.feeAccountSupply;
    const programDataAccountSupply = server.programDataAccountSupply;

    if (!tpuProxy.connected()) {
      res.status(500).send("Tpu proxy reconnecting, try again");
      return;
    }

    if (!programId || !feeAccountSupply || !programDataAccountSupply) {
      res.status(500).send("Server has not initialized, try again");
      return;
    }

    if (
      feeAccountSupply.size() < split ||
      programDataAccountSupply.size() < split
    ) {
      res.status(500).send("Account supply depleted, try again");
      return;
    }

    const programDataAccounts = programDataAccountSupply
      .pop(split)
      .map(account => account.publicKey.toBase58());
    const accountKeys = feeAccountSupply.pop(split).map(account => {
      return Buffer.from(account.secretKey).toString("hex");
    });

    res
      .send(
        JSON.stringify({
          programId: programId.toString(),
          programDataAccounts,
          programDataAccountSpace: programDataAccountSupply.accountSpace,
          accountKeys,
          accountCapacity: TX_PER_ACCOUNT,
          clusterUrl: urlTls,
          cluster
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
  let activeClients = 0;
  let lastNotifiedCount = 0;
  const wss = new WebSocket.Server({ server: httpServer });
  wss.on("connection", function connection(ws) {
    activeClients++;
    ws.on("close", () => activeClients--);
    ws.on("message", tpuProxy.onTransaction);
  });

  // Start active user broadcast loop
  setInterval(() => {
    if (activeClients !== lastNotifiedCount) {
      lastNotifiedCount = activeClients;
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ activeUsers: activeClients }));
        }
      });
    }
  }, 1000);

  const port = process.env.PORT || 8080;
  httpServer.listen(port);
  console.log(`Server listening on port: ${port}`);
})();
