# Hysteria-orm

- Hysteria ORM is a simple ORM for node.js built with typescript.
- This ORM allows you to create models and use them to interact with your database.
- For now, only MySQL is supported, but more databases will be supported in the future.

## Software Requirements

- Node.js installed
- Typescript
- MySQL database

## Configuration Requirements

- *IMPORTANT* must set "useDefineForClassFields": true, in tsconfig.json in order to work!

### Code Examples

- Create a connection

```typescript
import { MysqlDatasource } from "hysteria-orm";

const mysqlConfig = {
    type: 'mysql',
    host: MYSQL_HOST,
    port: MYSQL_PORT,
    username: MYSQL_USERNAME,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
    logs: true, // query-logs, optional - default: false
}

const datasource = new MysqlDatasource(mysqlConfig)
await datasource.connect()
```

- Create a model

```typescript
import { Model } from "hysteria-orm";
export class User extends Model {
    public id!: number;
    public name!: string;
    public email!: string;
    
    constructor() {
        super();
        /*
        * Table name and primary key are not required.
        * If you don't set them, the ORM will use the class name for the table name.
        */
        this.tableName = "User";
        this.primaryKey = "id";
    }
}
```

- Create a model with relationships

```typescript
import { Model, HasOne } from "hysteria-orm";
import { Profile } from "./Profile";

export class User extends Model {
    public id!: number;
    public name!: string;
    public email!: string;
    public profile: HasOne = new HasOne("Profile");

    constructor() {
        super();
        this.tableName = "User";
        this.primaryKey = "id";
    }
}
```

- Create, Update and Delete (Optional transaction)

```typescript
import {MysqlDatasource} from "hysteria-orm";
import {mysqlConfig} from "path/to/mysqlConfig";
import { User } from "./models/User";

const datasource = new MysqlDatasource(mysqlConfig)
const userManager = datasource.getModelManager(User);

await userManager.startTransaction();
// Create
try{
    const user = new User();
    user.name = "John Doe";
    user.email = "john@gmail.com";
    const newUser: User = await userManager.save(user);

// Update
    newUser.name = "John Doe Updated";
    const updatedUser = await userManager.save(newUser);

// Delete
    await userManager.delete(updatedUser);
    await userManager.deleteByColumn("email", "john@gmail.com");

    await userManager.commitTransaction();  
} catch (error) {
    await userManager.rollbackTransaction();
    throw new Error(error);
}
```

- Read (standard methods)

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
    where: {
        name: "John Doe"
    },
    orderBy: {
        name: "ASC"
    },
    limit: 10,
    offset: 0
});

// Get by ID
const user: User | null = await userManager.findOneById(5);

// Get One
const otherUser: User | null = await userManager.findOne({
    where: {
        id: 1,
        name: "John Doe"
    }
});
```

- Fill relationships

```typescript
import {MysqlDatasource} from "hysteria-orm";
import {mysqlConfig} from "path/to/mysqlConfig";
import { User } from "./models/User";

const datasource = new MysqlDatasource(mysqlConfig)
const userManager = datasource.getModelManager(User);

const user: User | null = await userManager.findOneById(1);
// Adds and returns the given model with the given relationship filled
const userWithFilledRelation = await userManager.fillRelation(user, "profile");
```

- Query Builder

```typescript
import {MysqlDatasource} from "hysteria-orm";
import {mysqlConfig} from "path/to/mysqlConfig";
import { User } from "./models/User";

const datasource = new MysqlDatasource(mysqlConfig)
const userManager = datasource.getModelManager(User);

const queryBuilder = userManager.queryBuilder();
const user: User | null = await queryBuilder
    .where("name", "John Doe")
    .andWhere("email", "john@gmail.com")
    .first();

const users: User[] = await queryBuilder
    .where("name", "John Doe")
    .andWhere("email", "john@gmail.com")
    .orderBy("name", "ASC")
    .limit(10)
    .many();
```

- Migrations TO DO