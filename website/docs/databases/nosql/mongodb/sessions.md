---
title: MongoDB Sessions & Transactions
description: Run multi-document MongoDB transactions with sessions and replica sets in Hysteria ORM.
keywords: [hysteria-orm, MongoDB sessions, transactions, replica sets]
---

# MongoDB sessions & transactions

:::warning Experimental
MongoDB sessions and transactions are experimental and require a replica set.
:::

`mongo.startSession()` opens a session and starts a transaction on the current connection. Pass the session to `mongo.from()` as the second argument to run operations inside it.

```typescript
const session = mongo.startSession();

try {
  const user = await mongo
    .from(User, { session })
    .insert({ name: "John", email: "john@test.com" });

  await mongo
    .from(Order, { session })
    .insert({ userId: user.id, total: 99.99 });

  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
}
```

## Best practices

- Always commit or abort the session.
- Use sessions when several writes must succeed or fail together.
- Sessions require a replica set; standalone `mongod` does not support them.

## See also

- [Collection Methods](/databases/nosql/mongodb/methods)
- [MongoDB Query Builder](/databases/nosql/mongodb/query-builder)
