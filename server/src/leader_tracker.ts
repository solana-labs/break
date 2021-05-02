import { Connection } from "@solana/web3.js";

const MAX_RECENT_SLOTS_LENGTH = 12;

// 48 chosen because it's unlikely that 12 leaders in a row will miss their slots
const MAX_SLOT_SKIP_DISTANCE = 48;

export default class LeaderTrackerService {
  private recentSlots: Array<number> = [];

  constructor(
    private connection: Connection,
    private currentSlot: number,
    callback: (slot: number) => void
  ) {
    this.recentSlots.push(currentSlot);

    let receivedShredNotification = false;
    this.connection.onSlotUpdate((update) => {
      const previousCurrentSlot = this.currentSlot;
      let newCurrentSlot = this.currentSlot;
      switch (update.type) {
        case "firstShredReceived": {
          receivedShredNotification = true;
          newCurrentSlot = this.updateRecentSlots(update.slot);
          break;
        }
        case "completed": {
          receivedShredNotification = true;
          newCurrentSlot = this.updateRecentSlots(update.slot + 1);
          break;
        }
        case "createdBank": {
          // Fallback to bank created slot updates if no shred notifications
          // are received (ie. connected to single node cluster leader).
          if (!receivedShredNotification) {
            newCurrentSlot = this.updateRecentSlots(update.slot);
          }
          break;
        }
      }

      if (newCurrentSlot != previousCurrentSlot) {
        callback(newCurrentSlot);
      }
    });
  }

  private updateRecentSlots = (slot: number) => {
    this.recentSlots.push(slot);
    while (this.recentSlots.length > MAX_RECENT_SLOTS_LENGTH) {
      this.recentSlots.shift();
    }

    // After updating recent slots, calculate the current slot

    const recentSlots = this.recentSlots.slice(0);
    recentSlots.sort();

    // Validators can broadcast invalid blocks that are far in the future
    // so check if the current slot is in line with the recent progression.
    const maxIndex = recentSlots.length - 1;
    const medianIndex = Math.floor(maxIndex / 2);
    const medianRecentSlot = recentSlots[medianIndex];
    const expectedCurrentSlot = medianRecentSlot + (maxIndex - medianIndex);
    const maxReasonableCurrentSlot =
      expectedCurrentSlot + MAX_SLOT_SKIP_DISTANCE;

    // Return the highest slot that doesn't exceed what we believe is a
    // reasonable slot.
    recentSlots.reverse();
    for (const slot of recentSlots) {
      if (slot <= maxReasonableCurrentSlot) {
        return slot;
      }
    }

    // This fall back is impossible
    return this.currentSlot;
  };
}
