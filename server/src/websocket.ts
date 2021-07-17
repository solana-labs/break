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
      function heartbeat() {
        console.log("heartbeat");
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
      ws.on("message", tpuProxy.onTransaction);
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
