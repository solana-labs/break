import WebSocket from "ws";
import http from "http";
import TpuProxy from "./tpu_proxy";

export default class WebSocketServer {
  static start(httpServer: http.Server, tpuProxy: TpuProxy): void {
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
  }
}
