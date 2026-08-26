---
title: Pagination
description: "Paginate query results with offset-based and cursor-based pagination in Hysteria ORM."
keywords: [hysteria-orm, pagination, limit, offset, cursor pagination]
sidebar_position: 4
---

# Pagination

Hysteria ORM provides two pagination strategies for efficient data retrieval: **offset-based pagination** (`paginate`) and **cursor-based pagination** (`paginateWithCursor`).

## Offset-Based Pagination

### `paginate(page, perPage)`

Returns a page of results along with metadata about the total result set.

```typescript
const result = await sql.from(User).paginate(1, 10);

console.log(result.data); // User[]
console.log(result.paginationMetadata);
// {
//   total: 100,
//   perPage: 10,
//   currentPage: 1,
//   firstPage: 1,
//   isEmpty: false,
//   lastPage: 10,
//   hasMorePages: true,
//   hasPages: true,
// }
```

You can combine it with any query builder method:

```typescript
const result = await sql
  .from(User)
  .where("status", "active")
  .orderBy("createdAt", "desc")
  .select("id", "name", "email")
  .paginate(2, 25);
```

### Pagination Metadata

The `paginationMetadata` object contains:

| Property       | Type      | Description                                 |
| -------------- | --------- | ------------------------------------------- |
| `total`        | `number`  | Total number of matching records            |
| `perPage`      | `number`  | Number of records per page                  |
| `currentPage`  | `number`  | Current page number                         |
| `firstPage`    | `number`  | Always `1`                                  |
| `isEmpty`      | `boolean` | `true` if total is `0`                      |
| `lastPage`     | `number`  | Last page number (minimum `1`)              |
| `hasMorePages` | `boolean` | `true` if there are pages after the current |
| `hasPages`     | `boolean` | `true` if total exceeds `perPage`           |

### Raw Query Builder

The raw query builder also supports pagination:

```typescript
const result = await sql.from("users").paginate(1, 10);
console.log(result.data); // Record<string, any>[]
console.log(result.paginationMetadata);
```

## Cursor-Based Pagination

### `paginateWithCursor(limit, options, cursor?)`

Cursor-based pagination is ideal for infinite-scroll UIs or real-time feeds where items may be inserted between page loads. Instead of using an offset, it uses a **discriminator column** value to determine where the next page starts.

```typescript
// First page
const [firstPage, cursor] = await sql.from(User).paginateWithCursor(10, {
  discriminator: "id",
  orderBy: "asc",
});

console.log(firstPage.data); // User[]
console.log(cursor); // { key: "id", value: 42 }

// Next page — pass the cursor from the previous response
const [nextPage, nextCursor] = await sql.from(User).paginateWithCursor(
  10,
  {
    discriminator: "id",
    orderBy: "asc",
  },
  cursor,
);
```

### Composite Discriminators

Pass an array of columns as `discriminator` to paginate on a composite key. This is useful when a single column is not unique enough to guarantee stable ordering (e.g., paginating by `(tenantId, createdAt)` within a multi-tenant table).

```typescript
// First page — composite cursor on (tenantId, createdAt)
const [firstPage, cursor] = await sql.from(Event).paginateWithCursor(10, {
  discriminator: ["tenantId", "createdAt"],
  orderBy: "asc",
});

console.log(cursor); // { key: ["tenantId", "createdAt"], value: [5, "2026-01-15..."] }

// Next page — pass the composite cursor back
const [nextPage, nextCursor] = await sql.from(Event).paginateWithCursor(
  10,
  { discriminator: ["tenantId", "createdAt"], orderBy: "asc" },
  cursor,
);
```

With a composite cursor, the generated `WHERE` clause uses tuple comparison semantics — it returns rows that are strictly greater than the cursor tuple across all columns, handling ties on the first column by comparing the second, and so on.

### Cursor Options

| Option          | Type                          | Description                                                        |
| --------------- | ----------------------------- | ------------------------------------------------------------------ |
| `discriminator` | `keyof Model` \| `ModelKey[]` | Column (or array of columns) to paginate on. An array enables composite cursor pagination. |
| `orderBy`       | `"asc"` \| `"desc"`           | Sort direction (default: `"asc"`). Applied to all discriminator columns. |
| `operator`      | `">"` \| `"<"` etc.           | Comparison operator for cursor (default: `">"`).                   |

### Cursor Pagination Metadata

The cursor pagination metadata is simpler:

| Property    | Type      | Description                      |
| ----------- | --------- | -------------------------------- |
| `total`     | `number`  | Total number of matching records |
| `perPage`   | `number`  | Number of records per page       |
| `firstPage` | `number`  | Always `1`                       |
| `isEmpty`   | `boolean` | `true` if total is `0`           |

## Chunking Large Datasets

The `chunk` method processes large datasets in manageable pieces without loading everything into memory:

```typescript
for await (const users of sql.from(User).chunk(250)) {
  await processUserBatch(users);
}
```

## Choosing a Strategy

| Strategy             | Best For                         | Pros                                   | Cons                                  |
| -------------------- | -------------------------------- | -------------------------------------- | ------------------------------------- |
| `paginate`           | Numbered pages, admin dashboards | Simple API, total count, page metadata | Slower on very deep offsets¹          |
| `paginateWithCursor` | Infinite scroll, real-time feeds | Consistent performance at any depth    | No random page access, no total pages |
| `chunk`              | Batch processing, data exports   | Memory efficient                       | Not for API responses                 |


