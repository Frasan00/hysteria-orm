# Hysteria ORM

Hysteria ORM is an Object-Relational Mapping (ORM) library for JavaScript and TypeScript, designed to simplify interactions between your application and a SQL database.

## Features

- **Simple Model Creation:** Define models that reflect your database schema with ease.
- **Automatic Case Conversion:** Automatically converts model properties to snake_case for the database and back to camelCase when retrieving data.
- **Database Support:** Currently supports MySQL, with PostgreSQL support in development.

## Prerequisites

- A JavaScript runtime environment (e.g., Node.js).
- A SQL library corresponding to your database (e.g., `mysql2` for MySQL, `pg` for PostgreSQL).

### TypeScript Configuration

For TypeScript users, it is essential to set `"useDefineForClassFields": true` in your `tsconfig.json` file to ensure compatibility with the ORM.

## Environment Variables

- `MIGRATION_PATH`: Path to the migration folder (default: `database/migrations`).
- `DATABASE_TYPE`: Type of the database (default: `mysql`, options: `mysql`, `postgres`).

## Getting Started

### Establishing a Connection

```typescript
import { MysqlDatasource, DatasourceInput } from "hysteria-orm";

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
import {Model, HasOne, HasMany} from "hysteria-orm";
import {Profile} from "./Profile";
import {Post} from "./Post";

export class User extends Model {
    public id!: number;
    public name!: string;
    public email!: string;
    // Relations take as params (TableName, foreignKey)
    public profile: Profile | HasOne = new HasOne("proiles", "userId");
    public posts: Post[] | HasMany = new HasMany("posts", "userId");

    constructor() {
        super('users', 'id');
    }
}
```

### Create, Update and Delete (with transaction)

```typescript
import { User } from "./models/User";

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
import {MysqlDatasource} from "hysteria-orm";
import {mysqlConfig} from "path/to/mysqlConfig";
import { User } from "./models/User";

const datasource = new MysqlDatasource(mysqlConfig)
const userManager = datasource.getModelManager(User);

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

### Query Builder
- It's used to create more complex queries that are not supported by the standard methods

```typescript
import { User } from "./models/User";

const queryBuilder = userManager.queryBuilder();
const user: User | null = await queryBuilder
    .select(['id'])
    .addRelations(['post'])
    .where("name", "John Doe")
    .andWhere("email", "john@gmail.com")
    .one();

const users: User[] = await queryBuilder
    .where("name", "John Doe")
    .andWhere("email", "john@gmail.com")
    .orderBy("name", "ASC")
    .limit(10)
    .many();
```

### Aliases

- Aliases are available in the query builder, for example select('new as newName') will generate an alias in the columnAliases prop that every model has


# Under Development
- *Migrations* (advised raw queries and create table only since `alter table` is still under development and may not work as expected)
- Environment variable *MIGRATION_PATH*, default if not set: "database/migrations"

Create a migration (hysteria create:migration {migrationName})

```typescript
import {Migration} from "hysteria-orm";

export default class extends Migration {
    public up(): void {
        // useTable allows you to target a specific Table in your database in order to create, alter or drop
        this.useTable("User", "create")

        this.table.column().bigInt("id").primary().autoIncrement().commit();
        this.table.column().string("name").notNullable().commit();
    }

    public down(): void {
        this.useTable("User", "drop")
        this.table.drop();
    }
}
```

Raw Migration

```typescript
import {Migration} from "hysteria-orm";

export default class extends Migration {
    public up(): void {
        this.useRawQuery('YOUR RAW QUERY HERE');
    }

    public down(): void {
        this.useRawQuery('YOUR RAW QUERY HERE');
    }
}
```

- hysteria cli for Migrations

1) npm run | yarn create:migration {migrationName}
2) npm run | yarn run:migrations
3) npm run | yarn rollback:migrations