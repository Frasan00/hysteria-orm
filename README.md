# Hysteria ORM

Hysteria ORM is an Object-Relational Mapping (ORM) library for JavaScript and TypeScript, designed to simplify interactions between your application and a SQL database.

- [Installation](#installation)
- [Features](#features)
- [Prerequisites](#prerequisites)
    - [TypeScript Configuration](#typescript-configuration-example)
- [Environment Variables](#environment-variables)
    - [Common Envs](#common-envs)
    - [Mysql Envs](#mysql-envs)
    - [Postgres Envs](#postgres-envs)
    - [Complete env example](#complete-env-example)
- [Getting Started](#getting-started)
    - [Establishing a Connection](#establishing-a-connection)
    - [Create a Model](#create-a-model)
    - [Create a Model with Relationships](#create-a-model-with-relationships)
    - [Read (standard methods used for simple queries)](#read-standard-methods-used-for-simple-queries)
    - [Query Builder](#query-builder)
    - [Where Builder](#where-builder)
    - [Aliases](#aliases)
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
- **Automatic Case Conversion:** Automatically converts model properties to snake_case for the database and back to camelCase when retrieving data.
- **Database Support:** Currently supports MySQL and PostgreSQL.

## Prerequisites

- A JavaScript runtime environment (e.g., Node.js).
- A SQL library corresponding to your database (e.g., `mysql2` for MySQL, `pg` for PostgreSQL).

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
DB_TYPE=mysql # mysql | postgres | [mariadb(experimental)]
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=root
DB_DATABASE=database
DB_PORT=3306 # default 3306 for Mysql and 5432 for Postgres
DB_LOGS=true # default false
```

## Getting Started

### Establishing a Connection

```typescript
import { SqlDataSource, DataSourceInput } from "hysteria-orm";

const mysqlConfig: DataSourceInput = {
    type: 'mysql' | 'postgres' | 'mariadb',
    host: HOST,
    port: PORT,
    username: USERNAME,
    password: PASSWORD,
    database: DATABASE,
    logs: true, // query-logs (optional) - default: false
}

// Config can be omitted, in that case envs will be used to enstablish the connection 
const sql = await SqlDataSource.connect(mysqlConfig, () => console.log("Connected to the database"));
```

### Create a model

```typescript
import { Model } from "hysteria-orm";
import { DateTime } from "luxon";

export class User extends Model {
  @column()
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

  public static metadata: Metadata = {
    primaryKey: "id",
    tableName: "users",
  };
}
```

### Create a model with relationships

```typescript
import { Model, HasOne, HasMany } from "hysteria-orm";
import { Profile } from "./Profile";
import { Post } from "./Post";

export class User extends Model {
    @column()
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

    // Relations take as params (TableName, foreignKey)
    public profile: Profile | HasOne = new HasOne("profiles", "user_id");
    public posts: Post[] | HasMany = new HasMany("posts", "user_id");

    public static metadata: Metadata = {
        primaryKey: "id",
        tableName: "users",
    };

    // Hooks
    public static beforeFetch(queryBuilder: QueryBuilders<User>): QueryBuilders<User> {
        return queryBuilder.where("", true);
    }

    public static beforeCreate(data: User): User {
        data.isActive = true;
        return data;
    }

    public static async afterFetch(data: User[]): Promise<User[]> {
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

### Create, Update and Delete (with transaction)

```typescript
// Transaction is optional in all those methods
const trx = await sql.startTransaction()
// Create
try{
    const newUser: User = await User.create({
        name: "New User",
        email: "newUserEmaik@gmail.com"
    }, trx);

// Update
    newUser.name = "John Doe Updated";
    const updatedUser = await User.updateRecord(newUser, trx);

// Delete
    await User.delete(updatedUser, trx);
    await User.deleteByColumn("email", "john@gmail.com");

    await trx.commit();
} catch (error) {
    await trx.rollback();
    throw new Error(error);
}
```

### Read (standard methods used for simple queries)

```typescript
// Get all
const users: User[] = await userManager.find();

// Get with optional parameters
const filteredUsers: User[] = await User.find({
    relations: ["profile"],
    where: {
        name: "John Doe"
    },
    orderBy: {
        name: "ASC"
    },
    limit: 10,
    offset: 0
});

// Get by ok requires a primary key to exist on the model in order to work
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

```typescript
const user: User | null = await User.query()
    .addRelations(['post'])
    .where("name", "John Doe")
    .andWhere("email", "john@gmail.com")
    .one();

const users: User[] = await User.query()
    .where("name", "John Doe")
    .andWhere("email", "john@gmail.com")
    .orderBy("name", "ASC")
    .limit(10)
    .many();
```

### Where Builder

- Used to build complex logic conditions
```typescript
const user: User | null = await User.query().whereBuilder((queryBuilder) => {
    queryBuilder.andWhereBuilder((innerQueryBuilder) => {
        innerQueryBuilder.where('department', 'sales');
        innerQueryBuilder.where('hired_date', '2020-01-01', '>=');
    });
    queryBuilder.orWhereBuilder((innerQuery) => {
        innerQuery.where('department', 'engineering');
        innerQuery.where('hired_date', '2022-01-01', '>=');
    });
    queryBuilder.where('is_active', true);
});
```

### Aliases

- Aliases are available in the query builder, for example selectRaw('new as newName') will generate an alias in the extraColumns prop that every model has
- Everything inside the extraColumns will be converted to camel case automatically regardless of the alias name
- Must use selectRaw for custom columns, by default `select`
 can only query 
```typescript
const user: User | null = await User.query()
    .selectRaw('id', 'name as superName')
    .addRelations(['post'])
    .where("name", "John Doe")
    .andWhere("email", "john@gmail.com")
    .one();
```

### Relations Retrieve

- Relations can be retrieved both from Standard methods and the query builder
- Those retrieves are especially fast since for each relation a single db query is made and the retrieve of each relation for each model is made in O(n)
- Based on the relation type can be retrieved both a list (HasMany) or a single record (BelongsTo, HasOne)

```typescript
const user: User | null = await User.query()
    .addRelations(['posts'])
    .one();

const users: User[] = await User.find({
    relations: ["profile"],
});
```

### Join

```typescript
const users = await User.query()
    .selectRaw("users.*")
    .leftJoin("posts", "users.id", "posts.user_id")
    .where('users.id', 1)
    .orderBy(['users.id'], "ASC")
    .many();
```

### Pagination

- Pagination is available in the queryBuilder, will return an object with the metadata for the pagination and the list of the retrieved models
```typescript
const user: User | null = await User.query()
    .addRelations(['post'])
    .where("name", "John Doe")
    .andWhere("email", "john@gmail.com")
    .paginate(1, 10); // page - limit
```

# Use Connection
- Allows to execute operations on a separate database connection, useful for multi-database applications
- Model static methods will always refer to the main connection established with await SqlDataSource.connect();

```typescript
await SqlDataSource.useConnection(
    {
        type: "mysql",
        host: "localhost",
        database: "test",
        username: "root",
        password: "root",
    },
    async (sql) => {
        const userRepo = sql.getModelManager(User);

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
```

# Migrations

## hysteria-cli for Migrations

1) (npm run) | (yarn) create:migration {migrationName}
2) (npm run) | (yarn) run:migrations
3) (npm run) | (yarn) rollback:migrations


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
        await Post.create({
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
// You can query directly on the model using an object
const jsonQuery = await User.query().where("json_prop", { main: "value" }).one();

// Contains
const jsonQueryContains = await User.query()
.where("json_prop", { main: "value" }, ">")
.one();

// Does not contain
const jsonQueryContains = await User.query()
.where("json_prop", { main: "value" }, "<")
.one();

// Create new users
const newUsers = await User.massiveCreate([
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
const deletedUsers = await User.delete()
.where("json", {
        foo: "bar",
        bar: "foo",
    },
    ">",
)
.performDelete();
```