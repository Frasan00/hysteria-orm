import { faker } from "@faker-js/faker";
import { SqlDataSource } from "../../../../src/sql/sql_data_source";
import { PostWithBigint } from "../bigint/post_bigint";
import { PostWithUuid } from "../uuid/post_uuid";

export class PostFactory {
  static async postWithBigint<T extends number>(
    sql: SqlDataSource,
    userId: number,
    howMany: T,
  ) {
    const postData = PostFactory.getCommonPostData();
    if (howMany === 1) {
      return await (sql.from(PostWithBigint as any) as any).insert(
        { ...postData, userId },
        { returning: ["*"] },
      );
    }

    const array = Array.from({ length: howMany });
    return await (sql.from(PostWithBigint as any) as any).insertMany(
      array.map(() => ({ ...postData, userId })),
      { returning: ["*"] },
    );
  }

  static async postWithUuid<T extends number>(
    sql: SqlDataSource,
    userId: string,
    howMany: T,
  ) {
    const postData = PostFactory.getCommonPostData();
    if (howMany === 1) {
      return await (sql.from(PostWithUuid as any) as any).insert(
        { ...postData, userId },
        { returning: ["*"] },
      );
    }

    const array = Array.from({ length: howMany });
    return await (sql.from(PostWithUuid as any) as any).insertMany(
      array.map(() => ({ ...postData, userId })),
      { returning: ["*"] },
    );
  }

  static getCommonPostData(): Record<string, string> {
    return {
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraph(),
      shortDescription: faker.lorem.sentence(),
    };
  }
}
