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
  public signupSource!: string;

  public posts: HasMany | Post[] = new HasMany("posts", "user_id");

  public static metadata: Metadata = {
    primaryKey: "id",
    tableName: "users",
  };
}

// TODO test with trx and relations
class Post extends Model {
  public id!: number;
  public title!: string;
  public content!: string;
  public user_id!: number;

  public user: HasOne | User = new HasOne("user", "user_id");

  public static metadata: Metadata = {
    primaryKey: "id",
    tableName: "posts",
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

export async function testUpdate() {
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

      const users = await User.update().where("id", 1).withData({
        name: "John Doe Updated",
        email: "testoooo",
      });
      console.log(users);

      const user = await User.query().first();
      if (!user) {
        console.log("No user found");
        return;
      }

      console.log(user);
      User.setProps(user, {
        name: "John Doe Updated",
        email: "testoooo",
      });

      await User.updateRecord(user);
      console.log(user);

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

      const users = await User.update().where("id", 1).withData({
        name: "John Doe Updated",
        email: "testoooo",
      });
      console.log(users);

      const user = await User.query().first();
      if (!user) {
        console.log("No user found");
        return;
      }

      console.log(user);
      User.setProps(user, {
        name: "John Doe Updated",
        email: "testoooo",
      });

      await User.updateRecord(user);
      console.log(user);

      console.log("Mysql connection closed");
    },
  );
}

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

      const firstUser = await User.query().select("*").first();

      // Basic find
      const userById = await User.find({
        where: {
          id: 1,
        },
      });

      // Query with limit
      const limitedUsers = await User.query().limit(4).many();

      // Query with custom column fullName
      const usersWithFullName = await User.query()
        .selectRaw("CONCAT(name, ' ', email) as fullName")
        .one();

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
        .selectRaw("name", "COUNT(*) as count")
        .groupBy("id", "name")
        .many();

      // Having
      const havingUsers = await User.query()
        .selectRaw("name", "COUNT(*) as count")
        .groupBy("name")
        .many();

      // Pagination
      const paginatedUsers = await User.query()
        .whereNotNull("signupSource")
        .paginate(1, 10); // page - limit

      console.log("userById:", userById);
      console.log("limitedUsers:", limitedUsers);
      console.log("complexUsers:", complexUsers);
      console.log("orderedUsers:", orderedUsers);
      console.log("groupedUsers:", groupedUsers);
      console.log("havingUsers:", havingUsers);
      console.log("paginatedUsers:", paginatedUsers);
      console.log("usersWithFullName:", usersWithFullName);
      console.log("firstUser:", firstUser);

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

      const firstUser = await User.query().first();

      // Basic find
      const userById = await User.find({
        where: {
          id: 1,
        },
      });

      // Query with limit
      const limitedUsers = await User.query().limit(2).many();

      // Query with custom column fullName
      const usersWithFullName = await User.query()
        .selectRaw("CONCAT(name, ' ', email) as fullName")
        .one();

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
        .selectRaw("name", "COUNT(*) as count")
        .groupBy("name")
        .many();

      // Having
      const havingUsers = await User.query()
        .selectRaw("name", "COUNT(*) as count")
        .groupBy("name")
        .many();

      // Pagination
      const paginatedUsers = await User.query().paginate(1, 10); // page - limit

      console.log("userById:", userById);
      console.log("limitedUsers:", limitedUsers);
      console.log("complexUsers:", complexUsers);
      console.log("orderedUsers:", orderedUsers);
      console.log("groupedUsers:", groupedUsers);
      console.log("havingUsers:", havingUsers);
      console.log("paginatedUsers:", paginatedUsers);
      console.log("usersWithFullName:", usersWithFullName);
      console.log("firstUser:", firstUser);

      console.log("Mysql connection closed");
    },
  );
}
