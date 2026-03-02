import { defineModel, col, rel } from "../../../src/sql/models/define_model";
import type { ModelRelation } from "../../../src/sql/models/model_manager/model_manager_types";
import type { RelatedInstance } from "../../../src/sql/models/model_query_builder/model_query_builder_types";

/**
 * Type-level assertion helper.
 * If `A` is not assignable to `B`, TypeScript will report an error.
 */
type AssertAssignable<A, B> = A extends B ? true : never;

describe("defineModel – nested self-referencing relation types", () => {
  const User = defineModel("users_self_ref", {
    columns: {
      id: col.bigIncrement(),
      refUserId: col.bigInteger(),
      email: col.string({ length: 100, nullable: false }),
      createdAt: col.timestamp<string>({
        nullable: false,
        autoCreate: true,
        serialize: (value: Date | string) =>
          value instanceof Date ? value.toISOString() : value,
      }),
    },
    relations: {
      refUser: rel.belongsTo((self) => self, "refUserId"),
    },
  });

  type UserInstance = InstanceType<typeof User>;

  test("self-referencing relation exists on the model type", () => {
    // Runtime: relation metadata is registered
    const relations = User.getRelations();
    const refUserRel = relations.find((r) => r.columnName === "refUser");
    expect(refUserRel).toBeDefined();
  });

  test("ModelRelation resolves self-referencing relation keys (not never)", () => {
    // Type-level: ModelRelation<UserInstance> should include "refUser"
    type UserRelations = ModelRelation<UserInstance>;
    const _check: AssertAssignable<"refUser", UserRelations> = true;
    expect(_check).toBe(true);
  });

  test("RelatedInstance of a self-ref relation has its own relations", () => {
    // Type-level: the related instance should also have "refUser"
    type Related = RelatedInstance<UserInstance, "refUser">;
    type RelatedRelations = ModelRelation<Related>;
    const _check: AssertAssignable<"refUser", RelatedRelations> = true;
    expect(_check).toBe(true);
  });

  test("nested self-referencing load types compile correctly", () => {
    // Type-level: this verifies the exact user scenario that was failing.
    // If InferRelations doesn't include relations in SelfType,
    // the inner qb.load("refUser") would error with:
    //   Argument of type '"refUser"' is not assignable to parameter of type 'never'.
    //
    // We verify by checking that the RelatedInstance's ModelRelation
    // includes the self-ref key, which is what load() uses as its first param.
    type NestedRelated = RelatedInstance<UserInstance, "refUser">;
    type NestedRelations = ModelRelation<NestedRelated>;
    const _check: AssertAssignable<"refUser", NestedRelations> = true;
    expect(_check).toBe(true);
  });

  test("triple-nested self-referencing types compile", () => {
    // Type-level: third level of nesting should also work
    type Level1 = RelatedInstance<UserInstance, "refUser">;
    type Level2 = RelatedInstance<Level1, "refUser">;
    type Level2Relations = ModelRelation<Level2>;
    const _check: AssertAssignable<"refUser", Level2Relations> = true;
    expect(_check).toBe(true);
  });

  test("self-ref relation coexists with cross-model relations", () => {
    const Post = defineModel("posts_self_ref", {
      columns: {
        id: col.bigIncrement(),
        authorId: col.bigInteger(),
        title: col.string(),
      },
    });

    const Author = defineModel("authors_self_ref", {
      columns: {
        id: col.bigIncrement(),
        mentorId: col.bigInteger(),
        name: col.string({ nullable: false }),
      },
      relations: {
        mentor: rel.belongsTo((self) => self, "mentorId"),
        posts: rel.hasMany(() => Post, "authorId"),
      },
    });

    type AuthorInstance = InstanceType<typeof Author>;
    type AuthorRelations = ModelRelation<AuthorInstance>;

    // Both relation keys should be valid
    const _checkMentor: AssertAssignable<"mentor", AuthorRelations> = true;
    // "posts" is not a self-ref, it's a regular relation — should also be valid
    // (but posts is Model[] typed, so it's a relation not a ModelKey)
    expect(_checkMentor).toBe(true);

    // Nested: mentor's mentor should still have relations
    type MentorRelated = RelatedInstance<AuthorInstance, "mentor">;
    type MentorRelations = ModelRelation<MentorRelated>;
    const _checkNestedMentor: AssertAssignable<"mentor", MentorRelations> =
      true;
    expect(_checkNestedMentor).toBe(true);

    // Runtime check
    const relations = Author.getRelations();
    expect(relations.length).toBe(2);
    expect(relations.map((r) => r.columnName)).toEqual(
      expect.arrayContaining(["mentor", "posts"]),
    );
  });

  test("hasMany self-ref nested types compile", () => {
    const TreeNode = defineModel("tree_nodes_nested", {
      columns: {
        id: col.bigIncrement(),
        parentId: col.bigInteger(),
        label: col.string(),
      },
      relations: {
        parent: rel.belongsTo((self) => self, "parentId"),
        children: rel.hasMany((self) => self, "parentId"),
      },
    });

    type TreeInstance = InstanceType<typeof TreeNode>;

    // Nested children's children should also be loadable
    type ChildRelated = RelatedInstance<TreeInstance, "children">;
    type ChildRelations = ModelRelation<ChildRelated>;
    const _checkChildren: AssertAssignable<"children", ChildRelations> = true;
    const _checkParent: AssertAssignable<"parent", ChildRelations> = true;
    expect(_checkChildren).toBe(true);
    expect(_checkParent).toBe(true);
  });

  test("hasOne self-ref nested types compile", () => {
    const Employee = defineModel("employees_nested", {
      columns: {
        id: col.bigIncrement(),
        managerId: col.bigInteger(),
        name: col.string({ nullable: false }),
      },
      relations: {
        manager: rel.hasOne((self) => self, "managerId"),
      },
    });

    type EmpInstance = InstanceType<typeof Employee>;
    type ManagerRelated = RelatedInstance<EmpInstance, "manager">;
    type ManagerRelations = ModelRelation<ManagerRelated>;
    const _check: AssertAssignable<"manager", ManagerRelations> = true;
    expect(_check).toBe(true);
  });
});
