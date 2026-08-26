import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    "intro",
    "ai-agent-guide",
    {
      type: "category",
      label: "Getting Started",
      items: [
        "getting-started/philosophy",
        "getting-started/prerequisites",
        "getting-started/installation",
        "getting-started/setup",
        "getting-started/environment",
        "getting-started/typescript",
        "getting-started/javascript",
        "getting-started/logging",
      ],
    },
    {
      type: "category",
      label: "SQL",
      items: [
        "databases/sql/introduction",
        "databases/sql/patterns",
        {
          type: "category",
          label: "Models",
          items: [
            "databases/sql/models/basics",
            "databases/sql/models/define-model",
            "databases/sql/models/case-conventions",
            "databases/sql/models/mixins",
            "databases/sql/models/hooks",
            "databases/sql/models/validation",
            "databases/sql/models/zod-integration",
            "databases/sql/models/instance-methods",
            "databases/sql/models/views",
            "databases/sql/models/computed-columns",
          ],
        },
        "databases/sql/standard-methods/basics",
        "databases/sql/relations/overview",
        {
          type: "category",
          label: "Query Builder",
          items: [
            "databases/sql/query-builder/basics",
            "databases/sql/query-builder/model-query-builder",
            "databases/sql/query-builder/query-builder",
            "databases/sql/query-builder/pagination",
            "databases/sql/query-builder/sql-functions",
          ],
        },
        "databases/sql/advanced/transactions",
        {
          type: "category",
          label: "Migrations",
          items: [
            "databases/sql/cli/migrations/basics",
            "databases/sql/cli/migrations/templates",
            "databases/sql/cli/migrations/programmatic",
            "databases/sql/cli/migrations/advanced",
            "databases/sql/cli/migrations/generate-migrations",
          ],
        },
        {
          type: "category",
          label: "Command Line Interface",
          items: [
            "databases/sql/cli/overview",
            "databases/sql/cli/db-pull",
            "databases/sql/cli/seeders/basics",
            "databases/sql/cli/run-sql",
            "databases/sql/cli/refresh",
            "databases/sql/cli/create-migration",
            "databases/sql/cli/sync",
          ],
        },
        {
          type: "category",
          label: "Advanced",
          items: [
            "databases/sql/advanced/caching",
            "databases/sql/advanced/cte",
            "databases/sql/advanced/json",
            "databases/sql/advanced/sqlite-json-limitations",
            "databases/sql/advanced/model-embedding",
            "databases/sql/advanced/replication",
            "databases/sql/advanced/observers",
            "databases/sql/advanced/health-check",
            "databases/sql/advanced/introspection",
          ],
        },
        {
          type: "category",
          label: "Plugins (Experimental)",
          items: [
            "databases/sql/plugins/adminjs",
            "databases/sql/plugins/better-auth",
          ],
        },
        {
          type: "category",
          label: "OpenAPI (Experimental)",
          items: ["databases/openapi"],
        },
      ],
    },
    {
      type: "category",
      label: "MongoDB",
      items: [
        "databases/nosql/mongodb/introduction",
        "databases/nosql/mongodb/collections",
        "databases/nosql/mongodb/methods",
        "databases/nosql/mongodb/query-builder",
        "databases/nosql/mongodb/sessions",
      ],
    },
    {
      type: "category",
      label: "Redis",
      items: [
        "databases/nosql/redis/introduction",
        "databases/nosql/redis/methods",
      ],
    },
    {
      type: "category",
      label: "Utilities",
      items: ["utils/overview", "utils/api"],
    },
  ],
};

export default sidebars;
