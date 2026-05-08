import {
  generateModelName,
  generateFileName,
  sanitizeColumnName,
  SanitizedName,
} from "../../../src/cli/resources/db_pull_naming";

describe("db_pull_naming - generateModelName", () => {
  describe("PascalCase naming convention", () => {
    test("should singularize users to User", () => {
      const result = generateModelName("users", "pascal");

      expect(result).toBe("User");
    });

    test("should singularize categories to Category", () => {
      const result = generateModelName("categories", "pascal");

      expect(result).toBe("Category");
    });

    test("should singularize cities to City", () => {
      const result = generateModelName("cities", "pascal");

      expect(result).toBe("City");
    });

    test("should singularize countries to Country (ies -> y)", () => {
      const result = generateModelName("countries", "pascal");

      expect(result).toBe("Country");
    });

    test("should handle snake_case table names", () => {
      const result = generateModelName("user_profiles", "pascal");

      expect(result).toBe("UserProfile");
    });

    test("should handle single word table names", () => {
      const result = generateModelName("post", "pascal");

      expect(result).toBe("Post");
    });

    test("should handle tables ending in ss", () => {
      const result = generateModelName("class", "pascal");

      expect(result).toBe("Class");
    });

    test("should singularize words ending in sses", () => {
      const result = generateModelName("classes", "pascal");

      expect(result).toBe("Class");
    });

    test("should singularize words ending in shes", () => {
      const result = generateModelName("dishes", "pascal");

      expect(result).toBe("Dish");
    });

    test("should singularize words ending in ches", () => {
      const result = generateModelName("watches", "pascal");

      expect(result).toBe("Watch");
    });

    test("should singularize words ending in xes", () => {
      const result = generateModelName("boxes", "pascal");

      expect(result).toBe("Box");
    });

    test("should singularize words ending in zes", () => {
      const result = generateModelName("quizzes", "pascal");

      expect(result).toBe("Quizz");
    });

    test("should singularize words ending in ies", () => {
      const result = generateModelName("parties", "pascal");

      expect(result).toBe("Party");
    });
  });

  describe("camelCase naming convention", () => {
    test("should convert users to user in camelCase", () => {
      const result = generateModelName("users", "camel");

      expect(result).toBe("user");
    });

    test("should convert user_profiles to userProfile in camelCase", () => {
      const result = generateModelName("user_profiles", "camel");

      expect(result).toBe("userProfile");
    });

    test("should handle categories to category", () => {
      const result = generateModelName("categories", "camel");

      expect(result).toBe("category");
    });

    test("should handle ALL_CAPS input", () => {
      const result = generateModelName("ORDER_ITEMS", "camel");

      // ALL_CAPS with underscores doesn't convert well with toCamel
      expect(result).toBe("ORDER_ITEMS");
    });
  });

  describe("snake_case naming convention", () => {
    test("should keep users as user in snake_case", () => {
      const result = generateModelName("users", "snake");

      expect(result).toBe("user");
    });

    test("should convert UserProfiles to user_profile in snake_case", () => {
      const result = generateModelName("UserProfiles", "snake");

      expect(result).toBe("user_profile");
    });

    test("should convert camelCase to snake_case", () => {
      const result = generateModelName("orderItems", "snake");

      expect(result).toBe("order_item");
    });

    test("should handle categories singularization", () => {
      const result = generateModelName("categories", "snake");

      expect(result).toBe("category");
    });
  });
});

describe("db_pull_naming - sanitizeColumnName", () => {
  test("should return column name unchanged for non-reserved names", () => {
    const result = sanitizeColumnName("username");

    expect(result.name).toBe("username");
    expect(result.wasSanitized).toBe(false);
  });

  test("should sanitize 'query' reserved word", () => {
    const result = sanitizeColumnName("query");

    expect(result.name).toBe("query_");
    expect(result.wasSanitized).toBe(true);
  });

  test("should sanitize 'table' reserved word", () => {
    const result = sanitizeColumnName("table");

    expect(result.name).toBe("table_");
    expect(result.wasSanitized).toBe(true);
  });

  test("should sanitize 'find' reserved word", () => {
    const result = sanitizeColumnName("find");

    expect(result.name).toBe("find_");
    expect(result.wasSanitized).toBe(true);
  });

  test("should sanitize 'insert' reserved word", () => {
    const result = sanitizeColumnName("insert");

    expect(result.name).toBe("insert_");
    expect(result.wasSanitized).toBe(true);
  });

  test("should sanitize 'save' reserved word", () => {
    const result = sanitizeColumnName("save");

    expect(result.name).toBe("save_");
    expect(result.wasSanitized).toBe(true);
  });

  test("should sanitize 'all' reserved word", () => {
    const result = sanitizeColumnName("all");

    expect(result.name).toBe("all_");
    expect(result.wasSanitized).toBe(true);
  });

  test("should sanitize 'first' reserved word", () => {
    const result = sanitizeColumnName("first");

    expect(result.name).toBe("first_");
    expect(result.wasSanitized).toBe(true);
  });

  test("should sanitize 'constructor' reserved word", () => {
    const result = sanitizeColumnName("constructor");

    expect(result.name).toBe("constructor_");
    expect(result.wasSanitized).toBe(true);
  });

  test("should sanitize 'prototype' reserved word", () => {
    const result = sanitizeColumnName("prototype");

    expect(result.name).toBe("prototype_");
    expect(result.wasSanitized).toBe(true);
  });

  test("should not sanitize partial matches", () => {
    const result = sanitizeColumnName("my_query");

    expect(result.name).toBe("my_query");
    expect(result.wasSanitized).toBe(false);
  });

  test("should sanitize 'primaryKey' reserved word", () => {
    const result = sanitizeColumnName("primaryKey");

    expect(result.name).toBe("primaryKey_");
    expect(result.wasSanitized).toBe(true);
  });

  test("should sanitize 'softDelete' reserved word", () => {
    const result = sanitizeColumnName("softDelete");

    expect(result.name).toBe("softDelete_");
    expect(result.wasSanitized).toBe(true);
  });

  test("should sanitize 'getColumns' reserved word", () => {
    const result = sanitizeColumnName("getColumns");

    expect(result.name).toBe("getColumns_");
    expect(result.wasSanitized).toBe(true);
  });
});

describe("db_pull_naming - generateFileName", () => {
  describe("PascalCase file naming", () => {
    test("should generate User.ts for User model", () => {
      const result = generateFileName("User", "pascal");

      expect(result).toBe("User.ts");
    });

    test("should generate UserProfile.ts for UserProfile model", () => {
      const result = generateFileName("UserProfile", "pascal");

      expect(result).toBe("UserProfile.ts");
    });
  });

  describe("camelCase file naming", () => {
    test("should generate user.ts for user model", () => {
      const result = generateFileName("user", "camel");

      expect(result).toBe("user.ts");
    });

    test("should generate userProfile.ts for userProfile model", () => {
      const result = generateFileName("userProfile", "camel");

      expect(result).toBe("userProfile.ts");
    });
  });

  describe("snake_case file naming", () => {
    test("should generate user.ts for user model", () => {
      const result = generateFileName("user", "snake");

      expect(result).toBe("user.ts");
    });

    test("should generate user_profile.ts for userProfile model", () => {
      const result = generateFileName("userProfile", "snake");

      expect(result).toBe("user_profile.ts");
    });

    test("should generate order_item.ts for orderItem model", () => {
      const result = generateFileName("orderItem", "snake");

      expect(result).toBe("order_item.ts");
    });

    test("should generate user_profile.ts for UserProfile model", () => {
      const result = generateFileName("UserProfile", "snake");

      expect(result).toBe("user_profile.ts");
    });
  });
});
