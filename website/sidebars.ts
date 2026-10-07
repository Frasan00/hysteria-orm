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
        "getting-started/installation",
        "getting-started/setup",
        "getting-started/logging",
      ],
    },
    {
      type: "category",
      label: "SQL",
      items: [
        "databases/sql/introduction",
        "databases/sql/patterns",
        "databases/sql/drivers",
        {
          type: "category",
          label: "Models",
          items: [
            "databases/sql/models/define-model",
            "databases/sql/models/case-conventions",
            "databases/sql/models/mixins",
            "databases/sql/models/validation",
            "databases/sql/models/views",
            "databases/sql/models/instance-methods",
          ],
        },
        {
          type: "doc",
          id: "databases/sql/relations/overview",
          label: "Relations",
        },
        {
          type: "doc",
          id: "databases/sql/standard-methods/basics",
          label: "Reading & writing data",
        },
        {
          type: "category",
          label: "Query Builder",
          items: [
            "databases/sql/query-builder/overview",
            "databases/sql/query-builder/queries",
            "databases/sql/query-builder/write-statements",
            "databases/sql/query-builder/sql-functions",
          ],
        },
        {
          type: "doc",
          id: "databases/sql/advanced/transactions",
          label: "Transactions",
        },
        {
          type: "category",
          label: "Migrations",
          items: [
            "databases/sql/cli/migrations/basics",
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
          ],
        },
        {
          type: "category",
          label: "Advanced",
          items: [
            "databases/sql/advanced/caching",
            "databases/sql/advanced/json",
            "databases/sql/advanced/replication",
            "databases/sql/advanced/observers",
            "databases/sql/advanced/health-check",
            "databases/sql/advanced/model-embedding",
            "databases/sql/advanced/introspection",
          ],
        },
        {
          type: "category",
          label: "Integrations (Experimental)",
          items: [
            "databases/sql/plugins/adminjs",
            "databases/sql/plugins/better-auth",
            "databases/openapi",
          ],
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
      items: ["utils/api"],
    },
  ],
};

export default sidebars;
