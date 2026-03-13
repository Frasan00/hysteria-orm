import { DateTime } from "luxon";
import {
  defineCollection,
  prop,
} from "../../../src/no_sql/mongo/mongo_models/define_collection";

export const TestModel = defineCollection("test_models", {
  properties: {
    name: prop.string(),
    email: prop.string(),
    userProfile: prop.object<{
      birthData: DateTime;
      age: number;
      preferredName: string;
    }>(),
  },
});
