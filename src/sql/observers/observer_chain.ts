import { ObserverChain } from "./observer";
import type { QueryObserver } from "./observer";

export class ObserverChainWrapper {
  private chain: ObserverChain;
  constructor(observers?: QueryObserver[]) {
    this.chain = new ObserverChain(observers);
  }

  get chainInstance(): ObserverChain {
    return this.chain;
  }

  add(observer: QueryObserver) {
    this.chain.add(observer);
  }
}
