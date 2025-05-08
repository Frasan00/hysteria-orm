import { CaseConvention } from "./utils/case_utils";

/**
 * @description The most basic class for all models for both SQL and NoSQL databases
 * @internal Not meant to be used outside of the library
 */
export abstract class Entity {
  /**
   * @description Annotations for the model, all data retrieved from the database, example aliases, that are not part of the model will be stored here
   * @description This property is present in all models, it will exist after a query, can be removed by calling the clearAnnotations method
   */
  $annotations: { [key: string]: any };

  /**
   * @description Defines the case convention for the model
   * @description Useful in raw queries, better to leave it as none in Model definition so it will respect the exact column name from the model, else it will convert the column name to the case convention you choose (default is camel case)
   * @type {CaseConvention}
   */
  static modelCaseConvention: CaseConvention = "camel";

  /**
   * @description Defines the case convention for the database, this should be the case convention you use in your database
   * @type {CaseConvention}
   */
  static databaseCaseConvention: CaseConvention = "snake";

  constructor() {
    this.$annotations = {};
  }
}
