import { Connection } from "@solana/web3.js";
import { cluster, url, urlTls } from "./urls";
import { PROGRAM_ID } from "./program";
import TpuProxy from "./tpu_proxy";
import WebSocketServer from "./websocket";
import { Express } from "express";
import http from "http";

export default class ApiServer {
  static async start(app: Express, httpServer: http.Server): Promise<void> {
    const connection = new Connection(url, "confirmed");
    const tpuProxy = await TpuProxy.create(connection);
    WebSocketServer.start(httpServer, tpuProxy);

    await tpuProxy.connect();

    app.post("/init", async (req, res) => {
      res
        .send(
          JSON.stringify({
            programId: PROGRAM_ID.toString(),
            clusterUrl: urlTls,
            cluster,
            paymentRequired: process.env.REQUIRE_PAYMENT === "true",
          })
        )
        .end();
    });
  }
}
