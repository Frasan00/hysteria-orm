# Mongo (EXPERIMENTAL)

- Some features are still missing or could not be working as expected.
- Some of the features that could be not working are:
  1. Sessions

- [Setup](#setup)
- [DataSource Configuration](#datasource-configuration)
- [Use Connection](#use-connection)
- [Session](#session)
- [Model Configuration](#model-configuration)
- [Base Find Methods](#base-find-methods)
- [QueryBuilder](#querybuilder)

## Setup

### DataSource Configuration
```typescript
import { MongoDataSource } from "hysteria-orm";

const mongoDataSource = await MongoDataSource.connect(
  "mongodb://root:root@localhost:27017",
  {}, // Every options that you can pass to mongodb client options
);
```

### Use connection
```typescript
await mongoDataSource.useConnection({
  url: "mongodb://root:root@localhost:27017",
  options: {}, // Every options that you can pass to mongodb client options
}, async (mongo) => {
  // Here you can use the connection created above in your models to execute queries in other databases
  await User.find({ useConnection: mongo });
});
```

### Session
- Like the sql databases, you can use the session to execute rollbackable transactions.
- IMPORTANT: Mongo sessions can only be used with replica sets!
```typescript
const session = await mongoDataSource.startSession();
try {
  // Here you can execute your queries
  await User.find({ session: session });
  await session.commit();
} catch (error) {
  await session.rollback();
  throw error;
}
```

### Model Configuration
- The id property is handled automatically by the library, you don't need to define it, while using it you only refer to it as `id`m the library will handle the rest parsing it to `_id` for mongo.
- You can use `@property` to define a property for the model, note that since it's a no-sql database, the database itself will not enforce the schema, so you can define any property you want.
- You can use `@dynamicProperty` to define a dynamic property for the model, this will be a function that will be called when you try to access the property.
- Different from sql databases, mongo implementation at the moment does not support the relations between models.

```typescript
import { Collection, property, dynamicProperty } from "hysteria-orm";

class User extends Collection {
  static collectionName: string = "users"; // If not defined, the class name in snake_case with a 's' at the end will be used
  static databaseCaseConvention: CaseConvention = "snake"; // If not defined, it will use the snake case while interacting with the database
  static modelCaseConvention: CaseConvention = "camel"; // If not defined, it will use the camel case while interacting with the model

  @property()
  declare name: string;

  @property()
  declare email: string;

  @property()
  declare age: number;

  @property()
  declare password: string;

  @property()
  declare userProfile: {
    birthData: DateTime;
    age: number;
    preferredName: string;
  };

  @dynamicProperty("test")
  getTest() {
    return "test";
  }

  // Hooks - You can define hooks to be called before or after some actions
  static beforeFetch(queryBuilder: MongoQueryBuilder<any>): void {
    queryBuilder.where({ name: "Test Name" });
  }

  static afterFetch(data: any[]): Promise<Collection[]> {
    return Promise.resolve(data);
  }

  static beforeInsert(data: any): void {
    data.name = "Test Name";
  }

  static afterInsert(data: any): Promise<Collection> {
    return Promise.resolve(data);
  }
}
```

### Base Find Methods
- The base find methods are methods that you can use to find data in the database, they are defined in the `Collection` class.
- The base find methods are partially type safe, they will infer the type of the model you are querying, but they will not infer the type of the properties you are querying, so you can use any property you want, but it will not be type checked.

```typescript
import { User } from "./models/User";

// Find all
const users = await User.find();

// Find
const user = await User.find({
  where: { name: "Test Name" },
  limit: 1,
  offset: 0,
  sort: { name: -1 },
});

// Find one
const user = await User.findOne({
  where: { name: "Test Name" },
});
```

### QueryBuilder
- The query builder is a class that you can use to build your queries, it has a lot of methods that you can use to build your queries.
- The query builder is chainable, so you can call multiple methods in a single line.
- The query builder is partially type safe, it will infer the type of the model you are querying, but it will not infer the type of the properties you are querying, so you can use any property you want, but it will not be type checked.
- Every property queried that does not exist in the model will be inserted in the `$additionalColumns` property that every collection has, so you can access it later if you want.

```typescript
import { User } from "./models/User";

// Basic query
const user = await User.query()
  .where("name", "Test Name")
  .addDynamicProperty("test")
  .first();

// Insert
const user = await User.insert({ 
  // Model defined properties are type checked
  name: "Test Name", 
  email: "john@gmail.com", 
  age: 20,

  // You can also define any other property
  otherProperty: "Other Property"
});

// Update
const user = await User.query()
  .where("name", "Test Name")
  .update({ name: "New Name" });

// Delete
const user = await User.query()
  .where("name", "Test Name")
  .delete();

// Update record
const user = await User.updateRecord(user);

// Delete record
await User.deleteRecord(user);

// Nested checks
const sorted = await TestModel.query()
  .sort({ "userProfile.age": -1 })
  .many();

const filtered = await TestModel.query()
  .where("userProfile.age", 20)
  .many();
```
