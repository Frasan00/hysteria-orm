import {
  ColumnType,
  LazyRelationType,
} from "../../models/decorators/model_decorators_types";
import {
  TableColumnInfo,
  TableForeignKeyInfo,
  TablePrimaryKeyInfo,
} from "../../schema_introspection_types";
import { OnUpdateOrDelete } from "../schema/schema_types";

type TableToAdd = {
  table: string;
  columns: ColumnType[];
};

type ColumnToAdd = {
  table: string;
  column: ColumnType;
};

type ColumnToDrop = {
  table: string;
  column: string;
};

type ColumnToModify = {
  table: string;
  dbColumns: TableColumnInfo;
  modelColumn: ColumnType;
};

type IndexesToAdd = {
  table: string;
  index: string;
};

type IndexesToDrop = {
  table: string;
  index: string;
};

type UniqueToAdd = {
  table: string;
  name: string;
  columns: string[];
};

type UniqueToDrop = {
  table: string;
  name: string;
};

export type RelationsToAdd = {
  table: string;
  relation: LazyRelationType;
  onDelete?: OnUpdateOrDelete;
  onUpdate?: OnUpdateOrDelete;
};

export type RelationsToDrop = {
  table: string;
  relation: TableForeignKeyInfo;
};

type RelationsToModify = {
  table: string;
  dbRelation: TableForeignKeyInfo;
  modelRelation: LazyRelationType;
  onDelete?: OnUpdateOrDelete;
  onUpdate?: OnUpdateOrDelete;
};

type PrimaryKeyToAdd = {
  table: string;
  columns: string[];
};

type PrimaryKeyToDrop = {
  table: string;
  columns: string[];
  name?: string;
};

type PrimaryKeyToModify = {
  table: string;
  dbPrimaryKey: TablePrimaryKeyInfo;
  modelPrimaryKey: string;
};

export type GenerateTableDiffReturnType = {
  tablesToAdd: TableToAdd[];
  columnsToAdd: ColumnToAdd[];
  columnsToDrop: ColumnToDrop[];
  columnsToModify: ColumnToModify[];
  indexesToAdd: IndexesToAdd[];
  indexesToDrop: IndexesToDrop[];
  uniquesToAdd?: UniqueToAdd[];
  uniquesToDrop?: UniqueToDrop[];
  relationsToAdd: RelationsToAdd[];
  relationsToDrop: RelationsToDrop[];
  relationsToModify: RelationsToModify[];
  primaryKeysToAdd: PrimaryKeyToAdd[];
  primaryKeysToDrop: PrimaryKeyToDrop[];
  primaryKeysToModify: PrimaryKeyToModify[];
};

export enum OperationType {
  CREATE_SCHEMA = "CREATE_SCHEMA",
  CREATE_TABLE = "CREATE_TABLE",
  ADD_COLUMN = "ADD_COLUMN",
  CREATE_INDEX = "CREATE_INDEX",
  ADD_PRIMARY_KEY = "ADD_PRIMARY_KEY",
  ADD_UNIQUE_CONSTRAINT = "ADD_UNIQUE_CONSTRAINT",
  ADD_CHECK_CONSTRAINT = "ADD_CHECK_CONSTRAINT",
  ADD_FOREIGN_KEY = "ADD_FOREIGN_KEY",
  DROP_FOREIGN_KEY = "DROP_FOREIGN_KEY",
  DROP_CONSTRAINT = "DROP_CONSTRAINT",
  DROP_COLUMN = "DROP_COLUMN",
  DROP_INDEX = "DROP_INDEX",
  DROP_TABLE = "DROP_TABLE",
  MODIFY_COLUMN = "MODIFY_COLUMN",
  MODIFY_PRIMARY_KEY = "MODIFY_PRIMARY_KEY",
}

export enum ExecutionPhase {
  STRUCTURE_CREATION = "STRUCTURE_CREATION",
  CONSTRAINT_CREATION = "CONSTRAINT_CREATION",
  DESTRUCTIVE_OPERATIONS = "DESTRUCTIVE_OPERATIONS",
}

export interface MigrationOperation {
  type: OperationType;
  phase: ExecutionPhase;
  table?: string;
  column?: string;
  constraint?: string;
  index?: string;
  data: any;
  dependencies: string[];
  sqlStatements: string[];
}

export interface DependencyNode {
  id: string;
  dependencies: string[];
  operation: MigrationOperation;
}

export interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  edges: Map<string, string[]>;
}

export interface DropDependencies {
  foreignKeys: Map<string, string[]>;
  tables: Map<string, string[]>;
  constraints: Map<string, string[]>;
}

export interface ConstraintImpact {
  affectedConstraints: string[];
  affectedIndexes: string[];
  affectedForeignKeys: string[];
}

export interface MixedOperation {
  dropOperations: MigrationOperation[];
  createOperations: MigrationOperation[];
  description: string;
}
