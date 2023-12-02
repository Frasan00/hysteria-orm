export type FindType = {
  select: string[];
  // model manager only makes and where, for more complex queries use query builder
  where: string[];
  relations: string[];
  orderBy: string[];
  limit: number;
  offset: number;
  groupBy: string[];
};
