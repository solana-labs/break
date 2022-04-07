import { Connection } from "@solana/web3.js";
import bs58 from "bs58";
import dgram from "dgram";
import { endlessRetry, reportError, sleep } from "./utils";
import AvailableNodesService from "./available_nodes";
import LeaderScheduleService, {
  PAST_SLOT_SEARCH,
  UPCOMING_SLOT_SEARCH,
} from "./leader_schedule";
import LeaderTrackerService from "./leader_tracker";

type TpuAddress = string;

// Proxy for sending transactions to the TPU port because
// browser clients cannot communicate to over UDP
export default class TpuProxy {
  connecting = false;
  lastSlot = 0;
  tpuAddresses = new Array<string>();
  sockets: Map<TpuAddress, dgram.Socket> = new Map();
  socketPool: Array<dgram.Socket> = [];

  constructor(public connection: Connection) {}

  static async create(connection: Connection): Promise<TpuProxy> {
    const proxy = new TpuProxy(connection);
    const currentSlot = await endlessRetry("getSlot", () =>
      connection.getSlot("processed")
    );
    const nodesService = await AvailableNodesService.start(connection);
    const leaderService = await LeaderScheduleService.start(
      connection,
      currentSlot
    );
    new LeaderTrackerService(connection, currentSlot, async (currentSlot) => {
      if (leaderService.shouldRefresh(currentSlot)) {
        await leaderService.refresh(currentSlot);
      }
      await proxy.refreshAddresses(leaderService, nodesService, currentSlot);
    });
    await proxy.refreshAddresses(leaderService, nodesService, currentSlot);
    return proxy;
  }

  connected = (): boolean => {
    return this.activeProxies() > 0;
  };

  activeProxies = (): number => {
    return this.sockets.size;
  };

  connect = async (): Promise<void> => {
    if (this.connecting) return;
    this.connecting = true;

    do {
      try {
        await this.reconnect();
      } catch (err) {
        reportError(err, "TPU Proxy failed to connect, reconnecting");
        await sleep(1000);
      }
    } while (!this.connected());

    // console.log(this.activeProxies(), "TPU port(s) connected");
    this.connecting = false;
  };

  sendRawTransaction = (
    rawTransaction: Uint8Array,
    useRpc: boolean,
    rpcOverride: string | undefined,
    sendResponse: (message: string) => void
  ): void => {
    if (!this.connected()) {
      this.connect();
      return;
    }

    if (useRpc) {
      let connection = this.connection;
      if (rpcOverride) {
        try {
          connection = new Connection(rpcOverride);
        } catch (err) {
          // invalid rpc url
        }
      }

      connection
        .sendRawTransaction(rawTransaction, {
          preflightCommitment: "confirmed",
        })
        .catch((err: Error) => {
          if (rawTransaction.length < 65) {
            return;
          }

          sendResponse(
            JSON.stringify({
              type: "failure",
              signature: bs58.encode(rawTransaction.slice(1, 65)),
              reason: err.message,
            })
          );

          reportError(err, "Failed to send transaction over HTTP");
        });
      return;
    }

    this.sockets.forEach((socket, address) => {
      try {
        socket.send(rawTransaction, (err) => this.onTpuResult(address, err));
      } catch (err) {
        this.onTpuResult(address, err);
      }
    });
  };

  private refreshAddresses = async (
    leaderService: LeaderScheduleService,
    nodesService: AvailableNodesService,
    currentSlot: number
  ) => {
    const startSlot = currentSlot - PAST_SLOT_SEARCH;
    const endSlot = currentSlot + UPCOMING_SLOT_SEARCH;
    const tpuAddresses = [];
    const leaderAddresses = new Set<string>();
    for (let leaderSlot = startSlot; leaderSlot < endSlot; leaderSlot++) {
      const leader = leaderService.getSlotLeader(leaderSlot);
      if (leader !== null && !leaderAddresses.has(leader)) {
        leaderAddresses.add(leader);
        const tpu = nodesService.nodes.get(leader);
        if (tpu) {
          tpuAddresses.push(tpu);
        } else if (!nodesService.delinquents.has(leader)) {
          nodesService.delinquents.add(leader);
          console.warn("NO TPU FOUND", leader);
        }
      }
    }

    this.tpuAddresses = tpuAddresses;
    await this.connect();
  };

  private reconnect = async (): Promise<void> => {
    const sockets = new Map();
    for (const tpu of this.tpuAddresses) {
      const [host, portStr] = tpu.split(":");
      const port = Number.parseInt(portStr);

      const poolSocket = this.socketPool.pop();
      let socket: dgram.Socket;
      if (poolSocket) {
        poolSocket.removeAllListeners("error");
        socket = poolSocket;
      } else {
        socket = dgram.createSocket("udp4");
      }

      await new Promise((resolve) => {
        socket.on("error", (err) => this.onTpuResult(tpu, err));
        socket.connect(port, host, () => resolve(undefined));
      });
      sockets.set(tpu, socket);
    }

    if (sockets.size === 0) {
      reportError(new Error("No sockets found"), "not forwarding packets");
    }

    const oldSockets = this.sockets;
    this.sockets = sockets;

    oldSockets.forEach((socket) => {
      socket.disconnect();
      this.socketPool.push(socket);
    });
  };

  private onTpuResult = (address: string, err: unknown): void => {
    if (err) {
      reportError(err, "Error proxying transaction to TPU");
      const socket = this.sockets.get(address);
      if (socket) {
        this.sockets.delete(address);
        socket.disconnect();
        this.socketPool.push(socket);
      }
    }
  };
}
