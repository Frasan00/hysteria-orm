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
