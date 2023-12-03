import { FindType } from "./ModelManagerTypes";
import selectTemplate from "../QueryTemplates/SELECT";
import whereTemplate from "../QueryTemplates/WHERE.TS";
import { Model } from "../Model";
import insertTemplate from "../QueryTemplates/INSERT";
import updateTemplate from "../QueryTemplates/UPDATE";
import deleteTemplate from "../QueryTemplates/DELETE";
import { Relation, RelationType } from "../Relations/Relation";
import joinTemplate from "../QueryTemplates/JOIN";
import { HasOne } from "../Relations/HasOne";
import { BelongsTo } from "../Relations/BelongsTo";
import { HasMany } from "../Relations/HasMany";

class ModelManagerUtils<T extends Model> {
  public parseSelectQueryInput(model: T, input: FindType): string {
    let query = "";
    query += this.parseSelect(model.tableName, input);
    query += this.parseJoin(model, input);
    query += this.parseWhere(model.tableName, input);
    query += this.parseQueryFooter(model.tableName, input);

    return query;
  }

  private parseSelect(tableName: string, input: FindType): string {
    const select = selectTemplate(tableName);
    return input.select
      ? select.selectColumns(...input.select)
      : select.selectAll;
  }

  private parseJoin(model: T, input: FindType): string {
    if (!input.relations || !model.primaryKey) {
      return "";
    }

    const relations = this.extractRelationsFromModel(model, input);

    if (relations.length === 0) {
      return "";
    }

    let query = "";
    const join = joinTemplate(model.tableName, model.primaryKey);
    relations.forEach((relation) => {
      if (relation instanceof BelongsTo) {
        return (query += join.belongsToJoin(relation));
      }

      if (relation instanceof HasOne) {
        return (query += join.hasOneJoin(relation));
      }

      if (relation instanceof HasMany) {
        return (query += join.hasManyJoin(relation));
      }
    });

    return query;
  }

  private extractRelationsFromModel(model: T, input: FindType): Relation[] {
    if (!input.relations) {
      return [];
    }

    // Checks all properties of the model for Relations given in the input
    return Object.entries(model)
      .filter(
        ([key, value]) =>
          Object.prototype.hasOwnProperty.call(model, key) &&
          value instanceof Relation &&
          input.relations?.includes(key),
      )
      .map(([key, _value]) => model[key as keyof T] as Relation);
  }

  private parseWhere(tableName: string, input: FindType): string {
    const where = whereTemplate(tableName);
    if (!input.where) {
      return "";
    }

    let query = "";
    const entries = Object.entries(input.where);
    for (let index = 0; index < entries.length; index++) {
      const [key, value] = entries[index];

      if (index === 0) {
        query += where.where(key, value);
        continue;
      }
      query += where.andWhere(key, value);
    }

    return query;
  }

  private parseQueryFooter(tableName: string, input: FindType): string {
    const select = selectTemplate(tableName);
    let query = "";
    if (input.offset) {
      query += select.offset(input.offset);
    }

    if (input.groupBy) {
      query += select.groupBy(...input.groupBy);
    }

    if (input.orderBy) {
      query += select.orderBy([...input.orderBy.columns], input.orderBy.type);
    }

    if (input.limit) {
      query += select.limit(input.limit);
    }

    return query;
  }

  public parseInsert(model: T): string {
    const keys = this.filterRelationAndInfoColumns(model);
    const values = keys.map((key) => {
      return model[key as keyof T];
    }) as string[];
    const insert = insertTemplate(model.tableName);

    return insert.insert(keys, values);
  }

  public parseUpdate(model: T): string {
    const update = updateTemplate(model.tableName);
    const keys = Object.keys(model);
    const values = Object.values(model);
    return update.update(keys, values);
  }

  public parseDelete(
    tableName: string,
    column: string,
    value: string | number | boolean,
  ): string {
    const del = deleteTemplate(tableName);
    return del.delete(column, value.toString());
  }

  private filterRelationAndInfoColumns(model: T): string[] {
    return Object.entries(model)
      .filter(([key, value]) => {
        if (value instanceof Relation) {
          return false;
        }

        if (key === model.primaryKey && !value) {
          return false;
        }

        return !(key === "tableName" || key === "primaryKey");
      })
      .map(([key, _value]) => key);
  }
}

export default new ModelManagerUtils();
