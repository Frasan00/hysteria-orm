#!/usr/bin/env node

import { column, Metadata, Model } from "./Sql/Models/Model";
import { HasOne } from "./Sql/Models/Relations/HasOne";
import { HasMany } from "./Sql/Models/Relations/HasMany";
import { BelongsTo } from "./Sql/Models/Relations/BelongsTo";
import { DataSourceInput } from "./Datasource";
import { Relation } from "./Sql/Models/Relations/Relation";
import { Migration } from "./Sql/Migrations/Migration";
import { SqlDataSource } from "./Sql/SqlDatasource";
import { User } from "./test";
import {
  QueryBuilders,
  UpdateQueryBuilders,
  DeleteQueryBuilders,
} from "./Sql/QueryBuilder/QueryBuilder";
import "reflect-metadata";

(async () => {
  await SqlDataSource.connect();

  // const newUser = await User.create({
  //   name: "gianni 2",
  //   email: "gianni2@gmail.com",
  //   signupSource: "mdfakofmad",
  // });

  // console.log(newUser);
  // const updatedUser = await User.update().withData({
  //   name: "new gianni 2",
  // });
  // console.log(updatedUser);

  // console.log(
  //   await User.delete().where("name", "new gianni 2").performDelete(),
  // );

  await SqlDataSource.useConnection(
    {
      type: "mysql",
      host: "localhost",
      database: "test",
      username: "root",
      password: "root",
    },
    async (sql) => {
      const userRepo = sql.getModelManager<User>(User);

      const newUser = await userRepo.create({
        name: "john",
        email: "john-email@gmail.com",
        signupSource: "google",
      } as User);
      console.log(newUser);

      const updatedUser = await userRepo.update().withData({
        name: "new name",
      });
      console.log(updatedUser);
    },
  );
  process.exit(0);
})();

export {
  Model,
  column,
  Relation,
  HasOne,
  HasMany,
  BelongsTo,
  SqlDataSource,
  DataSourceInput,
  QueryBuilders,
  UpdateQueryBuilders,
  DeleteQueryBuilders,
  Migration,
};
