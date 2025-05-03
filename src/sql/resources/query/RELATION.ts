import { HysteriaError } from "../../../errors/hysteria_error";
import { convertCase } from "../../../utils/case_utils";
import logger from "../../../utils/logger";
import {
  getModelColumns,
  getRelations,
} from "../../models/decorators/model_decorators";
import { Model } from "../../models/model";
import { ManyToMany } from "../../models/relations/many_to_many";
import { Relation, RelationEnum } from "../../models/relations/relation";
import type { SqlDataSourceType } from "../../sql_data_source_types";
import {
  convertValueToSQL,
  generateHasManyQuery,
  generateManyToManyQuery,
} from "../utils";

const relationTemplate = (relation: Relation) => {
  return {
    selectRelation: `SELECT * FROM ${relation.relatedModel}`,
    limit: (limit: number) => {
      return `LIMIT ${limit}`;
    },
    offset: (offset: number) => {
      return `OFFSET ${offset}`;
    },
  };
};

export default relationTemplate;
