import { User } from "../sql_models/User";
import { Post } from "../sql_models/Post";
import { SqlDataSource } from "../../../src/sql/sql_data_source";

let sql: SqlDataSource;
beforeAll(async () => {
  sql = await SqlDataSource.connect({
    type: "sqlite",
    database: "sqlite.db",
    logs: true,
  });
});

afterAll(async () => {
  await sql.closeConnection();
});

beforeEach(async () => {
  await Post.query().delete();
  await User.query().delete();
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
      { trx },
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
      { trx },
    );

    if (!post) {
      throw new Error("Post not created");
    }

    await trx.commit();

    const userWithPosts = await User.query()
      .where("id", user.id)
      .with("posts")
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
      { trx },
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
      { trx },
    );
    throw new Error("Intentional error");

    await trx.commit();
  } catch (error) {
    await trx.rollback();

    const userWithPosts = await User.query()
      .where("email", "charlie-test@gmail.com")
      .with("posts")
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
      { trx },
    );

    expect(users.length).toBe(2);

    await User.query({ trx })
      .whereIn(
        "id",
        users.map((user) => user.id),
      )
      .update({ isActive: false });

    await trx.commit();
  } catch (error) {
    await trx.rollback();
    throw error;
  }

  const updatedUsers = await User.query().many();
  expect(updatedUsers.every((user) => user.isActive === false)).toBe(true);
});

test("Delete records within a transaction", async () => {
  const trx = await sql.startTransaction();

  let user: User | null = null;
  try {
    user = await User.insert(
      {
        name: "Frank",
        email: "frank-test@gmail.com",
        signupSource: "email",
        isActive: true,
      },
      { trx },
    );

    if (!user) {
      throw new Error("User not created");
    }

    await User.query({ trx }).where("id", user.id).delete();

    await trx.commit();
  } catch (error) {
    await trx.rollback();
    throw error;
  }
  const deletedUser = await User.query().where("id", user.id).one();
  expect(deletedUser).toBeNull();
});

test("Update records within a transaction", async () => {
  const trx = await sql.startTransaction();

  let user: User | null = null;
  try {
    user = await User.insert(
      {
        name: "Frank",
        email: "sdosaifmoas",
        signupSource: "email",
        isActive: true,
      },
      { trx },
    );

    if (!user) {
      throw new Error("User not created");
    }

    await User.query({ trx }).where("id", user.id).update({ isActive: false });

    await trx.commit();
  } catch (error) {
    await trx.rollback();
    throw error;
  }

  const updatedUser = await User.query().where("id", user.id).one();
  expect(updatedUser?.isActive).toBe(false);
});

test("Insert records within a transaction with error", async () => {
  const trx = await sql.startTransaction();

  try {
    const user = await User.insert(
      {
        name: "Frank",
        email: "sdasdsd",
        signupSource: "email",
        isActive: true,
      },
      { trx },
    );

    if (!user) {
      throw new Error("User not created");
    }

    await User.insert(
      {
        name: "Frank",
        email: "sdasdsd",
        signupSource: "email",
        isActive: true,
      },
      { trx },
    );

    throw new Error("Intentional error");
    await trx.commit();
  } catch (error) {
    await trx.rollback();
  }

  const user = await User.query().where("email", "sdasdsd").one();
  expect(user).toBeNull();
});
