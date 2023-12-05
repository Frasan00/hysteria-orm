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

- Create a model

```typescript
import { Model } from "hysteria-orm";
export class User extends Model {
    public id: number;
    public name: string;
    public email: string;
    
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
    public id: number;
    public name: string;
    public profile: HasMany = new HasMany("Profile", "user_id");

    constructor() {
        super();
        this.tableName = "User";
        this.primaryKey = "id";
    }
}
```