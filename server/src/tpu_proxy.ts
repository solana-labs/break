import { Connection } from "@solana/web3.js";
import dgram from "dgram";

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function notUndefined<T>(x: T | undefined): x is T {
  return x !== undefined;
}

// Proxy for sending transactions
export default class TpuProxy {
  tpu?: dgram.Socket;
  connecting = false;

  constructor(private connection: Connection) {}

  connected = (): boolean => {
    return this.tpu !== undefined && !this.connecting;
  };

  connect = async (): Promise<void> => {
    if (this.connecting) return;
    this.connecting = true;
    // eslint-disable-next-line no-constant-condition
    while (this.tpu === undefined) {
      try {
        console.log("TPU Proxy Connecting...");
        await this.reconnect();
      } catch (err) {
        console.error("TPU Proxy failed to connect, reconnecting", err);
        await sleep(1000);
      }
    }
    console.log("TPU Proxy Connected");
    this.connecting = false;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onTransaction = (data: any): void => {
    if (this.tpu) {
      try {
        this.tpu.send(data, this.onTpuResult);
      } catch (err) {
        this.onTpuResult(err);
      }
    } else {
      this.connect();
      console.error("TPU Proxy disconnected, dropping message");
    }
  };

  private reconnect = async (): Promise<void> => {
    const nodes = await this.connection.getClusterNodes();

    // Place rpc node at the beginning of node list
    const rpcIndex = nodes.findIndex(info => info.pubkey.startsWith("rpc"));
    if (rpcIndex > 0) {
      const tmp = nodes[0];
      nodes[0] = nodes[rpcIndex];
      nodes[rpcIndex] = tmp;
    }

    // Pick a TPU address
    const tpuAddresses = nodes.map(info => info.tpu).filter(notUndefined);
    if (tpuAddresses.length == 0) throw new Error("No nodes available");
    const tpuAddr = tpuAddresses[0];

    // Connect to TPU port
    const [host, portStr] = tpuAddr.split(":");
    const port = Number.parseInt(portStr);
    const tpu = dgram.createSocket("udp4");
    await new Promise(resolve => {
      tpu.on("error", this.onTpuResult);
      tpu.connect(port, host, resolve);
    });

    this.tpu = tpu;
  };

  private onTpuResult = (err: Error | null): void => {
    if (err) {
      console.error("Error proxying transaction", err);
      if (this.tpu) {
        this.tpu.off("error", this.onTpuResult);
        this.tpu = undefined;
        this.connect();
      }
    }
  };
}
