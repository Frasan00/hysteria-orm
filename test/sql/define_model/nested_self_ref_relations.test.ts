import {
  defineModel,
  col,
  defineRelations,
  createSchema,
} from "../../../src/sql/models/define_model";
import type { ModelRelation } from "../../../src/sql/models/model_manager/model_manager_types";
import type { RelatedInstance } from "../../../src/sql/models/model_query_builder/model_query_builder_types";

/**
 * Type-level assertion helper.
 * If `A` is not assignable to `B`, TypeScript will report an error.
 */
type AssertAssignable<A, B> = A extends B ? true : never;

describe("defineModel – nested self-referencing relation types", () => {
  const UserBase = defineModel("users_self_ref", {
    columns: {
      id: col.bigIncrement(),
      refUserId: col.bigInteger(),
      email: col.string({ length: 100, nullable: false }),
      createdAt: col.timestamp({
        nullable: false,
        autoCreate: true,
        serialize: (value: Date | string) =>
          value instanceof Date ? value.toISOString() : value,
      }),
    },
  });

  const UserRelations = defineRelations(UserBase, ({ belongsTo }) => ({
    refUser: belongsTo(UserBase, { foreignKey: "refUserId" }),
  }));

  const selfRefSchema = createSchema(
    { users_self_ref: UserBase },
    { users_self_ref: UserRelations },
  );

  const User = selfRefSchema.users_self_ref;

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
    type NestedRelated = RelatedInstance<UserInstance, "refUser">;
    type NestedRelations = ModelRelation<NestedRelated>;
    const _check: AssertAssignable<"refUser", NestedRelations> = true;
    expect(_check).toBe(true);
  });

  test("triple-nested self-referencing types compile", () => {
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

    const AuthorBase = defineModel("authors_self_ref", {
      columns: {
        id: col.bigIncrement(),
        mentorId: col.bigInteger(),
        name: col.string({ nullable: false }),
      },
    });

    const AuthorRelations = defineRelations(
      AuthorBase,
      ({ belongsTo, hasMany }) => ({
        mentor: belongsTo(AuthorBase, { foreignKey: "mentorId" }),
        posts: hasMany(Post, { foreignKey: "authorId" }),
      }),
    );

    const authorSchema = createSchema(
      { authors_self_ref: AuthorBase, posts_self_ref: Post },
      { authors_self_ref: AuthorRelations },
    );

    const Author = authorSchema.authors_self_ref;
    type AuthorInstance = InstanceType<typeof Author>;
    type AuthorRelationsT = ModelRelation<AuthorInstance>;

    // Both relation keys should be valid
    const _checkMentor: AssertAssignable<"mentor", AuthorRelationsT> = true;
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
    });

    const TreeNodeRelations = defineRelations(
      TreeNode,
      ({ belongsTo, hasMany }) => ({
        parent: belongsTo(TreeNode, { foreignKey: "parentId" }),
        children: hasMany(TreeNode, { foreignKey: "parentId" }),
      }),
    );

    const treeSchema = createSchema(
      { tree_nodes_nested: TreeNode },
      { tree_nodes_nested: TreeNodeRelations },
    );

    const TreeNodeModel = treeSchema.tree_nodes_nested;
    type TreeInstance = InstanceType<typeof TreeNodeModel>;

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
    });

    const EmployeeRelations = defineRelations(Employee, ({ hasOne }) => ({
      manager: hasOne(Employee, { foreignKey: "managerId" }),
    }));

    const empSchema = createSchema(
      { employees_nested: Employee },
      { employees_nested: EmployeeRelations },
    );

    const EmployeeModel = empSchema.employees_nested;
    type EmpInstance = InstanceType<typeof EmployeeModel>;
    type ManagerRelated = RelatedInstance<EmpInstance, "manager">;
    type ManagerRelations = ModelRelation<ManagerRelated>;
    const _check: AssertAssignable<"manager", ManagerRelations> = true;
    expect(_check).toBe(true);
  });
});
