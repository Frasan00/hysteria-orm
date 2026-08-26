---
title: JavaScript Usage
description: "Using Hysteria ORM with JavaScript projects and common patterns."
keywords: [hysteria-orm, JavaScript, CommonJS, ESM, Node.js]
sidebar_position: 6
---

# JavaScript

Hysteria ORM is written and designed for TypeScript, but it can still be used in JavaScript.

## Functional API (`defineModel`)

```javascript
const { SqlDataSource, defineModel, col } = require("hysteria-orm");

const User = defineModel("users", {
  columns: {
    id: col.increment(),
    name: col.string(),
    email: col.string(),
    isActive: col.boolean(),
    createdAt: col.datetime({ autoCreate: true }),
    updatedAt: col.datetime({ autoCreate: true, autoUpdate: true }),
  },
  indexes: [["email"]],
  uniques: [["email"]],
});

module.exports = User;
```

Relations are always defined separately via `defineRelations` + `createSchema`. See [Defining Relations](../databases/sql/models/define-model.md#defining-relations-definerelations--createschema).

## Usage Example

```javascript
const { SqlDataSource } = require("hysteria-orm");
const User = require("./models/User");

const sql = new SqlDataSource({
  type: "sqlite",
  database: "app.db",
  models: { User },
});

await sql.connect();

const users = await sql.from(User).find();
const active = await sql.from(User).where("isActive", true).many();

await sql.disconnect();
```

For the full API reference, see [Programmatic Models (defineModel)](../databases/sql/models/define-model.md).

---

## Notes

- Type safety is not enforced in JavaScript.
- All features are available, but you could lose development-time checks.

---

Next: [Logging](./logging.md)
