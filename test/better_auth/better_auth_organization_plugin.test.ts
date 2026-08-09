import { betterAuthAdapter } from "../../src/better_auth/better_auth_adapter";
import { env } from "../../src/env/env";
import { SqlDataSource } from "../../src/sql/sql_data_source";

// Proves the adapter is generic across plugins, not hand-tuned to the core tables.
const SUPPORTED_DIALECTS = ["sqlite", "postgres", "mysql"];
const describeIfSupported = SUPPORTED_DIALECTS.includes(env.DB_TYPE ?? "")
  ? describe
  : describe.skip;

const TABLES = [
  "teamMember",
  "team",
  "invitation",
  "member",
  "organization",
  "session",
  "account",
  "verification",
  "user",
];

let sql: SqlDataSource;
let auth: any;

beforeAll(async () => {
  sql = new SqlDataSource();
  await sql.connect();

  for (const table of TABLES) {
    await sql.schema().dropTableIfExists(table);
  }

  await sql.schema().createTable("user", (t) => {
    t.varchar("id", 36).primaryKey();
    t.varchar("name", 255).notNullable();
    t.varchar("email", 255).notNullable().unique();
    t.boolean("emailVerified").notNullable();
    t.varchar("image", 2083);
    t.datetime("createdAt").notNullable();
    t.datetime("updatedAt").notNullable();
  });

  await sql.schema().createTable("session", (t) => {
    t.varchar("id", 36).primaryKey();
    t.datetime("expiresAt").notNullable();
    t.varchar("token", 255).notNullable().unique();
    t.datetime("createdAt").notNullable();
    t.datetime("updatedAt").notNullable();
    t.varchar("ipAddress", 255);
    t.varchar("userAgent", 255);
    t.varchar("userId", 36).notNullable();
    t.varchar("activeOrganizationId", 36);
    t.varchar("activeTeamId", 36); // teams.enabled
  });

  await sql.schema().createTable("account", (t) => {
    t.varchar("id", 36).primaryKey();
    t.varchar("accountId", 255).notNullable();
    t.varchar("providerId", 255).notNullable();
    t.varchar("userId", 36).notNullable();
    t.varchar("accessToken", 2083);
    t.varchar("refreshToken", 2083);
    t.varchar("idToken", 2083);
    t.datetime("accessTokenExpiresAt");
    t.datetime("refreshTokenExpiresAt");
    t.varchar("scope", 255);
    t.varchar("password", 255);
    t.datetime("createdAt").notNullable();
    t.datetime("updatedAt").notNullable();
  });

  await sql.schema().createTable("verification", (t) => {
    t.varchar("id", 36).primaryKey();
    t.varchar("identifier", 255).notNullable();
    t.varchar("value", 255).notNullable();
    t.datetime("expiresAt").notNullable();
    t.datetime("createdAt");
    t.datetime("updatedAt");
  });

  await sql.schema().createTable("organization", (t) => {
    t.varchar("id", 36).primaryKey();
    t.varchar("name", 255).notNullable();
    t.varchar("slug", 255).notNullable().unique();
    t.varchar("logo", 2083);
    t.datetime("createdAt").notNullable();
    t.datetime("updatedAt");
    t.varchar("metadata", 4000);
  });

  await sql.schema().createTable("member", (t) => {
    t.varchar("id", 36).primaryKey();
    t.varchar("organizationId", 36).notNullable();
    t.varchar("userId", 36).notNullable();
    t.varchar("role", 255).notNullable();
    t.datetime("createdAt").notNullable();
  });

  await sql.schema().createTable("invitation", (t) => {
    t.varchar("id", 36).primaryKey();
    t.varchar("organizationId", 36).notNullable();
    t.varchar("email", 255).notNullable();
    t.varchar("role", 255);
    t.varchar("status", 255).notNullable();
    t.datetime("expiresAt");
    t.datetime("createdAt").notNullable();
    t.varchar("inviterId", 36).notNullable();
    t.varchar("teamId", 36);
  });

  await sql.schema().createTable("team", (t) => {
    t.varchar("id", 36).primaryKey();
    t.varchar("name", 255).notNullable();
    t.varchar("organizationId", 36).notNullable();
    t.datetime("createdAt").notNullable();
    t.datetime("updatedAt");
  });

  await sql.schema().createTable("teamMember", (t) => {
    t.varchar("id", 36).primaryKey();
    t.varchar("teamId", 36).notNullable();
    t.varchar("userId", 36).notNullable();
    t.datetime("createdAt").notNullable();
  });

  const { betterAuth } = await import("better-auth");
  const { organization } = await import("better-auth/plugins");
  auth = betterAuth({
    database: betterAuthAdapter(sql),
    emailAndPassword: { enabled: true },
    secret: "test-secret-test-secret-test-secret",
    baseURL: "http://localhost:3000",
    plugins: [organization({ teams: { enabled: true } })],
  });
});

afterAll(async () => {
  for (const table of TABLES) {
    await sql.schema().dropTableIfExists(table);
  }
  await sql.disconnect();
});

describeIfSupported(
  `[${env.DB_TYPE}] better-auth organization + teams plugin`,
  () => {
    test("create organization, create team, invite + accept, list members/organizations", async () => {
      await auth.api.signUpEmail({
        body: {
          name: "Owner",
          email: "owner@example.com",
          password: "password123",
        },
      });
      const ownerSignIn = await auth.api.signInEmail({
        body: { email: "owner@example.com", password: "password123" },
        asResponse: true,
      });
      const ownerHeaders = new Headers({
        cookie: ownerSignIn.headers.get("set-cookie") ?? "",
      });

      const org = await auth.api.createOrganization({
        headers: ownerHeaders,
        body: { name: "Acme Inc", slug: "acme-inc" },
      });
      expect(org?.slug).toBe("acme-inc");

      const team = await auth.api.createTeam({
        headers: ownerHeaders,
        body: { name: "Engineering", organizationId: org.id },
      });
      expect(team?.name).toBe("Engineering");

      await auth.api.signUpEmail({
        body: {
          name: "Invitee",
          email: "invitee@example.com",
          password: "password123",
        },
      });

      const invitation = await auth.api.createInvitation({
        headers: ownerHeaders,
        body: {
          email: "invitee@example.com",
          role: "member",
          organizationId: org.id,
        },
      });
      expect(invitation?.status).toBe("pending");

      const inviteeSignIn = await auth.api.signInEmail({
        body: { email: "invitee@example.com", password: "password123" },
        asResponse: true,
      });
      const inviteeHeaders = new Headers({
        cookie: inviteeSignIn.headers.get("set-cookie") ?? "",
      });

      // Claims the invitation via a guarded incrementOne CAS (pending -> accepted).
      const accepted = await auth.api.acceptInvitation({
        headers: inviteeHeaders,
        body: { invitationId: invitation.id },
      });
      expect(accepted?.member?.role).toBe("member");

      const invitationRow = await sql
        .from("invitation")
        .where("id", invitation.id)
        .one();
      expect(invitationRow?.status).toBe("accepted");

      const members = await auth.api.listMembers({
        headers: ownerHeaders,
        query: { organizationId: org.id },
      });
      expect(members.total).toBe(2);
      expect(new Set(members.members.map((m: any) => m.role))).toEqual(
        new Set(["owner", "member"]),
      );

      const orgs = await auth.api.listOrganizations({ headers: ownerHeaders });
      expect(orgs.map((o: any) => o.slug)).toEqual(["acme-inc"]);

      const teamRow = await sql.from("team").where("name", "Engineering").one();
      expect(teamRow).not.toBeNull();
    });

    test("accepting an already-accepted invitation fails the compare-and-swap", async () => {
      await auth.api.signUpEmail({
        body: {
          name: "Owner2",
          email: "owner2@example.com",
          password: "password123",
        },
      });
      const ownerSignIn = await auth.api.signInEmail({
        body: { email: "owner2@example.com", password: "password123" },
        asResponse: true,
      });
      const ownerHeaders = new Headers({
        cookie: ownerSignIn.headers.get("set-cookie") ?? "",
      });
      const org = await auth.api.createOrganization({
        headers: ownerHeaders,
        body: { name: "Beta Inc", slug: "beta-inc" },
      });

      await auth.api.signUpEmail({
        body: {
          name: "Invitee2",
          email: "invitee2@example.com",
          password: "password123",
        },
      });
      const invitation = await auth.api.createInvitation({
        headers: ownerHeaders,
        body: {
          email: "invitee2@example.com",
          role: "member",
          organizationId: org.id,
        },
      });
      const inviteeSignIn = await auth.api.signInEmail({
        body: { email: "invitee2@example.com", password: "password123" },
        asResponse: true,
      });
      const inviteeHeaders = new Headers({
        cookie: inviteeSignIn.headers.get("set-cookie") ?? "",
      });

      await auth.api.acceptInvitation({
        headers: inviteeHeaders,
        body: { invitationId: invitation.id },
      });

      await expect(
        auth.api.acceptInvitation({
          headers: inviteeHeaders,
          body: { invitationId: invitation.id },
        }),
      ).rejects.toThrow();
    });
  },
);
