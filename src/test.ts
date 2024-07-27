import { Metadata, Model } from "./Sql/Models/Model";
import { HasOne } from "./Sql/Models/Relations/HasOne";
import { HasMany } from "./Sql/Models/Relations/HasMany";
import { BelongsTo } from "./Sql/Models/Relations/BelongsTo";
import { DataSourceInput } from "./Datasource";
import { Migration } from "./Sql/Migrations/Migration";
import { SqlDataSource } from "./Sql/SqlDataSource";

class User extends Model {
  public id!: number;
  public name!: string;
  public email!: string;

  // public posts: HasMany | Post[] = new HasMany('posts', 'user_id');

  public static metadata: Metadata = {
    primaryKey: "id",
    tableName: "users",
  };
}

export async function testCreate() {
  // Postgres
  await User.useConnection(
    {
      type: "postgres",
      host: "localhost",
      username: "root",
      password: "root",
      database: "test",
      port: 5432,
      logs: true,
    },
    async () => {
      console.log("Postgres connection opened");

      const user = await User.create({
        name: "John Doe",
        email: "testoooo",
      });

      console.log(user);

      const users = await User.massiveCreate([
        {
          name: "Massive John Doe",
          email: " massive test",
        },
        {
          name: "Massive Jane Doe 2",
          email: " massive test",
        },
      ]);
      console.log(users);

      console.log("Postgres connection closed");
    },
  );

  // Mysql
  await User.useConnection(
    {
      type: "mysql",
      host: "localhost",
      username: "root",
      password: "root",
      database: "test",
      port: 3306,
      logs: true,
    },
    async () => {
      console.log("Mysql connection opened");

      const user = await User.create({
        name: "John Doe",
        email: "testoooo",
      });
      console.log(user);

      const users = await User.massiveCreate([
        {
          name: "Massive John Doe",
          email: " massive test",
        },
        {
          name: "Massive Jane Doe 2",
          email: " massive test",
        },
      ]);
      console.log(users);
      console.log("Mysql connection closed");
    },
  );
}

// class Post extends Model {
//   public id!: number;
//   public title!: string;
//   public content!: string;
//   public user_id!: number;

//   public user: HasOne | User = new HasOne('user', 'user_id');

//   public static metadata: Metadata = {
//     primaryKey: "id",
//     tableName: "posts",
//   };
// }

export async function testQuery() {
  // Postgres
  await User.useConnection(
    {
      type: "postgres",
      host: "localhost",
      username: "root",
      password: "root",
      database: "test",
      port: 5432,
      logs: true,
    },
    async () => {
      console.log("Postgres connection opened");

      // Basic find
      const userById = await User.find({
        where: {
          id: 1,
        },
      });

      // Query with limit
      const limitedUsers = await User.query().limit(4).many();

      // Complex where conditions
      const complexUsers = await User.query()
        .whereBuilder((queryBuilder) => {
          queryBuilder.andWhereBuilder((innerQueryBuilder) => {
            innerQueryBuilder.where("name", "John Doe");
            innerQueryBuilder.where("email", "john@gmail.com");
          });
          queryBuilder.orWhereBuilder((innerQuery) => {
            innerQuery.where("name", "Jane Doe");
            innerQuery.where("email", "jane@gmail.com");
          });
        })
        .many();

      // Order by
      const orderedUsers = await User.query().orderBy(["name"], "ASC").many();

      // Group by
      const groupedUsers = await User.query()
        .select("name", "COUNT(*) as count")
        .groupBy("id", "name")
        .many();

      // Having
      const havingUsers = await User.query()
        .select("name", "COUNT(*) as count")
        .groupBy("name")
        .many();

      // Pagination
      const paginatedUsers = await User.query().paginate(1, 10); // page - limit

      console.log(userById);
      console.log(limitedUsers);
      console.log(complexUsers);
      console.log(orderedUsers);
      console.log(groupedUsers);
      console.log(havingUsers);
      console.log(paginatedUsers);

      console.log("Postgres connection closed");
    },
  );

  // Mysql
  await User.useConnection(
    {
      type: "mysql",
      host: "localhost",
      username: "root",
      password: "root",
      database: "test",
      port: 3306,
      logs: true,
    },
    async () => {
      console.log("Mysql connection opened");

      // Basic find
      const userById = await User.find({
        where: {
          id: 1,
        },
      });

      // Query with limit
      const limitedUsers = await User.query().limit(2).many();

      // Complex where conditions
      const complexUsers = await User.query()
        .whereBuilder((queryBuilder) => {
          queryBuilder.andWhereBuilder((innerQueryBuilder) => {
            innerQueryBuilder.where("name", "John Doe");
            innerQueryBuilder.where("email", "john@gmail.com");
          });
          queryBuilder.orWhereBuilder((innerQuery) => {
            innerQuery.where("name", "Jane Doe");
            innerQuery.where("email", "jane@gmail.com");
          });
        })
        .many();

      // Order by
      const orderedUsers = await User.query().orderBy(["name"], "ASC").many();

      // Group by
      const groupedUsers = await User.query()
        .select("name", "COUNT(*) as count")
        .groupBy("name")
        .many();

      // Having
      const havingUsers = await User.query()
        .select("name", "COUNT(*) as count")
        .groupBy("name")
        .many();

      // Pagination
      const paginatedUsers = await User.query().paginate(1, 10); // page - limit

      console.log(userById);
      console.log(limitedUsers);
      console.log(complexUsers);
      console.log(orderedUsers);
      console.log(groupedUsers);
      console.log(havingUsers);
      console.log(paginatedUsers);

      console.log("Mysql connection closed");
    },
  );
}
