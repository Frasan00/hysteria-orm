type WhereType = {
  [key: string]: string | number | boolean;
};

type OrderByType = {
  columns: string[];
  type: "ASC" | "DESC";
};

// model manager only makes and where, for more complex queries use query builder
export type FindOneType = {
  select?: string[];
  relations?: string[];
  where?: WhereType;
};

export type FindType = FindOneType & {
  orderBy?: OrderByType;
  groupBy?: string[];
  limit?: number;
  offset?: number;
};

export type TransactionType = {
  createTrx?: string;
  commitTrx?: string;
  rollbackTrx?: string;
};
