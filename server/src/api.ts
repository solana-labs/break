import { Connection, FeeCalculator } from "@solana/web3.js";
import { cluster, url, urlTls } from "./urls";
import ProgramLoader from "./program";
import Faucet from "./faucet";
import TpuProxy from "./tpu_proxy";
import Supply from "./supply";
import { sleep } from "./utils";
import WebSocketServer from "./websocket";
import { Express } from "express";
import http from "http";

export default class ApiServer {
  private static async getFeeCalculator(
    connection: Connection
  ): Promise<FeeCalculator> {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        console.log(`Connecting to cluster: ${url}`);
        const feeCalculator = (await connection.getRecentBlockhash())
          .feeCalculator;
        console.log(`Connected to cluster: ${url}`);
        return feeCalculator;
      } catch (err) {
        console.log(`Failed to connect to cluster: ${url}`);
        await sleep(1000);
      }
    }
  }

  static async start(app: Express, httpServer: http.Server): Promise<void> {
    const connection = new Connection(url, "recent");
    const tpuProxy = new TpuProxy(connection);
    WebSocketServer.start(httpServer, tpuProxy);

    const feeCalculator = await ApiServer.getFeeCalculator(connection);
    const faucet = await Faucet.init(connection);
    const programId = await ProgramLoader.load(
      connection,
      faucet,
      feeCalculator
    );
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
      const split = isNaN(splitParam)
        ? 4
        : Math.max(1, Math.min(10, splitParam));

      if (!faucet.free && !paymentKey) {
        res.status(400).send("Payment required");
        return;
      }

      if (!supply.reserveAccounts(split)) {
        res.status(500).send("Account supply depleted, try again");
        return;
      }

      if (!faucet.free) {
        try {
          await faucet.collectPayment(paymentKey, split);
        } catch (err) {
          res.status(400).send("Payment failed: " + err);
          supply.unreserveAccounts(split);
          return;
        }
      }

      const { programAccounts, feeAccounts } = supply.popAccounts(split);

      res
        .send(
          JSON.stringify({
            programAccounts: programAccounts.map((a) => a.publicKey.toBase58()),
            feeAccounts: feeAccounts.map((a) =>
              Buffer.from(a.secretKey).toString("base64")
            ),
            accountCapacity: supply.accountCapacity(),
          })
        )
        .end();
    });

    app.post("/init", async (req, res) => {
      const splitParam = parseInt(req.body["split"]);
      const split = isNaN(splitParam)
        ? 4
        : Math.max(1, Math.min(32, splitParam));

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
  }
}
