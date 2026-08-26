---
title: SQL Functions
description: "SQL functions and aggregations: COUNT, SUM, AVG, MIN, MAX with Hysteria ORM query builder."
keywords: [hysteria-orm, SQL functions, COUNT, SUM, AVG, aggregations]
sidebar_position: 5
---

# SQL Functions

Hysteria ORM provides a unified `selectFunc()` method for SQL functions. This method is fully type-safe with auto-inferred return types for known functions.

## selectFunc Method

The `selectFunc()` method applies SQL functions to columns with a typed alias:

```typescript
selectFunc(sqlFunction, column, alias);
```

- **sqlFunction**: The SQL function name (with intellisense for common functions)
- **column**: The column to apply the function to (use `"*"` for count)
- **alias**: The alias for the result

### Auto-Inferred Return Types

Return types are automatically inferred based on the function name:

| Functions                                                                              | Return Type |
| -------------------------------------------------------------------------------------- | ----------- |
| `count`, `sum`, `avg`, `min`, `max`, `length`, `abs`, `round`, `ceil`, `floor`, `sqrt` | `number`    |
| `upper`, `lower`, `trim`                                                               | `string`    |
| Custom/unknown functions                                                               | `any`       |

```typescript
// Return types are auto-inferred - no generic needed!
const result = await sql
  .from(User)
  .selectFunc("count", "*", "total") // total: number
  .selectFunc("upper", "name", "upperName") // upperName: string
  .selectFunc("custom_fn", "col", "result") // result: any
  .one();
```

## Aggregate Functions

| Function | SQL          | Description                   |
| -------- | ------------ | ----------------------------- |
| `count`  | `COUNT(col)` | Count rows or non-null values |
| `sum`    | `SUM(col)`   | Sum numeric values            |
| `avg`    | `AVG(col)`   | Calculate average             |
| `min`    | `MIN(col)`   | Find minimum value            |
| `max`    | `MAX(col)`   | Find maximum value            |

### Basic Usage

```typescript
// COUNT all rows
const result = await sql
  .from(User)
  .selectFunc("count", "*", "totalUsers")
  .one();

console.log(result?.totalUsers); // number - e.g., 42

// SUM
const result = await sql
  .from(Order)
  .selectFunc("sum", "amount", "totalRevenue")
  .one();

// AVG
const result = await sql
  .from(Product)
  .selectFunc("avg", "price", "averagePrice")
  .one();

// MIN / MAX
const result = await sql
  .from(User)
  .selectFunc("min", "age", "youngestAge")
  .selectFunc("max", "age", "oldestAge")
  .one();
```

### Combining Aggregates

```typescript
const stats = await sql
  .from(User)
  .selectFunc("count", "*", "totalUsers")
  .selectFunc("min", "age", "minAge")
  .selectFunc("max", "age", "maxAge")
  .selectFunc("avg", "age", "avgAge")
  .one();

// { totalUsers: 100, minAge: 18, maxAge: 85, avgAge: 35.5 }
// All typed as number!
```

### With GROUP BY

```typescript
const salesByCategory = await sql
  .from(Product)
  .select("category")
  .selectFunc("sum", "price", "totalSales")
  .selectFunc("count", "*", "productCount")
  .groupBy("category")
  .orderBy("totalSales", "desc")
  .many();
```

### Alternative: getCount, getSum, etc.

For simple cases where you just need a single aggregate value:

```typescript
// Using getCount (returns just the number)
const count = await sql.from(User).where("status", "active").getCount();
// Returns: 42

// Equivalent using selectFunc (returns object with property)
const result = await sql
  .from(User)
  .where("status", "active")
  .selectFunc("count", "*", "count")
  .one();
// Returns: { count: 42 }
```

## String Functions

| Function | SQL           | Description                        |
| -------- | ------------- | ---------------------------------- |
| `upper`  | `UPPER(col)`  | Convert to uppercase               |
| `lower`  | `LOWER(col)`  | Convert to lowercase               |
| `trim`   | `TRIM(col)`   | Remove leading/trailing whitespace |
| `length` | `LENGTH(col)` | Get string length                  |

### Usage

```typescript
// Convert to uppercase
const result = await sql
  .from(User)
  .select("name")
  .selectFunc("upper", "name", "upperName")
  .one();
// result.upperName = "JOHN DOE" (typed as string)

// Convert to lowercase
const result = await sql
  .from(User)
  .selectFunc("lower", "email", "lowerEmail")
  .one();
// result.lowerEmail = "john@example.com" (typed as string)

// Get string length
const result = await sql
  .from(User)
  .select("name")
  .selectFunc("length", "name", "nameLength")
  .one();
// result.nameLength = 8 (typed as number)

// Trim whitespace
const result = await sql
  .from(User)
  .selectFunc("trim", "name", "trimmedName")
  .one();
// result.trimmedName = "John" (typed as string)
```

## Numeric Functions

| Function | SQL          | Description                   |
| -------- | ------------ | ----------------------------- |
| `abs`    | `ABS(col)`   | Absolute value                |
| `round`  | `ROUND(col)` | Round to nearest integer      |
| `ceil`   | `CEIL(col)`  | Round up to nearest integer   |
| `floor`  | `FLOOR(col)` | Round down to nearest integer |
| `sqrt`   | `SQRT(col)`  | Square root                   |

### Usage

```typescript
// Absolute value
const result = await sql
  .from(Order)
  .select("balance")
  .selectFunc("abs", "balance", "absoluteBalance")
  .one();
// If balance = -100, result.absoluteBalance = 100

// Ceiling (round up)
const result = await sql
  .from(Order)
  .selectFunc("ceil", "price", "ceilPrice")
  .one();
// If price = 19.1, result.ceilPrice = 20

// Floor (round down)
const result = await sql
  .from(Order)
  .selectFunc("floor", "price", "floorPrice")
  .one();
// If price = 19.9, result.floorPrice = 19

// Square root
const result = await sql
  .from(Data)
  .selectFunc("sqrt", "value", "sqrtValue")
  .one();
// If value = 100, result.sqrtValue = 10
```

## Custom Functions and Complex Expressions

For functions with additional parameters (like `ROUND(col, decimals)` or `COALESCE(col, default)`), use `selectRaw()`:

```typescript
// ROUND with decimal places
const result = await sql
  .from(Order)
  .selectRaw<{ roundedPrice: number }>("round(price, 2) as roundedPrice")
  .one();

// COALESCE - return default when NULL
const result = await sql
  .from(User)
  .selectRaw<{
    displayName: string;
  }>("coalesce(nickname, 'Unknown') as displayName")
  .one();

// COUNT DISTINCT
const result = await sql
  .from(User)
  .selectRaw<{
    uniqueStatuses: number;
  }>("count(distinct status) as uniqueStatuses")
  .one();
```

## Chaining Multiple Functions

All SQL function methods can be chained together:

```typescript
const result = await sql
  .from(User)
  .select("name")
  .selectFunc("upper", "name", "upperName")
  .selectFunc("length", "name", "nameLength")
  .selectFunc("count", "*", "total")
  .one();

// All values are typed correctly:
// result.name: string
// result.upperName: string (auto-inferred)
// result.nameLength: number (auto-inferred)
// result.total: number (auto-inferred)
```

## Database Compatibility

:::warning
Some functions have database-specific limitations:

| Function | Limitation                                                    |
| -------- | ------------------------------------------------------------- |
| `ceil`   | **SQLite**: Not supported (no native CEIL function)           |
| `floor`  | **SQLite**: Not supported (no native FLOOR function)          |
| `sqrt`   | **CockroachDB**: Requires FLOAT type column, not INT          |
| `length` | **MSSQL**: Uses `LEN()` which does not count trailing spaces  |
| `ceil`   | **MSSQL**: Automatically uses `CEILING()` instead of `CEIL()` |

:::

## Raw Select (selectRaw)

For complex SQL expressions not covered by `selectFunc()`, use `selectRaw()`:

```typescript
const result = await sql
  .from(User)
  .selectRaw<{ total: number }>("COUNT(*) as total")
  .one();

console.log(result?.total);
```

### Type Parameter

Always provide a type parameter for TypeScript support:

```typescript
// With type parameter - full type safety
const result = await sql
  .from(User)
  .selectRaw<{
    avgAge: number;
    maxAge: number;
  }>("AVG(age) as avgAge, MAX(age) as maxAge")
  .one();

result?.avgAge; // number
result?.maxAge; // number
```

### Common Use Cases

```typescript
// Mathematical expressions
const result = await sql
  .from(Product)
  .selectRaw<{
    discountedPrice: number;
  }>("price * (1 - discount_rate) as discountedPrice")
  .many();

// String functions (PostgreSQL)
const result = await sql
  .from(User)
  .selectRaw<{
    fullName: string;
  }>("CONCAT(first_name, ' ', last_name) as fullName")
  .many();

// Date functions
const result = await sql
  .from(Order)
  .selectRaw<{
    orderYear: number;
  }>("EXTRACT(YEAR FROM created_at) as orderYear")
  .groupBy("orderYear")
  .many();

// CASE expression
const result = await sql
  .from(User)
  .selectRaw<{
    ageGroup: string;
  }>("CASE WHEN age < 18 THEN 'minor' WHEN age < 65 THEN 'adult' ELSE 'senior' END as ageGroup")
  .many();
```

### CAST Expressions

`CAST` expressions are fully supported. The type after `AS` inside `CAST()` is correctly recognized as a SQL type, not an alias:

```typescript
const result = await sql
  .from(User)
  .selectRaw<{ ageString: string }>("CAST(age AS VARCHAR) as ageString")
  .one();
```

### Combining with Regular Select

```typescript
const result = await sql
  .from(User)
  .select("name", "email")
  .selectRaw<{
    accountAge: number;
  }>("DATEDIFF(NOW(), created_at) as accountAge")
  .many();

result[0].name; // From select()
result[0].email; // From select()
result[0].accountAge; // From selectRaw()
```

---

Next: [QueryBuilder (Raw SQL)](./query-builder.md)
