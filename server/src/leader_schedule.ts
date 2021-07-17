import { Connection } from "@solana/web3.js";
import { endlessRetry, reportError } from "./utils";

// Number of upcoming slots to include when building upcoming node set
export const UPCOMING_SLOT_SEARCH = parseInt(
  process.env.LEADER_SLOT_FANOUT || "40"
);

// Number of past slots to include when building upcoming node set
export const PAST_SLOT_SEARCH = 4;

// Updates the leader schedule every epoch and provides a set of the
// upcoming nodes in the schedule
export default class LeaderScheduleService {
  refreshing = false;

  constructor(
    private connection: Connection,
    private leaderAddresses: Array<string>,
    private scheduleFirstSlot: number
  ) {}

  static start = async (
    connection: Connection,
    currentSlot: number
  ): Promise<LeaderScheduleService> => {
    const leaderService = new LeaderScheduleService(
      connection,
      [],
      currentSlot
    );

    leaderService.leaderAddresses = await endlessRetry("getSlotLeaders", () =>
      leaderService.fetchLeaders(currentSlot)
    );

    return leaderService;
  };

  private async fetchLeaders(startSlot: number): Promise<Array<string>> {
    const leaders = await this.connection.getSlotLeaders(
      startSlot,
      2 * UPCOMING_SLOT_SEARCH
    );
    return leaders.map((l) => l.toBase58());
  }

  getFirstSlot = (): number => {
    return this.scheduleFirstSlot;
  };

  getSlotLeader = (slot: number): string | null => {
    if (slot >= this.scheduleFirstSlot && slot <= this.lastSlot()) {
      return this.leaderAddresses[slot - this.scheduleFirstSlot];
    } else {
      console.error(
        `getSlotLeader failed: Either ${slot} < ${
          this.scheduleFirstSlot
        } OR ${slot} > ${this.lastSlot()}`
      );
      return null;
    }
  };

  private lastSlot = (): number => {
    return this.scheduleFirstSlot + this.leaderAddresses.length - 1;
  };

  shouldRefresh = (currentSlot: number): boolean => {
    const shouldRefreshAt = this.lastSlot() - UPCOMING_SLOT_SEARCH;
    return currentSlot >= shouldRefreshAt;
  };

  refresh = async (currentSlot: number): Promise<void> => {
    if (this.refreshing) return;
    this.refreshing = true;
    try {
      const firstSlot = Math.max(0, currentSlot - PAST_SLOT_SEARCH);
      const leaderAddresses = await this.fetchLeaders(firstSlot);
      this.scheduleFirstSlot = firstSlot;
      this.leaderAddresses = leaderAddresses;
    } catch (err) {
      reportError(err, "failed to refresh slot leaders");
    } finally {
      this.refreshing = false;
    }
  };
}
