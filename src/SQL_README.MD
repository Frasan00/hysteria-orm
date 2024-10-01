# Hysteria ORM Sql Documentation

- [Installation](#installation)
- [Features](#features)
- [Prerequisites](#prerequisites)
    - [TypeScript Configuration](#typescript-configuration-example)
- [Environment Variables](#environment-variables)
    - [Complete env example](#complete-env-example)
- [Getting Started](#getting-started)
    - [Establishing a Connection](#establishing-a-connection)
        - [use-connection](#use-connection)
    - [Create a Model](#create-a-model)
    - [Create a Model with Relationships](#create-a-model-with-relations-and-hooks)
    - [Case Convention](#case-convention)
    - [Upsert](#Upsert-methods)
    - [Read (standard methods used for simple queries)](#read-standard-methods-used-for-simple-queries)
    - [Query Builder](#query-builder)
    - [Where Builder](#where-builder)
    - [Aliases](#aliases)
    - [Dynamic Columns](#dynamic-columns)
    - [Count And Sum](#count-and-sum)
    - [Relations](#relations-retrieve)
    - [Join](#join)
    - [Pagination](#pagination)
- [Migrations](#migrations)
    - [hysteria-cli for Migrations](#hysteria-cli-for-migrations)
    - [Create Table](#create-table)
    - [Alter Table](#alter-table)
- [Experimental](#experimental)
    - [json-support](#json-support-unstable-on-mysql)

## Installation
```shell
    npm install hysteria-orm
    
    yarn add hysteria-orm
```

## Features

- **Simple Model Creation:** Define models that reflect your database schema with ease.
- **Database Support:** Currently supports MySQL, MariaDB and PostgreSQL.
- **Fast relations retrieve:** O(n) Complexity for relation retrieve
- **Simplicity:** Simple syntax to interact with your data

## Prerequisites

- A JavaScript runtime environment (e.g., Node.js).
- Official types version used for each driver, you must use a driver version that is compatible with those:
```json
"@types/mssql": "^9.1.5",
"@types/node": "^22.2.0",
"@types/pg": "^8.10.9",
"@types/sqlite3": "^3.1.11",
```

### TypeScript Configuration example

```json 
{
  "compilerOptions": {
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "module": "commonjs",
    "outDir": "lib",
    "rootDirs": ["src", "test"],
    "skipLibCheck": true,
    "strict": true,
    "target": "ES2020",
    "moduleResolution": "node",
    "declaration": true,
    // Must set decorators support
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
  },
  "include": ["src/**/*.ts", "test/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## Environment Variables

- Envs are used for both commands and for database connection
- Connection details can still be override providing an input on `SqlDataSource.connect()` method

### Complete env example
```dotenv
MIGRATION_PATH=database/migrations # default /database/migrations, this env always referees to the root of the project
DB_TYPE=# mysql | postgres | mariadb | sqlite | mssql
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
import { SqlDataSource, DataSourceInput } from "hysteria-orm";

const mysqlConfig: DataSourceInput = {
    type: 'mysql' | 'postgres' | 'mariadb' | 'sqlite' | 'mssql',
    host: HOST,
    port: PORT,
    username: USERNAME,
    password: PASSWORD,
    database: DATABASE,
    logs: true, // query-logs (optional) - default: false
    mssqlOptions: {<Every mssql option>}
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
const sql = await SqlDataSource.connect(mysqlConfig, () => console.log("Connected to the database"));
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

        const updatedUser = await userRepo.update().withData({
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
import { Model, HasOne, HasMany, column, hasOne, ModelQueryBuilder } from "hysteria-orm";
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

    // Relations take as params (table, foreignKey)
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

    static beforeInsert(data: User): User {
        data.isActive = true;
        return data;
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

### Case Convention
- In Hysteria-orm the case convention is defined in the Model and it's extended to all columns in it
- Extra columns will be converted to the standard given by modelCaseConvention
- You can customize the behavior of the database interactions with

```typescript
export class User extends Model {
    static databaseCaseConvention: CaseConvention = "snake"; // default
    static modelCaseConvention: CaseConvention = "camel"; // Default
}

// where CaseConvention is defined as
type CaseConvention =
  | "camel" // All columns converted to camel case
  | "snake" // All columns converted to snake case
  | "none" // Columns are treated as defined in the database and in the model
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
const models = await User.update()
    .where("name", "Micheal")
    .withData({ name: "Micheal Updated" });

// BULK DELETE
await User.deleteQuery().where("name", "Eve updated two").delete();

// BULK SOFT DELETE
await User.deleteQuery().where("name", "Eve updated two").softDelete({
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
import { Model } from "../../../src/Sql/Models/Model";

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
- Based on the relation type can be retrieved both a list (HasMany) or a single record (BelongsTo, HasOne)
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

# Migrations
- Migrations are meant to be executed in a Typescript environment because migration files and the migration cli are standalone feature that do not need to be built in js
- You do not need to have Typescript installed in order to run the migration cli

## hysteria-orm-cli for Migrations

1) (npm run | yarn run) hysteria create:migration {migrationName}
2) (npm run | yarn run) hysteria run:migrations
3) (npm run | yarn run) hysteria rollback:migrations


## Create Table

```typescript
import { Migration } from "hysteria-orm";
import { Post } from "../Models/Post";

export default class extends Migration {
    public up(): void {
        this.schema.createTable('posts', { ifNotExists: true })
            .newColumn().bigint('id').autoIncrement().primary()
            .newColumn().bigint('user_id').references('users', 'id')
            .newColumn().varchar('name', 255).notNullable()
            .commit();

        this.schema.rawQuery('CREATE INDEX posts_name_idx ON posts (name)');
    }

    public down(): void {
        this.schema.dropTable('posts');
    }

    // Hooks for after up and down migrations are executed immediately after the relative migration method is executed
    public async afterUp(): Promise<void> {
        await Post.insert({
            name: "post 1",
            userId: 1,
        });
    }

    public async afterDown(): Promise<void> {
        // after down logic here
    }
}
```

## Alter Table

```typescript
import { Migration } from "hysteria-orm";

export default class extends Migration {
    public up(): void {
        this.schema.alterTable('users')
            .dropColumn('email')
            .addColumn('email', 'varchar', { length: 255, notNullable: true, unique: true, after: 'name' })
            .commit();
    }

    public down(): void {
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
const newJsonUser = await User.update().withData({
    json: {
        foo: "bar",
        bar: "foo",
    },
});

// Delete every instance that contains the properties in the json column
const deletedUsers = await User.deleteQuery()
    .where("json", {
            foo: "bar",
            bar: "foo",
        },
        ">",
    )
    .delete();
```