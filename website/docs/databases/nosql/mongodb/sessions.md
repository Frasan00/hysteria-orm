---
title: MongoDB Sessions & Transactions
description: "MongoDB sessions and transactions with replica sets in Hysteria ORM."
keywords: [hysteria-orm, MongoDB sessions, transactions, replica sets]
sidebar_position: 5
---

# (Experimental) MongoDB Sessions & Transactions

MongoDB supports transactions using sessions (requires a replica set).

## Starting a Session

```typescript
const session = mongo.startSession();
```

## Using a Session in Operations

Pass the session as the second argument to `mongo.from()`:

```typescript
const session = mongo.startSession();
try {
  await mongo
    .from(User, { session })
    .insert({ name: "John", email: "john@test.com" });
  await mongo
    .from(User, { session })
    .insert({ name: "Jane", email: "jane@test.com" });
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
}
```

## Multi-Collection Transactions

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

## Best Practices

- Always commit or abort the session.
- Use sessions for multi-document atomicity.
- Sessions require a replica set.

---

Next: [Redis Introduction](../redis/introduction.md)
