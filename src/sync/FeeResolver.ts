import { EventModel } from '@muta-extra/hermit-purple';
import { groupBy } from 'lodash';
import { utils } from '@mutadev/muta-sdk';

export class FeeResolver {
  readonly #events: EventModel[];

  #grouped: boolean = false;

  #eventMap: Record<string, EventModel[]> = {};

  constructor(events: EventModel[]) {
    this.#events = events;
  }

  private getGroupedEvents(): Record<string, EventModel[]> {
    if (!this.#grouped) {
      this.#eventMap = groupBy(this.#events, 'txHash');
      this.#grouped = true;
    }
    return this.#eventMap;
  }

  eventsByTxHash(txHash: string): EventModel[] | undefined {
    return this.getGroupedEvents()[txHash];
  }

  /**
   * get fee of transaction as hex formatted
   * @param txHash
   */
  feeByTxHash(txHash: string): string {
    const events = this.eventsByTxHash(txHash);
    if (!events || events.length === 0) return '0x00';
    const fee = events.reduce<number>((total, event) => {
      if (event.service === 'governance' && event.name === 'ConsumedTxFee') {
        return total + Number(utils.safeParseJSON(event.data).amount);
      }
      return total;
    }, 0);

    return utils.toHex(fee);
  }
}
