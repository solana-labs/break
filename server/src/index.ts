import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import WebSocket from "ws";

import Program from "./program";
import { Connection, PublicKey } from "@solana/web3.js";
import { cluster, url, urlTls } from "./urls";
import {
  PayerAccountSupply,
  ProgramAccountSupply,
  TX_PER_ACCOUNT
} from "./account_supply";
import TpuProxy from "./tpu_proxy";
import Faucet from "./faucet";

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class Server {
  programId?: PublicKey;
  payerAccountSupply?: PayerAccountSupply;
  programAccountSupply?: ProgramAccountSupply;

  init = async (connection: Connection, tpuProxy: TpuProxy): Promise<void> => {
    const program = new Program(connection);
    let programId, payerAccountSupply, programAccountSupply;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const { feeCalculator } = await connection.getRecentBlockhash();
        const faucet = await Faucet.init(connection);
        console.log(
          `Airdrops ${faucet.airdropEnabled ? "enabled" : "disabled"}`
        );
        await tpuProxy.connect();
        programId = await program.load(faucet, feeCalculator);
        console.log("Program Loaded");
        payerAccountSupply = await PayerAccountSupply.create(
          connection,
          faucet,
          feeCalculator
        );
        console.log("Payer Account Supply Created");
        programAccountSupply = await ProgramAccountSupply.create(
          connection,
          faucet,
          programId
        );
        console.log("Program Account Supply Created");
        break;
      } catch (err) {
        console.error("Failed to initialize server", err);
        await sleep(1000);
        console.log("Retrying initialization");
      }
    }

    this.programId = programId;
    this.payerAccountSupply = payerAccountSupply;
    this.programAccountSupply = programAccountSupply;
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
    const payerAccountSupply = server.payerAccountSupply;
    const programAccountSupply = server.programAccountSupply;

    if (!payerAccountSupply || !programAccountSupply) {
      res.status(500).send("Server has not initialized, try again");
      return;
    }

    const payerAccount = payerAccountSupply.pop();
    if (!payerAccount) {
      res.status(500).send("Payer account supply empty, try again");
      return;
    }

    const programAccount = programAccountSupply.pop();
    if (!programAccount) {
      res.status(500).send("Program account supply empty, try again");
      return;
    }

    res
      .send(
        JSON.stringify({
          programAccount: programAccount.publicKey.toString(),
          programAccountSpace: programAccountSupply.accountSpace,
          accountKey: Buffer.from(payerAccount.secretKey).toString("hex"),
          accountCapacity: TX_PER_ACCOUNT
        })
      )
      .end();
  });

  app.get("/init", async (req, res) => {
    const programId = server.programId;
    const payerAccountSupply = server.payerAccountSupply;
    const programAccountSupply = server.programAccountSupply;

    if (!tpuProxy.connected()) {
      res.status(500).send("Tpu proxy reconnecting, try again");
      return;
    }

    if (!programId || !payerAccountSupply || !programAccountSupply) {
      res.status(500).send("Server has not initialized, try again");
      return;
    }

    const payerAccount = payerAccountSupply.pop();
    if (!payerAccount) {
      res.status(500).send("Payer account supply empty, try again");
      return;
    }

    const programAccount = programAccountSupply.pop();
    if (!programAccount) {
      res.status(500).send("Program account supply empty, try again");
      return;
    }

    res
      .send(
        JSON.stringify({
          programId: programId.toString(),
          programAccount: programAccount.publicKey.toString(),
          programAccountSpace: programAccountSupply.accountSpace,
          accountKey: Buffer.from(payerAccount.secretKey).toString("hex"),
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
