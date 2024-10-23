# Hysteria ORM Sql Documentation

- [Features](#features)
- [Prerequisites](#prerequisites)
    - [TypeScript Configuration](#typescript-configuration-example)
- [Environment Variables](#environment-variables)
    - [Complete env example](#complete-env-example)
- [Getting Started](#getting-started)
    - [Establishing a Connection](#establishing-a-connection)
    - [Use the Established connection](#use-the-connection)
        - [use-connection](#use-connection)
    - [Create a Model](#create-a-model)
    - [Create a Model with Relationships](#create-a-model-with-relations-and-hooks)
    - [UUID](#model-with-uuid)
    - [Case Convention](#case-convention)
    - [Upsert](#Upsert-methods)
    - [Create, Update and Delete (with transaction)](#create-update-and-delete-with-transaction)
    - [Use Transaction](#use-transaction)
    - [Read (standard methods used for simple queries)](#read-standard-methods-used-for-simple-queries)
    - [Query Builder](#query-builder)
    - [Where Builder](#where-builder)
    - [Aliases](#aliases)
    - [Dynamic Columns](#dynamic-columns)
    - [Count And Sum](#count-and-sum)
    - [Relations](#relations-retrieve)
    - [Join](#join)
    - [Pagination](#pagination)
    - [Standalone Query Builder](#standalone-query-builder)
- [Migrations](#migrations)
    - [hysteria-cli for Migrations](#hysteria-cli-for-migrations)
    - [Create Table](#create-table)
    - [Alter Table](#alter-table)
- [Experimental](#experimental)
    - [json-support](#json-support-unstable-on-mysql)

## Features

- **Simple Model Creation:** Define models that reflect your database schema with ease.
- **Database Support:** Currently supports MySQL, MariaDB and PostgreSQL.
- **Fast relations retrieve:** O(n) Complexity for relation retrieve
- **Simplicity:** Simple syntax to interact with your data

## Environment Variables

- Envs are used for both commands and database connection
- Connection details can still be override providing an input on `SqlDataSource.connect()` method

### Complete env example
```dotenv
MIGRATION_PATH=database/migrations # default /database/migrations, this env always referees to the root of the project
DB_TYPE=# mysql | postgres | mariadb | sqlite
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=root
DB_DATABASE=database
DB_PORT=3306 # default 3306 for Mysql and mariadb and 5432 for Postgres
DB_LOGS=true # default false
```

## Getting Started

### Establishing a Connection

```typescript
import { Sql_data_source, DataSourceInput } from "hysteria-orm";

const mysqlConfig: DataSourceInput = {
    type: 'mysql' | 'postgres' | 'mariadb' | 'sqlite',
    host: HOST,
    port: PORT,
    username: USERNAME,
    password: PASSWORD,
    database: DATABASE,
    logs: true, // query-logs (optional) - default: false
    pgOptions: {<Every pg client options>}
    mysqlOptions: {<Every mysql2 createConnection option>}
}

// For sqlite it's only needed the DB_DATABASE env that should be yor DATABASE.db file
const mysqlConfig: DataSourceInput = {
    type: 'sqlite',
    database: DATABASE,
    logs: true, // query-logs (optional) - default: false
}

// Config can be omitted, in that case envs will be used to enstablish the connection 
const sql = await SqlDataSource.connect(mysqlConfig, () => console.log("Connected to the database!"));
await sql.closeConnection();

// You can also only use the static connection method without the need of a connection instance
await SqlDataSource.connect(); // connects using envs
await SqlDataSource.disconnect(); // disconnects the connection
```

# Use the connection
```typescript
import { SqlDataSource } from "hysteria-orm";

// This is a singleton connection that can be used in the whole application
const sql = await SqlDataSource.connect();

// Raw query
const rawQuery = await sql.rawQuery("SELECT * FROM USERS")

// Get the raw driver connection
const connection = sql.getRawConnection();

// Start transactions
const trx = await sql.startTransaction();
```


# Use Connection
- Allows to execute operations on a separate database connection, useful for multi-database applications
- The hierarchy of the connection in the static Model methods is:
1) useConnection connection if passed as an argument
2) trx connection (the connection that created the trx) if passed as an argument
3) the main connection you can create with SqlDataSource.connect method

```typescript
import { SqlDataSource } from "hysteria-orm";
import { User } from "./User";

await SqlDataSource.useConnection(
    {
        type: "mysql",
        host: "localhost",
        database: "test",
        username: "root",
        password: "root",
    },
    async (sql) => {
        // You can get a model manager directly from the connection
        const userRepo = sql.getModelManager(User);

        const newUser = await userRepo.insert({
            name: "john",
            email: "john-email@gmail.com",
            signupSource: "google",
        } as User);

        const updatedUser = await userRepo.query().update({
            name: "new name",
        });

        // you can also use Model static methods specifying the connection they should use
        await User.query({ useConnection: sql })
    },
);
```

### Create a model

```typescript
import "reflect-metadata";
import { Model } from "hysteria-orm";
import { DateTime } from "luxon"; // Both Date and Datetime from luxon are supported

export class User extends Model {
    static tableName: string = "users"; // Default Class name lowercase, in snake case with a final "s" (given for granted that the Class is defined in Pascal Case)

    @column({ primaryKey: true })
    declare id: number;

    @column()
    declare name: string;

    @column()
    declare email: string;

    @column()
    declare signupSource: string;

    // Only useful with mysql to convert tiny int directly into Boolean
    @column({ booleanColumn: true })
    declare isActive: boolean;

    @column()
    declare json: Record<string, any>;

    @column()
    declare createdAt: DateTime;
}
```

### Create a model with relations and hooks

```typescript
import "reflect-metadata";
import { Model, Has_one, Has_many, column, hasOne, ModelQueryBuilder } from "hysteria-orm";
import { Profile } from "./Profile";
import { Post } from "./Post";

export class User extends Model {
    @column({ primaryKey: true })
    declare id: number;

    @column()
    declare name: string;

    @column()
    declare email: string;

    @column()
    declare signupSource: string;

    @column()
    declare isActive: boolean;

    @column()
    declare json: Record<string, any>;

    @column()
    declare createdAt: DateTime;

    // relations take as params (table, foreignKey)
    @hasOne(() => Profile, "userId")
    declare profile: Profile;

    /* 
    * You can pass a soft delete column with the relative type in order to remove those records while using query().addRelation method
    * Date soft COLUMN will be queried as AND column IS NULL, boolean soft delete column will be queried COLUMN = false instead
    */
    @hasMany(() => Post, "userId", { softDeleteColumn: "deletedAt", softDeleteType: "date" })
    declare posts: Post[];

    // Hooks
    static beforeFetch(queryBuilder: ModelQueryBuilder<User>) {
        queryBuilder.whereNull("deletedAt");
    }

    static async afterFetch(data: User[]): Promise<User[]> {
        if (!data.length) {
            return data;
        }

        return data.map((user) => {
            if (user.name) {
                user.name = user.name.toUpperCase();
            }

            return user;
        });
    }
}
```

### Model with uuid
- All databases support uuid but there are some things to make them work

##### UUID Model definition
```typescript
import "reflect-metadata";
import { Model, Has_one, Has_many, column, hasOne, ModelQueryBuilder } from "hysteria-orm";
import { Profile } from "./Profile";
import { Post } from "./Post";
import crypto from "crypto";

export class User extends Model {
    @column({ primaryKey: true })
    declare id: string;

    @column()
    declare createdAt: DateTime;

    // It's suggested to add a precise retrieve order in the queries or in the hooks
    static beforeFetch(queryBuilder: ModelQueryBuilder<User>) {
        queryBuilder.orderBy(["createdAt"], "ASC");
    }

    // UUIDs must be created prior to database interaction using the beforeInsert hook
    // insert and insertMany function naturally return the created records in creation order
    static beforeInsert(data: User): void {
        data.id = crypto.randomUUID();
    }
}
```

### Case Convention
- In Hysteria-orm the case convention is defined in the Model and it's extended to all columns in it
- Extra columns will be converted to the standard given by modelCaseConvention
- You can customize the case behavior for typescript Models and the Database

```typescript
export class User extends Model {
    static databaseCaseConvention: CaseConvention = "snake"; // default
    static modelCaseConvention: CaseConvention = "camel"; // Default
}

// where CaseConvention is defined as
type CaseConvention =
  | "camel" // All columns converted to camel case
  | "snake" // All columns converted to snake case
  | "none" // columns are treated as defined in the database and in the model
  | RegExp // Custom RegExp
  | ((column: string) => string); // Custom function
```

### Upsert Methods
```typescript
import { User } from "./User";

const firstOrCreate = await User.firstOrinsert(
    // search columns
    {
        email: "John@gmail.com",
    },
    // persist data
    {
        email: "John@gmail.com",
        name: "John",
        signupSource: "email",
    },
);

const createdOrUpdated = await User.upsert(
    // search columns
    {
        name: "Bob",
    },
    // persist data
    {
        name: "Bob",
        email: "Bob@gmail.com",
        signupSource: "email",
        isActive: true,
    },
);

const updatedOrdInsertedMany = await User.upsertMany(
    ["email"], // search columns
    // persist data
    [
        {
            name: "Kevin",
            email: "Kevin@gmail.com",
            signupSource: "google",
        },
        {
            name: "Kevin2",
            email: "Kevin2@gmail.com",
            signupSource: "google",
        },
    ],
);
```

### Create, Update and Delete (with transaction)
```typescript
import { User } from "./User";

// Transaction is optional in all those methods
const trx = await sql.startTransaction()
// Create
try{
    const newUser: User = await User.insert({
        name: "New User",
        email: "newUserEmaik@gmail.com"
    }, trx);

// Update
    newUser.name = "John Doe Updated";
    const updatedUser = await User.updateRecord(newUser, trx);

// Delete
    await User.deleteRecord(updatedUser, trx);

    await trx.commit();
} catch (error) {
    await trx.rollback();
    throw new Error(error);
}
```

### Use Transaction
```typescript
import { SqlDataSource } from "hysteria-orm";
import { User } from "./User";

const sql = await SqlDataSource.connect();

// At the end of the transaction the trx will be automatically committed, it's also automatically rolled back in case of an error
await sql.useTransaction(async (trx) => {
    const user = await User.query({ trx }).delete();
});
```

### Read (standard methods used for simple queries)

```typescript
import { User } from "./User";

// Get all
const users: User[] = await userManager.find();

// Get with optional parameters
// params in select, where and relations are partially type safe with the columns and relations of the Model, for more elastic queries use the query builder
const filteredUsers: User[] = await User.find({
    relations: ["profile"], // only Model defined relations can be used
    where: {
        name: "John Doe"
    },
    orderBy: {
        name: "ASC"
    },
    limit: 10,
    offset: 0
});

// Get by pk requires a primary key to exist on the model in order to work
const user: User | null = await User.findOneByPrimaryKey(5, { throwErrorOnNull: true });

// Get One
const otherUser: User | null = await User.findOne({
    where: {
        id: 1,
        name: "John Doe"
    }
});
```

### Query-builder

- It's used to create more complex queries that are not supported by the standard methods
- all select-where-relations-orderby columns are partially type safe, they can both be a specific column in the Model or a string
- You can also use the query builder for bulk updates and deleted

```typescript
import { User } from "./User";

// READ
const user: User | null = await User.query()
    .addRelations(['post'])
    .where("name", "John Doe")
    .andWhere("email", "john@gmail.com")
    .oneOrFail();

const users: User[] = await User.query()
    .where("name", "John Doe")
    .andWhere("email", "john@gmail.com")
    .orderBy("name", "ASC")
    .limit(10)
    .many();


// BULK UPDATE
await User.query()
    .where("name", "Micheal")
    .update({ name: "Micheal Updated" });

// BULK DELETE
await User.query().where("name", "Eve updated two").delete();

// BULK SOFT DELETE
await User.query().where("name", "Eve updated two").softDelete({
    column: "deletedAt" // default,
    value: string | number | boolean // default Datetime.local().toISO(),
    // trx: optional
});
```

### When condition
- Given a value, it accepts a callback that gives the value itself and the current query builder
- The callback will be called only if the value exists (not null or undefined)
```typescript
import { User } from "./User";

const falseValue = false;
const trueValue = 1;
const user = await User.query()
// Will enter here
await User.query().when(trueValue, (value, query) => {
    query.where("id", 1);
})
.one();

// Won't enter here
await User.query().when(falseValue, (value, query) => {
    query.where("id", 1);
})
.one();
```


### Where Builder

- Used to build complex logic conditions
```typescript
import { User } from "./User";

const user: User | null = await User.query().whereBuilder((queryBuilder) => {
    queryBuilder.andWhereBuilder((innerQueryBuilder) => {
        innerQueryBuilder.where('department', 'sales');
        innerQueryBuilder.where('hired_date', '>=', '2020-01-01');
    });
    queryBuilder.orWhereBuilder((innerQuery) => {
        innerQuery.where('department', 'engineering');
        innerQuery.where('hired_date', '>=', '2022-01-01');
    });
    queryBuilder.where('is_active', true);
});
```

## Ignore Hooks
- In both standard read methods and select query (pagination included) builders it's possible to ignore hooks
- This is not available for findOneByPrimaryKey method
```typescript
const userFind = await User.find({ ignoreHooks: ["beforeFetch"] });
const userOne = await User.query().one({ ignoreHooks: ["afterFetch"] });
```

### Aliases

- Aliases are available in the query builder, for example select('new as newName') will generate an alias in the extraColumns property that every model instances has
```typescript
import { User } from "./User";

const user: User | null = await User.query()
    .select('id', 'name as superName')
    .addRelations(['post'])
    .where("name", "John Doe")
    .andWhere("email", "john@gmail.com")
    .one();
```

### Dynamic Columns
- For columns that are not in the Table that have to be computed dynamically you can use @dynamicColumn decorator
- Those columns are meant to be made in the last part of a query as a final result
```typescript
import {
  column,
  dynamicColumn,
} from "hysteria";
import { Model } from "../../../src/sql/Models/Model";

export class User extends Model {
  @column({ primaryKey: true })
  declare id: string;

  @column()
  declare name: string;

  @column()
  declare email: string;

  @dynamicColumn("test")
  getTest() {
    return "test";
  }
}

// You can add dynamic columns in a query
const model: User = await User.query().addDynamicColumns(["getTest"]).one();

// Or inject them directly in a Model | Model[] | PaginatedModel
const userWithDynamicColumn = await User.addDynamicColumns(user, [
"getTest",
]);
```

### Count and Sum

- Quick count and sum methods
```typescript
import { User } from "./User";

// You can specify if ignore hooks like beforeFetch
const count = await User.query().getCount({ ignoreHooks: false }); // number
const sum = await User.query().getSum("id"); // number
```

### Relations Retrieve

- Relations can be retrieved both from Standard methods and the query builder
- Those retrieves are especially fast since for each relation a single db query is made and the retrieve of each relation for each model is made in O(n)
- Based on the relation type can be retrieved both a list (Has_many) or a single record (Belongs_to, Has_one)
- Those are special queries that are not influenced by hooks defined in their classes

```typescript
import { User } from "./User";

const user: User | null = await User.query()
    .addRelations(['posts'])
    .one();

const users: User[] = await User.find({
    relations: ["profile"],
});
```

### Join

```typescript
import { User } from "./User";

const users = await User.query()
    .select("users.*")
    .leftJoin("posts", "users.id", "posts.user_id")
    .where('users.id', 1)
    .orderBy(['users.id'], "ASC")
    .many();
```

### Pagination

- Pagination is available in the queryBuilder, will return an object with the metadata for the pagination and the list of the retrieved models
```typescript
import { User } from "./User";

const user: User | null = await User.query()
    .addRelations(['post'])
    .where("name", "John Doe")
    .andWhere("email", "john@gmail.com")
    .paginate(1, 10); // page, for-page
```

### Standalone Query Builder
- You may not want an ORM overhead in you project, but using raw query can be not scalable and difficult to maintain
- In this case you can use the StandaloneQueryBuilder that does not need a connection to a database and only returns the query and the params for the selected database
- You can then use the query and the params directly on the database driver

```typescript
import { StandaloneQueryBuilder } from "hysteria-orm";

const userQueryBuilder = new StandaloneQueryBuilder("mysql", "users");
const { query, params } = userQueryBuilder
.whereBuilder((builder) => {
    builder.where("id", 1);
    builder.orWhere("name", "John");
    builder.andWhereBuilder((builder) => {
    builder.where("signup_date", "2021-01-01");
    builder.orWhere("signup_date", "2021-01-02");
    });
})
.getCurrentQuery();

// You can also specify case convention for model and database
const userQueryBuilder = new StandaloneQueryBuilder("postgres", "users", "camel", "snake");
const { query, params } = userQueryBuilder
.whereBuilder((builder) => {
    builder.where("id", 1);
    builder.orWhere("name", "John");
    builder.andWhereBuilder((builder) => {
    builder.where("signup_date", "2021-01-01");
    builder.orWhere("signup_date", "2021-01-02");
    });
})
.getCurrentQuery();

// Example of couple { query, params }

// query = SELECT * FROM users WHERE (id = $1 OR name = $2 AND signup_date = $3 OR signup_date = $4) 
// params = [ 1, 'John', '2021-01-01', '2021-01-02' ]
```

# Migrations
- Migrations are meant to be executed in a Typescript environment because migration files and the migration cli are standalone feature that do not need to be built in js
- Migration Cli should be used in the root of the project
- You do not need to have Typescript installed in order to run the migration cli
- Migrations cli starts from the current user location (process.cwd) and appends the path/to/migrations (default `database/migrations`), this can be customized with `MIGRATION_PATH` environment variable

## hysteria-orm-cli for Migrations

1) (npm run | yarn run) hysteria create:migration <name>
2) (npm run | yarn run) hysteria run:migrations
3) (npm run | yarn run) hysteria rollback:migrations

## create:migration <name>
- Creates a migration in the migrations folder
- If the creation folder specified in the .env (or the default one database/migrations) it will be created automatically

## run:migrations
- Runs all pending migrations <optional - migration_file_name>
- If the migration file name is specified then migrations will be run until that migration

## rollback:migrations
- Rollbacks all existing migrations <optional - migration_file_name>
- If the migration file name is specified then migrations will be rolled back from the last migration until that migration

## Create Table

```typescript
import { Migration } from "hysteria-orm";
import { Post } from "../Models/Post";

export default class extends Migration {
    up(): void {
        this.schema.createTable('posts', { ifNotExists: true })
            .newColumn().bigint('id').autoIncrement().primary()
            .newColumn().bigint('user_id').references('users', 'id')
            .newColumn().varchar('name', 255).notNullable()
            .commit();

        this.schema.rawQuery('CREATE INDEX posts_name_idx ON posts (name)');

        // Hooks for after up and down migrations are executed immediately after the relative migration file is executed
        this.afterUp = async () => {
            console.log('Creating user...')
            await User.insert({
                name: 'John Doe',
                email: 'john@gmail.com',
                signupSource: 'web',
                isActive: true,
            })

            console.log('User created.')
            console.log(await User.query().many())
        }
    }

    down(): void {
        this.schema.dropTable('posts');
        this.afterDown = async () => { /* After down logic here*/ }
    }
}
```

## Alter Table

```typescript
import { Migration } from "hysteria-orm";

export default class extends Migration {
    up(): void {
        this.schema.alterTable('users')
            .dropColumn('email')
            .addColumn('email', 'varchar', { length: 255, notNullable: true, unique: true, after: 'name' })
            .commit();
    }

    down(): void {
        this.schema.alterTable('users')
            .dropColumn('email')
            .addColumn('email', 'varchar', { length: 255, notNullable: true })
            .commit();
    }
}
```

# Experimental

## JSON support (UNSTABLE ON MYSQL)

- It's advices to use JSON only on POSTGRESQL
- It could be necessary to use raw queries on mysql and mariadb

```typescript
import { User} from "./User";

// You can query directly on the model using an object
const jsonQuery = await User.query().where("json_prop", { main: "value" }).one();

// Contains
const jsonQueryContains = await User.query()
    .where("json_prop",  ">", { main: "value" })
    .one();

// Does not contain
const jsonQueryContains = await User.query()
    .where("json_prop", "<", { main: "value" })
    .one();

// Create new users
const newUsers = await User.insertMany([
    {
        name: "John Doe",
        email: "test@gmail.com",
        signupSource: "google",
        json: { key: "value" },
        isActive: true,
    },
    {
        name: "Jane Doe",
        email: "test2@gmail.com",
        signupSource: "google",
        json: { key: "value" },
        isActive: true,
    },
]);

// Update all users
const newJsonUser = await User.query().update({
    json: {
        foo: "bar",
        bar: "foo",
    },
});

// Delete every instance that contains the properties in the json column
const deletedUsers = await User.query()
    .where("json", {
            foo: "bar",
            bar: "foo",
        },
        ">",
    )
    .delete();
```
