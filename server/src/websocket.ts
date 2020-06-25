import WebSocket from "ws";
import http from "http";
import TpuProxy from "./tpu_proxy";

export default class WebSocketServer {
  static start(httpServer: http.Server, tpuProxy: TpuProxy): void {
    // Start websocket server
    let activeUsers = 0;
    const wss = new WebSocket.Server({ server: httpServer });
    wss.on("connection", function connection(ws) {
      activeUsers++;
      ws.on("close", () => activeUsers--);
      ws.on("message", tpuProxy.onTransaction);
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
