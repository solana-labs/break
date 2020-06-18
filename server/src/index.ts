import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import WebSocket from "ws";

import { Connection } from "@solana/web3.js";
import { cluster, url, urlTls } from "./urls";
import ProgramLoader from "./program";
import Faucet from "./faucet";
import TpuProxy from "./tpu_proxy";
import Supply from "./supply";
import { sleep } from "./utils";

const app = express();
app.use(cors());
app.use(express.json()); // for parsing application/json

const rootPath = path.join(__dirname, "..", "..");
const staticPath = path.join(rootPath, "client", "build");
console.log(`Serving static files from: ${staticPath}`);
app.use("/", express.static(staticPath));
app.get("/*", (req, res) => {
  res.sendFile(path.join(staticPath, "/index.html"));
});

const connection = new Connection(url, "recent");
const tpuProxy = new TpuProxy(connection);

(async function (): Promise<void> {
  let feeCalculator;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      console.log(`Connecting to cluster: ${url}`);
      feeCalculator = (await connection.getRecentBlockhash()).feeCalculator;
      console.log(`Connected to cluster: ${url}`);
      break;
    } catch (err) {
      console.log(`Failed to connect to cluster: ${url}`);
      await sleep(1000);
    }
  }

  const faucet = await Faucet.init(connection);
  const programId = await ProgramLoader.load(connection, faucet, feeCalculator);
  const supply = await Supply.init(
    connection,
    faucet,
    feeCalculator,
    programId
  );
  await tpuProxy.connect();

  app.post("/accounts", async (req, res) => {
    const splitParam = parseInt(req.body["split"]);
    const paymentKey = req.body["paymentKey"];
    const split = isNaN(splitParam) ? 4 : Math.max(1, Math.min(10, splitParam));

    if (!faucet.free && !paymentKey) {
      res.status(400).send("Payment required");
      return;
    }

    if (supply.isDepleted(split)) {
      res.status(500).send("Account supply depleted, try again");
      return;
    }

    if (!faucet.free) {
      try {
        await faucet.collectPayment(paymentKey, split);
      } catch (err) {
        res.status(400).send("Payment failed: " + err);
        return;
      }
    }

    const { programAccountAddresses, feeAccountKeys } = supply.consumeAccounts(
      split
    );
    res
      .send(
        JSON.stringify({
          programAccounts: programAccountAddresses,
          feeAccounts: feeAccountKeys,
          accountCapacity: supply.accountCapacity(),
        })
      )
      .end();
  });

  app.post("/init", async (req, res) => {
    const splitParam = parseInt(req.body["split"]);
    const split = isNaN(splitParam) ? 4 : Math.max(1, Math.min(32, splitParam));

    res
      .send(
        JSON.stringify({
          programId: programId.toString(),
          clusterUrl: urlTls,
          cluster,
          gameCost: supply.calculateCost(split, true),
          paymentRequired: !faucet.free,
        })
      )
      .end();
  });
})();

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
