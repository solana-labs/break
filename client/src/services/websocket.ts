import Path from "@/api/paths";

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class WebSocketService {
  socket?: WebSocket;
  connecting = false;

  connect = async (): Promise<void> => {
    if (this.connecting) return;
    this.connecting = true;
    try {
      this.close();
      const socket = new WebSocket(Path.WS);
      const connectPromise = new Promise(resolve => {
        socket.onopen = resolve;
      });
      await Promise.race([sleep(5000), connectPromise]);
      if (socket.readyState != WebSocket.OPEN) {
        throw new Error("WebSocket open timed out");
      }
      this.socket = socket;
    } finally {
      this.connecting = false;
    }
  };

  send = (data: Buffer) => {
    if (this.socket) {
      if (this.socket.readyState == WebSocket.OPEN) {
        this.socket.send(data);
      } else {
        throw new Error("Websocket disconnected");
      }
    }
  };

  close = () => {
    if (this.socket) {
      this.socket.close();
    }
    this.socket = undefined;
  };
}
