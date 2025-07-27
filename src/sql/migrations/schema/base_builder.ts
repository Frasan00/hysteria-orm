import { QueryNode } from "../../ast/query/query";

export abstract class BaseBuilder {
  nodes: QueryNode[];

  constructor(nodes: QueryNode[]) {
    this.nodes = nodes;
  }

  getNodes(): QueryNode[] {
    return this.nodes;
  }
}
