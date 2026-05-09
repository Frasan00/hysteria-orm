import { HysteriaError } from "../../errors/hysteria_error";

// Operation type for readability in tests and observers
export type Operation = "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "OTHER";

export interface QueryContext {
  id: string;
  sql: string;
  params: any[];
  model?: any;
  operation?: string; // derived operation name
  timestamp: number; // when the query started
}

/**
 * Query context extended with execution metadata.
 * @property duration - Query execution time in milliseconds (ms)
 */
export type QueryContextWithDuration = QueryContext & {
  duration: number;
  result?: any;
};

export interface QueryObserver {
  onBeforeQuery?(ctx: QueryContext): Promise<void> | void;
  onAfterQuery?(ctx: QueryContextWithDuration): Promise<void> | void;
  onQueryError?(ctx: QueryContext & { error: Error }): Promise<void> | void;
}

export class ObserverChain {
  private observers: QueryObserver[];

  constructor(observers?: QueryObserver[]) {
    this.observers = observers ?? [];
  }

  add(observer: QueryObserver) {
    this.observers.push(observer);
  }

  async notifyBefore(ctx: QueryContext): Promise<void> {
    for (const ob of this.observers) {
      if (!ob?.onBeforeQuery) continue;
      await ob.onBeforeQuery!(ctx);
    }
  }

  async notifyAfter(
    ctx: QueryContextWithDuration,
    result?: any,
  ): Promise<void> {
    for (const ob of this.observers) {
      if (!ob?.onAfterQuery) continue;
      ctx.result ??= result;
      await ob.onAfterQuery!(ctx as any);
    }
  }

  async notifyError(ctx: QueryContext & { error: Error }): Promise<void> {
    for (const ob of this.observers) {
      if (!ob?.onQueryError) continue;
      await ob.onQueryError!(ctx as any);
    }
  }
}

export const deriveOperationFromQuery = (sql: string): string => {
  if (!sql) return "OTHER";
  const s = sql.trim().toUpperCase();
  if (s.startsWith("SELECT")) return "SELECT";
  if (s.startsWith("INSERT")) return "INSERT";
  if (s.startsWith("UPDATE")) return "UPDATE";
  if (s.startsWith("DELETE")) return "DELETE";
  return "OTHER";
};
