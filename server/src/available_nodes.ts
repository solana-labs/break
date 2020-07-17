import { Connection } from "@solana/web3.js";
import { endlessRetry } from "./utils";

type NodeAddress = string;
type TpuEndpoint = string;
type AvailableNodes = Map<NodeAddress, TpuEndpoint>;

// Polls cluster to determine which nodes are available
export default class AvailableNodesService {
  refreshing = false;

  constructor(private connection: Connection, public nodes: AvailableNodes) {
    // Refresh every 30s in case nodes leave the cluster or change port configuration
    setInterval(() => this.refresh(), 30000);
  }

  static start = async (
    connection: Connection
  ): Promise<AvailableNodesService> => {
    const nodes = await AvailableNodesService.getAvailableNodes(connection);
    return new AvailableNodesService(connection, nodes);
  };

  private static getAvailableNodes = async (
    connection: Connection
  ): Promise<AvailableNodes> => {
    const availableNodes = new Map();
    const nodes = await endlessRetry("getClusterNodes", () =>
      connection.getClusterNodes()
    );
    for (const node of nodes) {
      if (node.tpu) {
        availableNodes.set(node.pubkey, node.tpu);
      }
    }
    return availableNodes;
  };

  private refresh = async (): Promise<void> => {
    if (this.refreshing) return;
    this.refreshing = true;
    this.nodes = await AvailableNodesService.getAvailableNodes(this.connection);
    this.refreshing = false;
  };
}
