import WebSocket from "ws";
import http from "http";
import TpuProxy from "./tpu_proxy";

// eslint-disable-next-line @typescript-eslint/no-empty-function
function noop() {}

export default class WebSocketServer {
  static start(httpServer: http.Server, tpuProxy: TpuProxy): void {
    // Start websocket server
    let activeUsers = 0;
    const wss = new WebSocket.Server({ server: httpServer });
    wss.on("connection", function connection(ws) {
      let isAlive = true;
      let useRpc = true;
      let rpcOverride: string;

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
      ws.on("message", (data: Buffer, isBinary: boolean) => {
        const message = isBinary ? data : data.toString();
        if (typeof message === "string") {
          if (message === "tpu") {
            console.log("Client switched to TPU mode");
            useRpc = false;
          } else if (message === "rpc") {
            console.log("Client switched to RPC mode");
            useRpc = true;
          } else {
            try {
              const rpcEndpoint = new URL(message);
              rpcOverride = rpcEndpoint.toString();
              console.log("Client overrode RPC endpoint to", rpcEndpoint.href);
            } catch (err) {
              console.warn("Ignoring client message", message);
            }
          }
        } else {
          tpuProxy.sendRawTransaction(
            message,
            useRpc,
            rpcOverride,
            (message: string) => {
              ws.send(message);
            }
          );
        }
      });
      ws.on("pong", heartbeat);
    });

    // Start active user broadcast loop
    setInterval(() => {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: "heartbeat", activeUsers }));
        }
      });
    }, 1000);
  }
}
