import { faker } from "@faker-js/faker";
import { SqlDataSource } from "../../../../src/sql/sql_data_source";
import { AddressWithBigint } from "../bigint/address_bigint";
import { AddressWithUuid } from "../uuid/address_uuid";

export class AddressFactory {
  static async addressWithBigint<T extends number>(
    sql: SqlDataSource,
    howMany: T,
  ) {
    const addressData = AddressFactory.getCommonAddressData();
    if (howMany === 1) {
      return await (sql.from(AddressWithBigint as any) as any).insert(
        addressData,
        { returning: ["*"] },
      );
    }

    const array = Array.from({ length: howMany });
    return await (sql.from(AddressWithBigint as any) as any).insertMany(
      array.map(() => ({ ...addressData })),
      { returning: ["*"] },
    );
  }

  static async addressWithUuid<T extends number>(
    sql: SqlDataSource,
    howMany: T,
  ) {
    const addressData = AddressFactory.getCommonAddressData();
    if (howMany === 1) {
      return await (sql.from(AddressWithUuid as any) as any).insert(
        addressData,
        { returning: ["*"] },
      );
    }

    const array = Array.from({ length: howMany });
    return await (sql.from(AddressWithUuid as any) as any).insertMany(
      array.map(() => ({ ...addressData })),
      { returning: ["*"] },
    );
  }

  static getCommonAddressData() {
    return {
      street: faker.location.street(),
      city: faker.location.city(),
      state: faker.location.state(),
      zip: faker.location.zipCode(),
      country: faker.location.country(),
    };
  }
}
