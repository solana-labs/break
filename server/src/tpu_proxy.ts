import { Connection, PublicKey } from "@solana/web3.js";
import dgram from "dgram";
import { sleep, notUndefined } from "./utils";

const TPU_DISABLED = !!process.env.TPU_DISABLED;
const MAX_PROXIES = 10;

type Tpu = {
  socket?: dgram.Socket;
};

// Proxy for sending transactions
export default class TpuProxy {
  tpus: Map<PublicKey, Tpu> = new Map();
  connecting = false;

  constructor(private connection: Connection) {}

  connected = (): boolean => {
    return this.activeProxies() > 0 || TPU_DISABLED;
  };

  activeProxies = (): number => {
    let active = 0;
    this.tpus.forEach(({ socket }) => {
      if (socket !== undefined) active++;
    });
    return active;
  };

  connect = async (): Promise<void> => {
    if (TPU_DISABLED) {
      console.log("TPUs disabled");
      return;
    }
    if (this.connecting) return;
    this.connecting = true;
    while (!this.connected()) {
      try {
        console.log("TPU Proxy Connecting...");
        await this.reconnect();
      } catch (err) {
        console.error("TPU Proxy failed to connect, reconnecting", err);
        await sleep(1000);
      }
    }
    const activeProxies = this.activeProxies();
    console.log(activeProxies, "TPUs Connected");
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
      console.error("TPU Proxy disconnected, dropping message");
      return;
    }

    this.tpus.forEach(({ socket }, key) => {
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
      const { tpu, pubkey } = tpuNodes[0];
      const nodeKey = new PublicKey(pubkey);
      if (!tpu) continue;
      if (this.tpus.has(nodeKey)) continue;

      // Connect to TPU port
      const [host, portStr] = tpu.split(":");
      const port = Number.parseInt(portStr);
      const socket = dgram.createSocket("udp4");
      await new Promise((resolve) => {
        socket.on("error", (err) => this.onTpuResult(nodeKey, err));
        socket.connect(port, host, resolve);
      });

      this.tpus.set(nodeKey, { socket });
    }
  };

  private onTpuResult = (key: PublicKey, err: Error | null): void => {
    if (err) {
      console.error("Error proxying transaction", err);
      if (this.tpus.delete(key)) {
        this.connect();
      }
    }
  };
}
