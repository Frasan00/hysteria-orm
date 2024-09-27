import { User } from "../Models/User";
import { Post } from "../Models/Post";
import { SqlDataSource } from "../../../src/Sql/SqlDatasource";

let sql: SqlDataSource;
beforeAll(async () => {
  sql = await SqlDataSource.connect({
    type: "mysql",
    database: "test",
    username: "root",
    password: "root",
    host: "localhost",
    port: 3306,
  });
});

afterAll(async () => {
  await sql.closeConnection();
});

beforeEach(async () => {
  await Post.deleteQuery().delete();
  await User.deleteQuery().delete();
});

test("Create a new user with posts within a transaction", async () => {
  const trx = await sql.startTransaction();
  try {
    const user = await User.insert(
      {
        name: "Bob",
        email: "bob-test@gmail.com",
        signupSource: "email",
        isActive: true,
      },
      trx,
    );

    if (!user) {
      throw new Error("User not created");
    }

    const post = await Post.insert(
      {
        userId: user.id,
        title: "Post 2",
        content: "Content 2",
      },
      trx,
    );

    if (!post) {
      throw new Error("Post not created");
    }

    await trx.commit();

    const userWithPosts = await User.query()
      .where("id", user.id)
      .addRelations(["posts"])
      .one();
    expect(userWithPosts).not.toBeNull();
    expect(userWithPosts?.posts).not.toBeNull();
    expect(userWithPosts?.posts.length).toBe(1);
    expect(userWithPosts?.posts[0].title).toBe("Post 2");
  } catch (error) {
    await trx.rollback();
    throw error;
  }
});

test("Rollback transaction on error", async () => {
  const trx = await sql.startTransaction();

  try {
    const user = await User.insert(
      {
        name: "Charlie",
        email: "charlie-test@gmail.com",
        signupSource: "email",
        isActive: true,
      },
      trx,
    );

    if (!user) {
      throw new Error("User not created");
    }

    // Intentionally cause an error
    await Post.insert(
      {
        userId: user.id,
        title: "Post 3",
        content: "Content 3",
      },
      trx,
    );
    throw new Error("Intentional error");

    await trx.commit();
  } catch (error) {
    await trx.rollback();

    const userWithPosts = await User.query()
      .where("email", "charlie-test@gmail.com")
      .addRelations(["posts"])
      .one();
    expect(userWithPosts).toBeNull();
  }
});

test("Massive update within a transaction", async () => {
  const trx = await sql.startTransaction();
  try {
    const users = await User.insertMany(
      [
        {
          name: "Dave",
          email: "dave-test@gmail.com",
          signupSource: "email",
          isActive: true,
        },
        {
          name: "Eve",
          email: "eve-test@gmail.com",
          signupSource: "email",
          isActive: true,
        },
      ],
      trx,
    );

    expect(users.length).toBeGreaterThan(0);
    expect(users.length).toBe(2);

    const updatedUsers = await User.update()
      .whereIn(
        "id",
        users.map((user) => user.id),
      )
      .withData({ isActive: false }, trx);

    await trx.commit();

    expect(updatedUsers.every((user) => user.isActive === false)).toBe(true);
  } catch (error) {
    await trx.rollback();
    throw error;
  }
});

test("Delete records within a transaction", async () => {
  const trx = await sql.startTransaction();

  try {
    const user = await User.insert(
      {
        name: "Frank",
        email: "frank-test@gmail.com",
        signupSource: "email",
        isActive: true,
      },
      trx,
    );

    if (!user) {
      throw new Error("User not created");
    }

    await User.deleteQuery().where("id", user.id).delete(trx);

    await trx.commit();

    const deletedUser = await User.query().where("id", user.id).one();
    expect(deletedUser).toBeNull();
  } catch (error) {
    await trx.rollback();
    throw error;
  }
});
