import { CaseConvention } from "./utils/case_utils";

export abstract class AbstractModel {
  /**
   * @description Extra columns for the model, all data retrieved from the database that is not part of the model will be stored here
   */
  extraColumns: { [key: string]: any };

  /**
   * @description Defines the case convention for the model
   * @type {CaseConvention}
   */
  static modelCaseConvention: CaseConvention = "camel";

  /**
   * @description Defines the case convention for the database, this should be the case convention you use in your database
   * @type {CaseConvention}
   */
  static databaseCaseConvention: CaseConvention = "snake";

  constructor() {
    this.extraColumns = {};
  }
}
