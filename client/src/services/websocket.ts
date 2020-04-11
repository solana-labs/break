import Path from "api/paths";

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
      if (socket.readyState !== WebSocket.OPEN) {
        throw new Error("WebSocket open timed out");
      }
      this.socket = socket;
      this.socket.onclose = () => {
        this.close();
      };
      this.socket.onerror = err => {
        this.error(err);
      };
    } finally {
      this.connecting = false;
    }
  };

  error = (err: any) => {
    console.error(err);
    this.close();
  };

  send = (data: Buffer) => {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(data);
    } else {
      throw new Error("Websocket disconnected");
    }
  };

  close = () => {
    if (this.socket) {
      this.socket.close();
    }
    this.socket = undefined;
  };
}
