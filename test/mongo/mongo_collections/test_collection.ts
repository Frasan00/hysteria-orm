import { DateTime } from "luxon";
import { Collection } from "../../../src/no_sql/mongo/mongo_models/mongo_collection";
import {
  dynamicProperty,
  property,
} from "../../../src/no_sql/mongo/mongo_models/mongo_collection_decorators";

export class TestModel extends Collection {
  @property()
  declare name: string;

  @property()
  declare email: string;

  @property()
  declare userProfile: {
    birthData: DateTime;
    age: number;
    preferredName: string;
  };

  @dynamicProperty("test")
  async getTest() {
    return "test";
  }
}
