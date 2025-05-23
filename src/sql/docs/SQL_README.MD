# Hysteria ORM Sql Documentation

- [Features](#features)
- [Setup](#setup)
    - [Driver installation](#driver-installation)
- [Environment Variables](#environment-variables)
    - [Complete env example](#complete-env-example)
- [Getting Started](#getting-started)
    - [Establishing a Connection](#establishing-a-connection)
    - [Use the Established connection](#use-the-connection)
        - [use-connection](#use-connection)
    - [Columns](#columns)
    - [Create a Model](#create-a-model)
    - [Create a Model with Hooks](#create-a-model-with-hooks)
    - [UUID](#model-with-uuid)
        - [Model definition](#model-definition)
    - [Relations](#relations)
        - [Has One](#has-one)
        - [Belongs To](#belongs-to)
        - [Has Many](#has-many)
        - [Many To Many](#many-to-many)
        - [Relation query Builder](#relation-query)
    - [Model Factory] (#model-factory)
    - [Case Convention](#case-convention)
    - [Upsert](#Upsert-methods)
    - [Transactions](#transactions)
    - [Create, Update and Delete (with transaction)](#create-update-and-delete-with-transaction)
    - [Use Transaction](#use-transaction)
    - [Read (standard methods used for simple queries)](#read-standard-methods-used-for-simple-queries)
    - [Query Builder](#query-builder)
    - [Where Builder](#where-builder)
    - [Where Sub Query](#where-sub-query)
    - [Aliases](#aliases)
    - [SQL Functions](#sql-functions)
    - [Join](#join)
    - [CTE](#common-table-expressions-cte)
    - [union](#union-and-union-all)
    - [Pagination](#pagination)
    - [Standalone Query Builder](#standalone-query-builder)
- [Migrations](#migrations)
    - [hysteria-cli for Migrations](#hysteria-orm-cli-for-migrations)
    - [Run Migrations Programmatically](#run-migrations-programmatically)
    - [Create Table](#create-table)
    - [Alter Table](#alter-table)
    - [Migration Query Builder](#migration-query-builder)
    - [Run SQL](#run-sql-file-in-migrations)
    - [Run SQL from cli](#run-sql-from-cli)
- [Experimental](#experimental)
    - [json-support](#json-support-unstable-on-mysql)

## Features

- **Simple Model Creation:** Define models that reflect your database schema with ease.
- **Database Support:** Currently supports MySQL, MariaDB, PostgreSQL and SQLite.
- **Fast relations retrieve:** O(n) Complexity for relation retrieve
- **Simplicity:** Simple syntax to interact with your data

## Setup
### Driver installation
- You must install the driver for your database in order to use the ORM
- Supported drivers are:
```bash
### Mysql or MariaDB
npm install mysql2
yarn add mysql2

### Postgres or cockroachdb
npm install pg
yarn add pg

### SQLite
npm install sqlite3
yarn add sqlite3
```


## Environment Variables

- Envs are used for both commands and database connection
- Connection details can still be override providing an input on `SqlDataSource.connect()` method

### Complete env example
```dotenv
MIGRATION_PATH=migrations # default /migrations, this env always referees to the root of the project
DB_TYPE=# mysql | postgres | mariadb | sqlite | cockroachdb
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=root
DB_DATABASE=database
DB_PORT=3306 # default 3306 for Mysql and mariadb and 5432 for Postgres
DB_LOGS=true # default false
```

# Getting Started

### Establishing a Connection

```typescript
import { SqlDataSource, DataSourceInput } from "hysteria-orm";

const mysqlConfig: DataSourceInput = {
    type: 'mysql' | 'postgres' | 'mariadb' | 'cockroachdb',
    host: HOST,
    port: PORT,
    username: USERNAME,
    password: PASSWORD,
    database: DATABASE,
    driverOptions: <Current Driver Specific Options>
    logs: true, // query-logs (optional) - default: false
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
await SqlDataSource.connect(() => console.log("Connected to the database!"));
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

### Columns
- Columns are defined in the Model with the @column decorator
- You can customize the column behavior with some options
```typescript
import { column } from "hysteria-orm";

// Basic column
@column()
declare name: string;

// Primary key
@column({ primaryKey: true })
declare id: number;

// hidden column
@column({ hidden: true })
declare password: string;

// hooks
@column({
    serialize: (value: any) => value.toUpperCase(), // after fetch
    prepare: (value: any) => value.toLowerCase(), // before insert or update
})
declare email: string;
```

### Create a model

```typescript
import { Model, column, dateColumn } from "hysteria-orm";

export class User extends Model {
    // setter for the table name that can be retrieved with the static table property
    static _table: string = "users"; // Default Class name lowercase, in snake case and in the plural form

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

    // Automatically handles Date parsing
    @dateColumn()
    declare createdAt: Date;
}
```

### Create a model with hooks

```typescript
import "reflect-metadata";
import { Model, HasOne, HasMany, column, hasOne, manyToMany, ModelQueryBuilder } from "hysteria-orm";
import { Profile } from "./Profile";
import { Post } from "./Post";
import { Address } from "./Address";

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

    // Date columns will be automatically converted to selected type, if not specified they will not be parsed from the database driver
    @column()
    declare createdAt: Date;

    @column()
    declare updatedAt: Date;

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

### Model with UUID
- Uuids as primary keys can be defined as autogenerated in the migrations directly by the database using `autoGeneratedUUID`, It's suggested to do It only with postgres, since mysql does not have a returning Function there Is no way to know the IDS inserted by mysql fornthe primary Key After the inserti query
- So, it'adviced to use the beforeInsert hook and manually insert and uuid directly in the Model before saving It to the database

##### Model definition
```typescript
import "reflect-metadata";
import { Model, HasOne, HasMany, column, hasOne, ModelQueryBuilder } from "hysteria-orm";
import { Profile } from "./Profile";
import { Post } from "./Post";
import crypto from "crypto";

export class User extends Model {
    @column({ primaryKey: true })
    declare id: string;

    @column()
    declare createdAt: Date;

    // It's suggested to add a precise retrieve order in the queries or in the hooks
    static beforeFetch(queryBuilder: ModelQueryBuilder<User>) {
        queryBuilder.orderBy("createdAt", "asc");
    }

    // UUIDs must be created prior to database interaction using the beforeInsert hook
    static beforeInsert(data: User): void {
        data.id = crypto.randomUUID();
    }
}
```

### Relations
- Relations are defined in the Model and can be retrieved with the `with` method in the query builder or with the relations property in the standard methods
- Relations are special standard queries that are not influenced by hooks defined in their classes
- Relation queries are made in O(n) complexity, even many to many relations are retrieved in a single query, but complexity may very based on the additional operations like hooks
- Supported relations are
    - has one - Has one record in relation with the related Model and the foreign key is in the related Model
    - belongs to - Belongs to one record in relation with the related Model and the foreign key is in the current Model
    - has many - Has many records in relation with the related Model and the foreign key is in the related Model
    - many to many - Many to many records in relation with the related Model and the foreign key is in a join table that has the primary key of the two Models

#### Has One
```typescript
import { Model, column, hasOne } from "hysteria-orm";
import { Profile } from "./Profile";

export class User extends Model {
    @column({ primaryKey: true })
    declare id: number;

    @column()
    declare name: string;

    @hasOne(() => Profile, "userId")
    declare profile: Profile;
}
```

#### Belongs To
```typescript
import { Model, column, belongsTo } from "hysteria-orm";

export class Profile extends Model {
    @column({ primaryKey: true })
    declare id: number;

    @column()
    declare userId: number;

    @column()
    declare bio: string;

    @belongsTo(() => User, "userId")
    declare user: User;
}
```

#### Has Many
```typescript
import { Model, column, hasMany } from "hysteria-orm";
import { Post } from "./Post";

export class User extends Model {
    @column({ primaryKey: true })
    declare id: number;

    @column()
    declare name: string;

    @hasMany(() => Post, "userId")
    declare posts: Post[];
}
```

#### Many To Many
- Many to many is a special relation that requires a pivot table to be defined
```typescript
import { Model, column, manyToMany } from "hysteria-orm";
import { Address } from "./Address";
import { AddressUser } from "./AddressUser";

export class User extends Model {
    @column({ primaryKey: true })
    declare id: number;

    @column()
    declare name: string;

    // Many to many relations, params: (table, pivotTable, localForeignKey)
    @manyToMany(() => Address, "user_addresses", "userId")
    declare addresses: Address[];

    // Can use a Model instance to define the pivot table
    @manyToMany(() => Address, () => AddressUser, "userId")
    declare addresses: Address[];
}
```

#### Relation query
- in the query builder, you can query the relations directly from the with method
- Relation queries have to be contextualized, for example all order by or limit condition will be ignored in a has one relation query because it's can only be a single record for it's definition
- The result is naturally affected by the target beforeFetch and afterFetch hooks, but they can be ignored with the ignoreHooks property
- In a many to many query in order to use functions in the select you must use the OVER() function
```typescript
import { ModelQueryBuilder } from "hysteria-orm";
import { User } from "./User";
import { Post } from "./Post";
import { Address } from "./Address";

const user: User | null = await User.query()
    .with('post', Post, (query: ModelQueryBuilder<Post>) => {
        query.where("title", "Post title");
    })
    .where("name", "John Doe")
    .one();

// You can also query on the join table
// In the select and where conditions, if the table is not specified, the related model table will be used
const user: User | null = await User.query()
    .with('address', Address, (query: ModelQueryBuilder<Address>) => {
        query.where("street", "Main street") // will use address table for the query: addresses.street = 'Main street'
            .andWhere("user_addresses.primary", true);
    })
    .where("name", "John Doe")
    .one();

// You can also ignore hooks
const user: User | null = await User.query()
    .with('post', Post, (query: ModelQueryBuilder<Post>) => {
        query.where("title", "Post title");
    }, { beforeFetch: true, afterFetch: true })
    .where("name", "John Doe")
    .one();

// many to many query
    await User.query()
      .where("id", user?.id as number)
      .with("addresses", Address, (query) =>
        query
          .select(
            // You can select and filter on the pivot table or on the related table
            "user_addresses.id as pivotId",
            "addresses.id",
            "street",
            "state",
            // Must use OVER() function in order to use functions in the select
            "SUM(addresses.id) OVER() as total",
          )
          .where("user_addresses.id", 1)
      )
      .first(),
```

### Model Factory
- You can use model factory to generate instances of your models with standard data
- Can be useful combine fake data libraries to generate unique models

```typescript
import { createModelFactory } = "hysteria-orm";

// General data definition
const userFactory = createModelFactory<User>(User, {
  name: "John Doe",
  email: "john.doe@example.com",
});

// create one
const user = await userFactory.create(1); // model

// create many
const users = await userFactory.create(10); // array
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

### Transactions
- You can start a transaction with the startTransaction, beginTransaction or transaction methods both from a sql connection or from the static global SqlDataSource class
```typescript
import { SqlDataSource } from "hysteria-orm";

// Using static method from SqlDataSource that uses the main connection
const trx = await SqlDataSource.transaction();
try {
    // Your operations
    await trx.commit();
} catch (error) {
    await trx.rollback();
    throw error;
}

// Using connection
const sql = await SqlDataSource.connect();
const trx = await sql.startTransaction();
try {
    // Your operations
    await trx.commit();
} catch (error) {
    await trx.rollback();
    throw error;
}

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
    }, { trx });

// Update
    newUser.name = "John Doe Updated";
    const updatedUser = await User.updateRecord(newUser, { trx });

// Delete
    await User.deleteRecord(updatedUser, { trx });

    await trx.commit();
} catch (error) {
    await trx.rollback();
    throw error;
}
```

### Use Transaction
- With the useTransaction method you can execute a block of code in a transaction
- The transaction is automatically committed at the end of the block, it's also automatically rolled back in case of an error
```typescript
import { SqlDataSource } from "hysteria-orm";
import { User } from "./User";

const sql = await SqlDataSource.connect();

await sql.useTransaction(async (trx) => {
    const user = await User.query({ trx }).delete();
});

// With error
await sql.useTransaction(async (trx) => {
    const user = await User.query({ trx }).delete();
    throw new Error("Error"); // Will rollback the transaction
});

// You can use useTransaction from the SqlDataSource static method, this will use the main connection established with the connect method
await SqlDataSource.useTransaction(async (trx) => {
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
        name: "asc"
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

// Get one or fail
const userOrFail: User = await User.findOneOrFail({
    where: {
        id: 1,
        name: "John Doe"
    },
    customError: new Error("User not found")
});
```

### Query-builder

- It's used to create more complex queries that are not supported by the standard methods
- all select-where-relations-orderby columns are partially type safe, they can both be a specific column in the Model or a string
- You can also use the query builder for bulk updates and deleted
- Sql methods are available in the query builder, the results aliases will be available in the $annotations property

```typescript
import { User } from "./User";

// READ
const user: User | null = await User.query()
    .with('post')
    .where("name", "John Doe")
    .andWhere("email", "john@gmail.com")
    .oneOrFail();

const users: User[] = await User.query()
    .where("name", "John Doe")
    .andWhere("email", "john@gmail.com")
    .orderBy("name", "asc")
    .limit(10)
    .many();

// SQL Methods
// You can use sql methods directly in the query builder, the results will be available in the $annotations property
const user: User | null = await User.query()
    .select("COUNT(*) as total")
    .where("name", "John Doe")
    .one();
const userCount = user?.$annotations?.total;

// Distinct
const distinctUsers: User[] = await User.query()
    .select("name")
    .distinct()
    .where("name", "John Doe")
    .many();

// Distinct on (Postgres only)
const distinctOnUsers: User[] = await User.query()
    .select("name")
    .distinctOn("name")
    .where("name", "John Doe")
    .many();

// BULK UPDATE
await User.query()
    .where("name", "Micheal")
    .update({ name: "Micheal Updated" });

// BULK DELETE
await User.query().where("name", "Eve updated two").delete();

// BULK SOFT DELETE
await User.query().where("name", "Eve updated two").softDelete({
    column: "deletedAt", // default, can be changed from the static property if every model `softDeleteColumn`
    value: string | number | boolean // default `${year}-${month}-${day} ${hours}:${minutes}:${seconds}` timestamp
    // trx: optional
});
```

### When condition
- Given a value, it accepts a callback that gives the value itself and the current query builder
- The callback will be called only if the value exists (not null or undefined)
```typescript
import { User } from "./User";

const nullValue = null;
const trueValue = 1;
const user = await User.query()
// Will enter here
await User.query().when(trueValue, (value, query) => {
    query.where("id", trueValue);
})
.one();

// Won't enter here
await User.query().when(nullValue, (value, query) => {
    query.where("id", 1);
})
.one();
```

### Where Sub Query
- You can create a where condition that uses the result of a SubQuery

```typescript
import { User } from "./User";

const users = await UserWithUuid.query()
    .where("name", "John")
    .orWhere("name", "Alice")
    .whereBuilder((qb) => {
        qb.where("age", 12)
        .orWhere("name", "John")
        .orWhereSubQuery("id", "IN", (qb) => {
            qb.select("id").from("users").where("name", "Alice");
        });
})
```

### Where Builder
- Used to build complex logic conditions, everything inside the whereBuilder callback will be wrapped in parenthesis

```typescript
import { User } from "./User";

const user: User | null = await User.query()
    .whereBuilder((queryBuilder) => {
        queryBuilder.andWhereBuilder((innerQueryBuilder) => {
            innerQueryBuilder
                .where('department', 'sales')
                .where('hired_date', '>=', '2020-01-01');
        })
        .orWhereBuilder((innerQuery) => {
            innerQuery
                .where('department', 'engineering')
                .where('hired_date', '>=', '2022-01-01');
        })
        .where('is_active', true);
    });
```

## Ignore Hooks
- In both standard read methods and select query (pagination included) builders it's possible to ignore hooks
- This is not available for findOneByPrimaryKey method
```typescript
const userFind = await User.find({ ignoreHooks: ["beforeFetch"] });
```

### Aliases

- Aliases are available directly integrated in the select method, for example select('new as newName') will generate an alias in the `$annotations` property that every model instances has
```typescript
import { User } from "./User";

const user: User | null = await User.query()
    .select('id', 'name as superName')
    .with('post')
    .where("name", "John Doe")
    .andWhere("email", "john@gmail.com")
    .one();

user.$annotations.superName;
```

### SQL Functions
- Methods can be used directly inside the `select` method, but there are two utils for `count` and `sum` in order to get directly the number from the query

- Quick count and sum methods
```typescript
import { User } from "./User";

// You can specify if ignore hooks like beforeFetch
const count = await User.query().getCount("id", { ignoreHooks: false }); // number
const sum = await User.query().getSum("id"); // number
```

### Join
- Hysteria ORM provides powerful join capabilities to connect related tables in your queries
- Joins can be performed using table names or model classes
- The ORM supports various join types: INNER JOIN, LEFT JOIN, and RIGHT JOIN
- Join methods are chainable and can be combined with other query builder methods

#### Basic Join Syntax
```typescript
import { User } from "./User";
import { Post } from "./Post";

// Basic join with table name
const users = await User.query()
  .join("posts", "userId", "id", "=")
  .where("name", "John Doe")
  .many();

// Join with model class (type safe on Post columns)
const users = await User.query()
  .join(Post, "userId", "id")
  .where("name", "John Doe")
  .many();
```

#### Join Types

##### Inner Join
- Returns records that have matching values in both tables

```typescript
// Using table name
const users = await User.query()
  .innerJoin("posts", "userId", "id")
  .where("name", "John Doe")
  .many();

// Using model class
const users = await User.query()
  .innerJoin(Post, "userId", "id")
  .where("name", "John Doe")
  .many();
```

##### Left Join
- Returns all records from the left table and matching records from the right table

```typescript
// Using table name
const users = await User.query()
  .leftJoin("posts", "userId", "id")
  .where("name", "John Doe")
  .many();

// Using model class
const users = await User.query()
  .leftJoin(Post, "userId", "id")
  .where("name", "John Doe")
  .many();
```

##### Right Join
- Returns all records from the right table and matching records from the left table

```typescript
// Using table name
const users = await User.query()
  .rightJoin("posts", "userId", "id")
  .where("name", "John Doe")
  .many();

// Using model class
const users = await User.query()
  .rightJoin(Post, "userId", "id")
  .where("name", "John Doe")
  .many();
```

#### Simplified Join Syntax
- When using the `join` method without specifying the primary column, it defaults to the model's primary key
- This simplifies the join syntax for common scenarios
- While using Raw Query Builder is always advised to specify primary column and foreign column

```typescript
// Without specifying primary column (uses model's primary key)
const users = await User.query()
  .join("posts", "userId")
  .where("name", "John Doe")
  .many();

// With model class
const users = await User.query()
  .join(Post, "userId")
  .where("name", "John Doe")
  .many();
```

#### Raw Join
- For complex join scenarios, you can use the `joinRaw` method to write custom join SQL

```typescript
const users = await User.query()
  .joinRaw("JOIN posts ON posts.user_id = users.id AND posts.status = 'published'")
  .where("name", "John Doe")
  .many();
```

#### Clearing Joins
- You can clear all joins from the query using the `clearJoin` method

```typescript
const query = User.query()
  .join("posts", "userId", "id")
  .where("name", "John Doe");

// Clear joins and continue building the query
query.clearJoin()
  .where("email", "john@example.com")
  .many();
```

#### Combining Joins with Other Query Methods
- Joins can be combined with other query builder methods for complex queries

```typescript
const users = await User.query()
  .select("users.id", "users.name", "posts.title as postTitle")
  .join("posts", "userId", "id")
  .where("users.name", "John Doe")
  .andWhere("posts.status", "published")
  .orderBy("users.createdAt", "desc")
  .limit(10)
  .many();
```

### Union and Union All
- The query builder supports `UNION` and `UNION ALL` operations to combine results from multiple queries
- UNION removes duplicate rows while UNION ALL keeps all rows including duplicates
- Both operations can be used with either a query builder instance or a callback function

```typescript
import { User } from "./User";

// Using UNION with a query builder instance
const users = await User.query()
  .select("name")
  .union(User.query().select("name"))
  .many();

// Using UNION ALL with a callback function
const users2 = await User.query()
  .select("name")
  .unionAll((queryBuilder) => queryBuilder.select("name"))
  .many();
```

### Common Table Expressions (CTE)
- CTEs allow you to create temporary result sets that can be referenced within a query
- Hysteria ORM supports both normal and recursive CTEs
- CTEs can be used to simplify complex queries and improve readability

#### Normal CTE
```typescript
import { User } from "./User";

const users = await User.query()
  .with("normal", (cteBuilder) =>
    cteBuilder
      .newCte("users_cte", (cteBuilder) => cteBuilder.select("name"))
      .newCte("users_cte2", (cteBuilder) => cteBuilder.select("age"))
  )
  .many();
```

#### Recursive CTE
```typescript
import { User } from "./User";

const users = await User.query()
  .with("recursive", (cteBuilder) =>
    cteBuilder
      .newCte("users_cte", (cteBuilder) => cteBuilder.select("name"))
      .newCte("users_cte2", (cteBuilder) => cteBuilder.select("age"))
  )
  .many();
```

### Pagination

- Pagination is available in the queryBuilder, will return an object with the metadata for the pagination and the list of the retrieved models
```typescript
import { User } from "./User";

const user: User | null = await User.query()
    .with('post')
    .where("name", "John Doe")
    .andWhere("email", "john@gmail.com")
    .paginate(1, 10); // page, for-page
```

### Standalone Query Builder
- You can use a query builder that does not rely on a Model
```typescript
import { SqlDataSource } from "hysteria-orm"

const { query, params } = SqlDataSource
    .query()
    .whereBuilder((builder) => {
        builder.where("id", 1);
        builder.orWhere("name", "John");
        builder.andWhereBuilder((builder) => {
            builder.where("signup_date", "2021-01-01");
            builder.orWhere("signup_date", "2021-01-02");
        });
    })
    .unWrap();

// Example of couple { query, params }

// query = SELECT * FROM users WHERE (id = $1 OR name = $2 AND signup_date = $3 OR signup_date = $4)
// params = [ 1, 'John', '2021-01-01', '2021-01-02' ]
```

# Migrations
- Migrations cli is an optional standalone program that can be used to create and run migrations
- Migration cli should be used in the root of the project
- Migrations cli starts from the current user location (process.cwd) and appends the path/to/migrations (default `migrations`), this can be customized with `MIGRATION_PATH` environment variable
- Migrations can both be defined in ts and js, if using ts migrations, `ts-node` and `typescript` must be installed as dependencies in the node_modules
- By default the migration queries are hidden, you can use --verbose in order to get all the query logs

## Run Migrations Programmatically
- You can also run migrations from you code using the `defineMigrator` method
```typescript
import { defineMigrator } from "hysteria-orm";

const migrator = defineMigrator('./migrations', true) // path to migrations, debugger
await migrator.migrate('up');
```

## hysteria-orm-cli for Migrations
- You can run the cli using `npx hysteria` (for npm) or `yarn run hysteria` (for yarn)

### create:migration <name> [-j, --javascript] [-a, --alter] [-c, --create] [-t, --table <string>]
- Creates a migration in the migrations folder
- If the creation folder specified in the .env (or the default one `migrations`) it will be created automatically
- By default this command generates a .ts file, you can generate a .js file with the flag -j
- You can specify the mode of the migration with -c that spawns a create table migration and -a that spawns an alter table migration
- If specifing a mode for the migration, you can specify a table name with --table

### run:migrations [runUntil][-v, --verbose]
- Runs all pending migrations <optional - migration_file_name>
- If the migration file name is specified then migrations will be run until that migration

### rollback:migrations [rollbackUntil][-v, --verbose]
- Rollbacks all existing migrations <optional - migration_file_name>
- If the migration file name is specified then migrations will be rolled back from the last migration until that migration

### refresh:migrations[-v, --verbose]
- Rollbacks all existing migrations and runs them again

### Create Table

```typescript
import { Migration } from "hysteria-orm";
import { User } from "../Models/Post";

export default class extends Migration {
    async up(): Promise<void> {
        this.schema.createTable(
        "users",
        (table) => {
            table.bigSerial("id").primary();
            table.varchar("name", 255).notNullable();
            table.varchar("email", 255).notNullable();
            table.varchar("signup_source", 255).notNullable();
            table.boolean("is_active").notNullable().default(true);
            table.jsonb("json");
            table.timestamp("created_at", { autoCreate: true });
            table.timestamp("updated_at", { autoCreate: true, autoUpdate: true });
            table.timestamp("deleted_at").nullable();
        },
        { ifNotExists: true },
        );

        this.schema.rawQuery('CREATE INDEX users_name_idx ON users (name)');

        // Hooks for after up and down migrations are executed immediately after the relative migration file is executed
        this.afterMigration = async (sqlDataSource) => {
            await sqlDataSource.query("users", "camel", "snake").insert({
                name: "John Doe",
                email: "john.doe@example.com",
                signup_source: "google",
                is_active: true,
                json: {},
            });
        }
    }

    async down(): void {
        this.schema.dropTable('users');
        this.afterMigration = async (_sqlDataSource) => { /* After down logic here*/ }
    }
}
```

### Alter Table

```typescript
import { Migration } from "hysteria-orm";

export default class extends Migration {
    async up(): void {
        this.schema.alterTable("users", (table) => {
            table.addColumn("age", "integer");
            table.dropColumn("age");
            table.modifyColumnType("name", "varchar(255)");
            table.renameColumn("name", "full_name");
        });
    }

    async down(): void {
        this.schema.alterTable("users", (table) => {
            table.dropColumn("age");
            table.addColumn("age", "integer");
            table.renameColumn("full_name", "name");
            table.modifyColumnType("name", "varchar(255)");
        });
    }
}
```

### Run SQL file in migrations
- You can also run a .sql or .txt file in the migrations
- Remember that the file path is relative to the current working directory you are in
- As best practice, migration cli should be run in the root of the project

```typescript
import { Migration } from "hysteria-orm";

export default class extends Migration {
  public async up(): Promise<void> {
    this.schema.runFile("path/to/file.sql");
  }

  public async down(): Promise<void> {
    // Down logic here
  }
}
```

- Example with process.cwd in node.js
```typescript
import { Migration } from "hysteria-orm";
import path from "path";

export default class extends Migration {
  public async up(): Promise<void> {
    this.schema.runFile(path.join(process.cwd(), "path/to/file.sql"));
  }

  public async down(): Promise<void> {
    // Down logic here
  }
}
```

## Run SQL from cli
- You can also run a raw sql query from the cli
- Also, you can use the -f flag to run a file

```bash
npx hysteria run:sql "SELECT * FROM users"
npx hysteria run:sql -f path/to/file.sql
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
