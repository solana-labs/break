import { Connection, LeaderSchedule } from "@solana/web3.js";
import { endlessRetry } from "./utils";

type NodeAddress = string;

// Number of upcoming slots to include when building upcoming node set
const UPCOMING_SLOT_SEARCH = 40;

// Number of slots before end of epoch used to start refreshing leader schedule
const END_OF_EPOCH_BUFFER = 20;

// Updates the leader schedule every epoch and provides a set of the
// upcoming nodes in the schedule
export default class LeaderScheduleService {
  refreshing = false;

  constructor(
    private connection: Connection,
    private schedule: LeaderSchedule,
    private currentEpochFirstSlot: number,
    private slotsInEpoch: number
  ) {}

  static start = async (
    connection: Connection
  ): Promise<LeaderScheduleService> => {
    const epochInfo = await endlessRetry("getEpochInfo", () =>
      connection.getEpochInfo()
    );
    const leaderSchedule = await endlessRetry("getLeaderSchedule", () =>
      connection.getLeaderSchedule()
    );
    const currentEpochFirstSlot = epochInfo.absoluteSlot - epochInfo.slotIndex;
    const service = new LeaderScheduleService(
      connection,
      leaderSchedule,
      currentEpochFirstSlot,
      epochInfo.slotsInEpoch
    );

    connection.onSlotChange((slotInfo) => {
      if (service.shouldRefresh(slotInfo.slot)) {
        service.refresh();
      }
    });

    return service;
  };

  getUpcomingNodes(slot: number): Set<NodeAddress> {
    const currentSlotIndex = Math.max(0, slot - this.currentEpochFirstSlot);

    const addresses = new Set<NodeAddress>();
    for (const address in this.schedule) {
      const upcomingIndex = this.schedule[address].findIndex((slotIndex) => {
        return slotIndex > currentSlotIndex;
      });

      if (upcomingIndex < 0) {
        this.schedule[address] = [];
      } else {
        this.schedule[address] = this.schedule[address].slice(upcomingIndex);
        if (
          this.schedule[address][0] <
          currentSlotIndex + UPCOMING_SLOT_SEARCH
        ) {
          addresses.add(address);
        }
      }
    }
    return addresses;
  }

  private shouldRefresh(slot: number): boolean {
    const slotIndex = slot - this.currentEpochFirstSlot;
    if (slotIndex >= this.slotsInEpoch - END_OF_EPOCH_BUFFER) {
      this.currentEpochFirstSlot += this.slotsInEpoch;
      return true;
    }
    return false;
  }

  private refresh = async (): Promise<void> => {
    if (this.refreshing) return;
    this.refreshing = true;
    this.schedule = await endlessRetry("getLeaderSchedule", () =>
      this.connection.getLeaderSchedule()
    );
    this.refreshing = false;
  };
}
