import { SqlDataSource } from "../../../../src/sql/sql_data_source";
import { UserAddressWithBigint } from "../bigint/user_address_bigint";
import { UserAddressWithUuid } from "../uuid/user_address_uuid";

export class UserAddressFactory {
  static async userAddressWithUuid<T extends number>(
    sql: SqlDataSource,
    howMany: T,
    userId: string,
    addressId: string,
  ) {
    if (howMany === 1) {
      return await (sql.from(UserAddressWithUuid as any) as any).insert(
        { userId, addressId },
        { returning: ["*"] },
      );
    }

    const array = Array.from({ length: howMany });
    return await (sql.from(UserAddressWithUuid as any) as any).insertMany(
      array.map(() => ({ userId, addressId })),
      { returning: ["*"] },
    );
  }

  static async userAddressWithBigint<T extends number>(
    sql: SqlDataSource,
    howMany: T,
    userId: number,
    addressId: number,
  ) {
    if (howMany === 1) {
      return await (sql.from(UserAddressWithBigint as any) as any).insert(
        { userId, addressId },
        { returning: ["*"] },
      );
    }

    const array = Array.from({ length: howMany });
    return await (sql.from(UserAddressWithBigint as any) as any).insertMany(
      array.map(() => ({ userId, addressId })),
      { returning: ["*"] },
    );
  }
}
