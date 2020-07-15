import { Connection } from "@solana/web3.js";
import dgram from "dgram";
import { sleep, notUndefined } from "./utils";

const TPU_DISABLED = !!process.env.TPU_DISABLED;
const MAX_PROXIES = 10;

type TpuSocket = {
  socket?: dgram.Socket;
};

// Proxy for sending transactions to the TPU port because
// browser clients cannot communicate to over UDP
export default class TpuProxy {
  sockets: Map<string, TpuSocket> = new Map();
  connecting = false;

  constructor(private connection: Connection) {
    // Reconnect periodically because UDP connections
    // can be silently disrupted.
    setInterval(() => this.connect(), 10000);
  }

  connected = (): boolean => {
    return this.activeProxies() > 0 || TPU_DISABLED;
  };

  activeProxies = (): number => {
    let active = 0;
    this.sockets.forEach(({ socket }) => {
      if (socket !== undefined) active++;
    });
    return active;
  };

  connect = async (): Promise<void> => {
    if (TPU_DISABLED) {
      console.log("TPU Proxy disabled");
      return;
    }
    if (this.connecting) return;
    this.connecting = true;

    do {
      try {
        console.log("TPU Proxy connecting...");
        await this.reconnect();
      } catch (err) {
        console.error("TPU Proxy failed to connect, reconnecting", err);
        await sleep(1000);
      }
    } while (!this.connected());

    const activeProxies = this.activeProxies();
    console.log(activeProxies, "TPU port(s) connected");
    this.connecting = false;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onTransaction = (data: any): void => {
    if (TPU_DISABLED) {
      this.connection.sendRawTransaction(data);
      return;
    }

    if (!this.connected()) {
      this.connect();
      return;
    }

    this.sockets.forEach(({ socket }, key) => {
      if (socket) {
        try {
          socket.send(data, () => this.onTpuResult);
        } catch (err) {
          this.onTpuResult(key, err);
        }
      }
    });
  };

  private reconnect = async (): Promise<void> => {
    const nodes = await this.connection.getClusterNodes();

    // Place rpc node at the beginning of node list
    const rpcIndex = nodes.findIndex((info) => info.pubkey.startsWith("rpc"));
    if (rpcIndex > 0) {
      const tmp = nodes[0];
      nodes[0] = nodes[rpcIndex];
      nodes[rpcIndex] = tmp;
    }

    const tpuNodes = nodes.filter(({ tpu }) => notUndefined(tpu));
    if (tpuNodes.length == 0) throw new Error("No nodes available");
    for (let a = 0; a < tpuNodes.length && a < MAX_PROXIES; a++) {
      const { tpu, pubkey } = tpuNodes[a];
      const currentSocket = this.sockets.get(pubkey)?.socket;

      // Make TypeScript happy
      if (!tpu) continue;

      // Connect to TPU port
      const [host, portStr] = tpu.split(":");
      const port = Number.parseInt(portStr);
      const socket = dgram.createSocket("udp4");
      await new Promise((resolve) => {
        socket.on("error", (err) => this.onTpuResult(pubkey, err));
        socket.connect(port, host, resolve);
      });

      this.sockets.set(pubkey, { socket });

      // Disconnect old socket
      if (currentSocket) {
        currentSocket.close();
      }
    }
  };

  private onTpuResult = (key: string, err: Error | null): void => {
    if (err) {
      console.error("Error proxying transaction", err);
      if (this.sockets.delete(key)) {
        this.connect();
      }
    }
  };
}
