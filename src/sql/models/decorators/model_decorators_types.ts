import { DateFormat, Timezone } from "../../../utils/date_utils";
import { Model } from "../model";
import { RelationEnum } from "../relations/relation";

export type LazyRelationType = {
  type: RelationEnum;
  columnName: string;
  model: () => typeof Model;
  foreignKey?: string;

  // Only for many to many
  manyToManyOptions?: {
    throughModel: string;
  };
};

export type DateColumnOptions = {
  /**
   * @description The format to store dates in ('ISO' or 'TIMESTAMP')
   * @default "ISO"
   */
  format?: DateFormat;
  /**
   * @description The timezone to use ('UTC' or 'LOCAL')
   * @default "UTC"
   */
  timezone?: Timezone;
  /**
   * @description Whether to automatically update the timestamp on record updates, uses timezone and format from the dateColumn options
   * @default false
   */
  autoUpdate?: boolean;
  /**
   * @description Whether to automatically set the timestamp on record creation, uses timezone and format from the dateColumn options
   * @default false
   */
  autoCreate?: boolean;
} & ColumnOptions;

export type SymmetricEncryptionOptions = {
  /**
   * @description The key to use for the symmetric encryption
   */
  key: string;
} & ColumnOptions;

export type AsymmetricEncryptionOptions = {
  /**
   * @description The public key to use for the asymmetric encryption
   */
  publicKey: string;
  /**
   * @description The private key to use for the asymmetric encryption
   */
  privateKey: string;
} & ColumnOptions;

/**
 * columns
 * @description Options for the column decorator
 */
export type ColumnOptions = {
  /**
   * @description Whether the column is the primary key, composite primary keys are not supported
   * @warning Only one primary key is allowed per model
   * @throws {HysteriaError} if more than one primary key is defined
   * @default false
   */
  primaryKey?: boolean;
  /**
   * @description Called on the value returned from the database before it is returned from the model
   */
  serialize?: (value: any) => any | Promise<any>;
  /**
   * @description Called on the value before it is inserted or updated in the database
   * @warning This will not be called on massive update operations since it's not possible to know which values are being updated, so you must pass the value you want to update in the payload
   */
  prepare?: (value: any) => any | Promise<any>;
  /**
   * @description Whether the column is returned in the serialization output
   * @default false
   */
  hidden?: boolean;
  /**
   * @description If true, the prepare function will always be called on update regardless of whether the value has been provided in the update payload
   * @default false
   */
  autoUpdate?: boolean;
  /**
   * @description The name of the column in the database, can be used to specify the column name in the database
   * @default The name of the property following the model case convention
   */
  databaseName?: string;
};

export type ColumnType = {
  columnName: string;
  databaseName: string;
  serialize?: (value: any) => any | Promise<any>;
  prepare?: (value: any) => any | Promise<any>;
  hidden?: boolean;
  autoUpdate?: boolean;
};
