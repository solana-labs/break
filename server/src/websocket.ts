import WebSocket from "ws";
import http from "http";
import TpuProxy from "./tpu_proxy";
import { reportError } from "./utils";

// eslint-disable-next-line @typescript-eslint/no-empty-function
function noop() {}

export default class WebSocketServer {
  static start(httpServer: http.Server, tpuProxy: TpuProxy): void {
    // Start websocket server
    let activeUsers = 0;
    const wss = new WebSocket.Server({ server: httpServer });
    wss.on("connection", function connection(ws) {
      let isAlive = true;
      let useTpuProxy = false;

      function heartbeat() {
        isAlive = true;
      }

      const interval = setInterval(function ping() {
        if (isAlive === false) return ws.terminate();
        isAlive = false;
        ws.ping(noop);
      }, 30000);

      activeUsers++;
      ws.on("close", () => {
        clearInterval(interval);
        activeUsers--;
      });
      ws.on("message", (message: string | Uint8Array) => {
        if (typeof message === "string") {
          if (message === "tpu") useTpuProxy = true;
          if (message === "rpc") useTpuProxy = false;
        } else {
          if (!useTpuProxy) {
            tpuProxy.connection
              .sendRawTransaction(message, { skipPreflight: true })
              .catch((err) => {
                reportError(err, "Failed to send transaction over HTTP");
              });
          } else {
            tpuProxy.onTransaction(message);
          }
        }
      });
      ws.on("pong", heartbeat);
    });

    // Start active user broadcast loop
    setInterval(() => {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ activeUsers }));
        }
      });
    }, 1000);
  }
}
