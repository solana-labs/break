import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import WebSocket from "ws";

import ProgramLoader from "./program";
import {
  Connection,
  PublicKey,
  Account,
  sendAndConfirmTransaction,
  SystemProgram,
  FeeCalculator,
} from "@solana/web3.js";
import { cluster, url, urlTls } from "./urls";
import {
  FeeAccountSupply,
  ProgramDataAccountSupply,
  TX_PER_ACCOUNT,
} from "./account_supply";
import TpuProxy from "./tpu_proxy";
import Faucet from "./faucet";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class Server {
  private freeToPlay = process.env.FREE_TO_PLAY === "true";

  constructor(
    private faucet: Faucet,
    private connection: Connection,
    private feeCalculator: FeeCalculator,
    public programId: PublicKey,
    public feeAccountSupply: FeeAccountSupply,
    public programDataAccountSupply: ProgramDataAccountSupply
  ) {}

  calculateCost(split: number, includeFee: boolean): number {
    if (this.freeToPlay) return 0;
    const fee = includeFee ? this.feeCalculator.lamportsPerSignature : 0;
    return (
      fee +
      split *
        (this.programDataAccountSupply.accountCost +
          this.feeAccountSupply.accountCost)
    );
  }

  paymentGate(paymentKey: any): boolean {
    if (this.freeToPlay) return true;
    return typeof paymentKey === "string";
  }

  async collectPayment(paymentKey: any, split: number) {
    if (this.freeToPlay) return;

    const fromAccount = new Account(Buffer.from(paymentKey, "base64"));
    const fromPubkey = fromAccount.publicKey;
    const toPubkey = this.faucet.address();
    const lamports = this.calculateCost(split, false);
    const transfer = SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports,
    });

    await sendAndConfirmTransaction(this.connection, transfer, [fromAccount], {
      confirmations: 1,
      skipPreflight: true,
    });
  }

  static init = async (
    connection: Connection,
    tpuProxy: TpuProxy
  ): Promise<Server> => {
    const programLoader = new ProgramLoader(connection);
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const { feeCalculator } = await connection.getRecentBlockhash();
        const faucet = await Faucet.init(connection);
        console.log(
          `Airdrops ${faucet.airdropEnabled ? "enabled" : "disabled"}`
        );
        await tpuProxy.connect();
        const programId = await programLoader.load(faucet, feeCalculator);
        console.log("Program Loaded");
        const feeAccountSupply = await FeeAccountSupply.create(
          connection,
          faucet,
          feeCalculator
        );
        console.log("Fee Account Supply Created");
        const programDataAccountSupply = await ProgramDataAccountSupply.create(
          connection,
          faucet,
          feeCalculator,
          programId
        );
        console.log("Program Data Account Supply Created");
        return new Server(
          faucet,
          connection,
          feeCalculator,
          programId,
          feeAccountSupply,
          programDataAccountSupply
        );
      } catch (err) {
        console.error("Failed to initialize server", err);
        await sleep(1000);
        console.log("Retrying initialization");
      }
    }
  };
}

(async function (): Promise<void> {
  const app = express();
  app.use(cors());
  app.use(express.json()); // for parsing application/json

  const rootPath = path.join(__dirname, "..", "..");
  const staticPath = path.join(rootPath, "client", "build");
  app.use("/", express.static(staticPath));
  console.log(`Serving static files from: ${staticPath}`);

  const connection = new Connection(url, "recent");
  const tpuProxy = new TpuProxy(connection);
  console.log(`Connecting to cluster: ${url}`);
  const server = await Server.init(connection, tpuProxy);

  app.post("/accounts", async (req, res) => {
    const splitParam = parseInt(req.body["split"]);
    const paymentKey = req.body["paymentKey"];
    const split = isNaN(splitParam) ? 4 : Math.max(1, Math.min(32, splitParam));
    const feeAccountSupply = server.feeAccountSupply;
    const programDataAccountSupply = server.programDataAccountSupply;

    if (!server.paymentGate(paymentKey)) {
      res.status(400).send("Payment required");
      return;
    }

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

    try {
      await server.collectPayment(paymentKey, split);
    } catch (err) {
      res.status(400).send("Payment failed: " + err);
      return;
    }

    const programDataAccounts = programDataAccountSupply
      .pop(split)
      .map((account) => account.publicKey.toBase58());
    const accountKeys = feeAccountSupply.pop(split).map((account) => {
      return Buffer.from(account.secretKey).toString("base64");
    });

    res
      .send(
        JSON.stringify({
          programDataAccounts,
          accountKeys,
          accountCapacity: TX_PER_ACCOUNT,
        })
      )
      .end();
  });

  app.post("/init", async (req, res) => {
    const splitParam = parseInt(req.body["split"]);
    const split = isNaN(splitParam) ? 4 : Math.max(1, Math.min(32, splitParam));
    const programId = server.programId;

    if (!tpuProxy.connected()) {
      res.status(500).send("Tpu proxy reconnecting, try again");
      return;
    }

    if (!programId) {
      res.status(500).send("Server has not initialized, try again");
      return;
    }

    res
      .send(
        JSON.stringify({
          programId: programId.toString(),
          clusterUrl: urlTls,
          cluster,
          gameCost: server.calculateCost(split, true),
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
      wss.clients.forEach((client) => {
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
