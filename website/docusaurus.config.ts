import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import { themes as prismThemes } from "prism-react-renderer";

const config: Config = {
  title: "Hysteria ORM",
  tagline:
    "A TypeScript-first ORM for SQL, MongoDB, and Redis with type safety and expressive APIs",
  favicon: "img/favicon.svg",

  url: "https://frasan00.github.io",
  baseUrl: "/hysteria-orm/",

  organizationName: "Frasan00",
  projectName: "hysteria-orm",

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          routeBasePath: "/",
          sidebarPath: "./sidebars.ts",
          editUrl:
            "https://github.com/Frasan00/hysteria-orm/tree/main/website/",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      "@easyops-cn/docusaurus-search-local",
      {
        indexDocs: true,
        indexPages: true,
        language: ["en"],
        explicitSearchResultPath: true,
      },
    ],
    [
      "@docusaurus/plugin-client-redirects",
      {
        redirects: [
          {
            from: "/getting-started/prerequisites",
            to: "/getting-started/installation",
          },
          {
            from: "/getting-started/environment",
            to: "/getting-started/installation",
          },
          {
            from: "/getting-started/typescript",
            to: "/getting-started/setup",
          },
          {
            from: "/getting-started/javascript",
            to: "/getting-started/setup",
          },
          {
            from: "/databases/sql/models/basics",
            to: "/databases/sql/models/define-model",
          },
          {
            from: "/databases/sql/models/hooks",
            to: "/databases/sql/models/define-model",
          },
          {
            from: "/databases/sql/models/zod-integration",
            to: "/databases/sql/models/validation",
          },
          {
            from: "/databases/sql/models/computed-columns",
            to: "/databases/sql/models/views",
          },
          {
            from: "/databases/sql/relations/load-strategy",
            to: "/databases/sql/relations/overview",
          },
          {
            from: "/databases/sql/query-builder/basics",
            to: "/databases/sql/query-builder/overview",
          },
          {
            from: "/databases/sql/query-builder/model-query-builder",
            to: "/databases/sql/query-builder/queries",
          },
          {
            from: "/databases/sql/query-builder/query-builder",
            to: "/databases/sql/query-builder/queries",
          },
          {
            from: "/databases/sql/query-builder/pagination",
            to: "/databases/sql/query-builder/queries",
          },
          {
            from: "/databases/sql/advanced/atomic-decorator",
            to: "/databases/sql/advanced/transactions",
          },
          {
            from: "/databases/sql/advanced/sqlite-json-limitations",
            to: "/databases/sql/advanced/json",
          },
          {
            from: "/databases/sql/advanced/cte",
            to: "/databases/sql/query-builder/queries",
          },
          {
            from: "/databases/sql/cli/run-sql",
            to: "/databases/sql/cli/overview",
          },
          {
            from: "/databases/sql/cli/refresh",
            to: "/databases/sql/cli/overview",
          },
          {
            from: "/databases/sql/cli/create-migration",
            to: "/databases/sql/cli/overview",
          },
          {
            from: "/databases/sql/cli/sync",
            to: "/databases/sql/cli/overview",
          },
          {
            from: "/databases/sql/cli/migrations/programmatic",
            to: "/databases/sql/cli/migrations/basics",
          },
          {
            from: "/databases/sql/cli/migrations/templates",
            to: "/databases/sql/cli/migrations/basics",
          },
          {
            from: "/databases/sql/bun-drivers",
            to: "/databases/sql/drivers",
          },
          {
            from: "/databases/sql/web-and-react-native-drivers",
            to: "/databases/sql/drivers",
          },
          { from: "/utils/overview", to: "/utils/api" },
        ],
      },
    ],
  ],

  themeConfig: {
    metadata: [
      {
        name: "description",
        content:
          "A TypeScript-first ORM for SQL, MongoDB, and Redis with type safety and expressive APIs.",
      },
      {
        name: "keywords",
        content:
          "ORM, TypeScript, JavaScript, SQL, PostgreSQL, MySQL, MongoDB, Redis, database, Node.js, hysteria-orm",
      },
      { name: "author", content: "Frasan00" },
      { name: "robots", content: "index, follow" },
      { name: "googlebot", content: "index, follow" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Hysteria ORM" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    image: "img/social-card.svg",
    navbar: {
      title: "Hysteria ORM",
      logo: {
        alt: "Hysteria ORM",
        src: "img/logo.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "left",
          label: "Documentation",
        },
        {
          href: "https://github.com/Frasan00/hysteria-orm",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Documentation",
          items: [
            {
              label: "Introduction",
              to: "/",
            },
            {
              label: "Getting Started",
              to: "/getting-started/philosophy",
            },
            {
              label: "SQL",
              to: "/databases/sql/introduction",
            },
            {
              label: "MongoDB",
              to: "/databases/nosql/mongodb/introduction",
            },
            {
              label: "Redis",
              to: "/databases/nosql/redis/introduction",
            },
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/Frasan00/hysteria-orm",
            },
            {
              label: "Issues",
              href: "https://github.com/Frasan00/hysteria-orm/issues",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Hysteria ORM`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
