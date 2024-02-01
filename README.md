# Hysteria ORM

Hysteria ORM is an Object-Relational Mapping (ORM) library for JavaScript and TypeScript, designed to simplify interactions between your application and a SQL database.

- [Installation](#installation)
- [Features](#features)
- [Prerequisites](#prerequisites)
    - [TypeScript Configuration](#typescript-configuration)
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
    - [Join](#join)
    - [Pagination](#pagination)
- [Migrations](#migrations)
    - [hysteria-cli for Migrations](#hysteria-cli-for-migrations)
    - [Create Table](#create-table)
    - [Alter Table](#alter-table)

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

### TypeScript Configuration

For TypeScript users, it is essential to set `"useDefineForClassFields": true` in your `tsconfig.json` file to ensure compatibility with the ORM.

## Environment Variables

### Common Envs

- `MIGRATION_PATH`: Path to the migration folder (default: `database/migrations`).
- `DATABASE_TYPE`: Type of the database (default: `mysql`, options: `mysql`, `postgres`).

### Mysql Envs

- `MYSQL_ROOT_PASSWORD`
- `MYSQL_DATABASE`
- `MYSQL_USERNAME`
- `MYSQL_PASSWORD`
- `MYSQL_HOST`
- `MYSQL_PORT`

### Postgres Envs
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_HOST`
- `POSTGRES_PORT`

### Complete env example
``` dotenv
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=database
MYSQL_USERNAME=root
MYSQL_PASSWORD=root
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306

POSTGRES_USER: root
POSTGRES_PASSWORD: root
POSTGRES_DATABASE: database
POSTGRES_HOST: 127.0.0.1
POSTGRES_PORT: 5432

MIGRATION_PATH=test/database/migrations
DATABASE_TYPE=mysql
```


## Getting Started

### Establishing a Connection

```typescript
import { SqlDatasource, DatasourceInput } from "hysteria-orm";

const mysqlConfig: DatasourceInput = {
    type: 'mysql' | 'postgres',
    host: HOST,
    port: PORT,
    username: USERNAME,
    password: PASSWORD,
    database: DATABASE,
    logs: true, // query-logs (optional) - default: false
}

const datasource = new SqlDatasource(mysqlConfig)
await datasource.connect()
```

### Create a model

```typescript
import { Model } from "hysteria-orm";
export class User extends Model {
    public id!: number;
    public name!: string;
    public email!: string;
    
    constructor() {
        /*
        * Table name and primary key are optional.
        * If you don't set a table name, it'll be the class name in lowercase, snake case and with a final s (es. users)
        */
        super('users', 'id');
    }
}
```

### Create a model with relationships

```typescript
import { Model, HasOne, HasMany } from "hysteria-orm";
import { Profile } from "./Profile";
import { Post } from "./Post";

export class User extends Model {
    public id!: number;
    public name!: string;
    public email!: string;
    // Relations take as params (TableName, foreignKey)
    public profile: Profile | HasOne = new HasOne("profiles", "user_id");
    public posts: Post[] | HasMany = new HasMany("posts", "user_id");

    constructor() {
        super('users', 'id');
    }
}
```

### Create, Update and Delete (with transaction)

```typescript
// Transaction is optional in all those methods
const trx = userManager.createTransaction()
// Create
try{
    await trx.start();
    const user = new User();
    user.name = "John Doe";
    user.email = "john@gmail.com";
    const newUser: User = await userManager.save(user, trx);

// Update
    newUser.name = "John Doe Updated";
    const updatedUser = await userManager.update(newUser, trx);

// Delete
    await userManager.delete(updatedUser, trx);
    await userManager.deleteByColumn("email", "john@gmail.com");

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
const filteredUsers: User[] = await userManager.find({
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

// Get by id requires the `id` property to exist on the model in order to work
const user: User | null = await userManager.findOneById(5);

// Get One
const otherUser: User | null = await userManager.findOne({
    where: {
        id: 1,
        name: "John Doe"
    }
});
```

### Query-builder
- It's used to create more complex queries that are not supported by the standard methods

```typescript
const query = userManager.query();
const user: User | null = await query
    .addRelations(['post'])
    .where("name", "John Doe")
    .andWhere("email", "john@gmail.com")
    .one();

const users: User[] = await query
    .where("name", "John Doe")
    .andWhere("email", "john@gmail.com")
    .orderBy("name", "ASC")
    .limit(10)
    .many();
```

### Where Builder

- Used to build complex logic conditions
```typescript
const query = userManager.query();
const user: User | null = await query.whereBuilder((queryBuilder) => {
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

- Aliases are available in the query builder, for example select('new as newName') will generate an alias in the columnAliases prop that every model has
```typescript
import { User } from "./models/User";

const query = userManager.query();
const user: User | null = await query
    .select(['id', 'name as superName'])
    .addRelations(['post'])
    .where("name", "John Doe")
    .andWhere("email", "john@gmail.com")
    .one();
```

### Join
```typescript
import { User } from "./models/User";

const users = await userModelManager.query()
    .select("users.*")
    .leftJoin("posts", "users.id", "posts.user_id")
    .where('users.id', 1)
    .orderBy(['users.id'], "ASC")
    .many();
```

### Pagination

- Pagination is available in the queryBuilder, will return an object with the metadata for the pagination and the list of the retrieved models
```typescript
import { User } from "./models/User";

const query = userManager.query();
const user: User | null = await query
    .addRelations(['post'])
    .where("name", "John Doe")
    .andWhere("email", "john@gmail.com")
    .paginate(1, 10); // page - limit
```

# Migrations

## hysteria-cli for Migrations

1) (npm run) | (yarn) create:migration {migrationName}
2) (npm run) | (yarn) run:migrations
3) (npm run) | (yarn) rollback:migrations


## Create Table

```typescript
import { Migration } from "hysteria-orm";

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