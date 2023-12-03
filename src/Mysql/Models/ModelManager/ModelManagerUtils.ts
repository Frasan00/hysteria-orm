import { FindType } from "./ModelManagerTypes";
import selectTemplate from "../QueryTemplates/SELECT";
import whereTemplate from "../QueryTemplates/WHERE.TS";
import { Model } from "../Model";
import insertTemplate from "../QueryTemplates/INSERT";
import updateTemplate from "../QueryTemplates/UPDATE";
import deleteTemplate from "../QueryTemplates/DELETE";

class ModelManagerUtils {
  public parseSelectQueryInput(tableName: string, input: FindType): string {
    let query = "";
    query += this.parseSelect(tableName, input);
    query += this.parseWhere(input);
    // to do parse join after relations
    query += this.parseQueryFooter(tableName, input);

    return query;
  }

  private parseSelect(tableName: string, input: FindType): string {
    const select = selectTemplate(tableName);
    return input.select
      ? select.selectColumns(...input.select)
      : select.selectAll;
  }

  private parseWhere(input: FindType): string {
    const where = whereTemplate();
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

  public parseInsert<T extends Model>(model: T): string {
    const keys = Object.keys(model);
    const values = Object.values(model);
    const insert = insertTemplate(model.tableName);

    return insert.insert(keys, values);
  }

  public parseUpdate<T extends Model>(model: T): string {
    const update = updateTemplate(model.tableName);
    const keys = Object.keys(model);
    const values = Object.values(model);
    return update.update(keys, values);
  }

  public parseDelete<T extends Model>(
    tableName: string,
    column: string,
    value: string | number | boolean,
  ): string {
    const del = deleteTemplate(tableName);
    return del.delete(column, value.toString());
  }
}

export default new ModelManagerUtils();
