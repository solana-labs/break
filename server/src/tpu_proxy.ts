import { Connection } from "@solana/web3.js";
import dgram from "dgram";
import { sleep } from "./utils";
import AvailableNodesService from "./available_nodes";
import LeaderScheduleService from "./leader_schedule";

const PROXY_DISABLED = process.env.SEND_TO_RPC === "true";

type TpuAddress = string;

// Proxy for sending transactions to the TPU port because
// browser clients cannot communicate to over UDP
export default class TpuProxy {
  connecting = false;
  lastSlot = 0;
  tpuAddresses: string[] = [];
  sockets: Map<TpuAddress, dgram.Socket> = new Map();

  constructor(private connection: Connection) {}

  static async create(connection: Connection): Promise<TpuProxy> {
    const proxy = new TpuProxy(connection);
    if (!PROXY_DISABLED) {
      const leaderService = await LeaderScheduleService.start(connection);
      const nodesService = await AvailableNodesService.start(connection);
      connection.onSlotChange(({ slot }) => {
        if (slot > proxy.lastSlot + 10) {
          proxy.lastSlot = slot;
          const nodes = leaderService.getUpcomingNodes(slot);
          const tpuAddresses: string[] = [];
          nodes.forEach((node) => {
            const tpu = nodesService.nodes.get(node);
            if (tpu) {
              tpuAddresses.push(tpu);
            } else {
              console.error("NO TPU FOUND", node);
            }
          });
          proxy.tpuAddresses = tpuAddresses;
          proxy.connect();
        }
      });
    }
    return proxy;
  }

  connected = (): boolean => {
    return this.activeProxies() > 0 || PROXY_DISABLED;
  };

  activeProxies = (): number => {
    return this.sockets.size;
  };

  connect = async (): Promise<void> => {
    if (PROXY_DISABLED) {
      console.log("TPU Proxy disabled");
      return;
    }
    if (this.connecting) return;
    this.connecting = true;

    do {
      try {
        console.log("TPU Proxy refreshing...");
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
    if (PROXY_DISABLED) {
      this.connection.sendRawTransaction(data).catch((err) => {
        console.error(err, "failed to send raw tx");
      });
      return;
    }

    if (!this.connected()) {
      this.connect();
      return;
    }

    this.sockets.forEach((socket, address) => {
      try {
        socket.send(data, (err) => this.onTpuResult(address, err));
      } catch (err) {
        this.onTpuResult(address, err);
      }
    });
  };

  private reconnect = async (): Promise<void> => {
    const sockets = new Map();
    for (const tpu of this.tpuAddresses) {
      const [host, portStr] = tpu.split(":");
      const port = Number.parseInt(portStr);
      const socket = dgram.createSocket("udp4");
      await new Promise((resolve) => {
        socket.on("error", (err) => this.onTpuResult(tpu, err));
        socket.connect(port, host, resolve);
      });
      sockets.set(tpu, socket);
    }

    if (sockets.size === 0) throw new Error("No sockets found");

    const oldSockets = this.sockets;
    this.sockets = sockets;

    oldSockets.forEach((socket) => {
      socket.close();
    });
  };

  private onTpuResult = (address: string, err: Error | null): void => {
    if (err) {
      console.error("Error proxying transaction", err);
      this.sockets.delete(address);
    }
  };
}
