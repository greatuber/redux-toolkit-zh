import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";
import { linkDocblocks, transpileCodeblocks } from "remark-typescript-tools";

const config: Config = {
  baseUrl: "/redux-toolkit-zh/",
  favicon: "img/favicon/favicon.ico",
  tagline: "用于高效 Redux 开发的官方、固执己见、包含电池的工具集",
  title: "Redux Toolkit 中文",
  url: "https://ouweiya.github.io",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  onBrokenAnchors: "ignore",
  organizationName: "ouweiya",
  projectName: "redux-toolkit-zh",
  trailingSlash: false,

  i18n: {
    defaultLocale: "zh-Hans",
    locales: ["zh-Hans"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          path: "./docs",
          sidebarPath: "./sidebars.ts",
          routeBasePath: "/",
          editUrl:
            "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
          include: [
            "{api,assets,introduction,migrations,rtk-query,tutorials,usage}/**/*.{md,mdx}",
          ],
          remarkPlugins: [
            [
              linkDocblocks,
              {
                extractorSettings: {
                  tsconfig: "./docs/tsconfig.json",
                  basedir: "./packages/toolkit/src",
                  rootFiles: [
                    "index.ts",
                    "query/index.ts",
                    "query/createApi.ts",
                    "query/react/index.ts",
                    "query/react/ApiProvider.tsx",
                  ],
                },
              },
            ],
          ],
        },

        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: "img/redux-logo-landscape.png",
    navbar: {
      title: "Redux Toolkit",
      logo: {
        alt: "Redux Logo",
        src: "img/redux.svg",
      },
      items: [
        {
          to: "introduction/getting-started",
          label: "开始使用",
          position: "right",
        },
        { to: "tutorials/overview", label: "教程", position: "right" },
        { to: "usage/usage-guide", label: "使用指南", position: "right" },
        { to: "api/configureStore", label: "API", position: "right" },
        { to: "rtk-query/overview", label: "RTK 查询", position: "right" },
        {
          href: "https://github.com/ouweiya/redux-toolkit-zh",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      logo: {
        alt: "Redux Logo",
        src: "img/redux_white.svg",
      },
      links: [
        {
          title: "文档",
          items: [
            {
              label: "开始使用",
              to: "introduction/getting-started",
            },
            {
              label: "教程",
              to: "tutorials/overview",
            },
            {
              label: "使用指南",
              to: "usage/usage-guide",
            },
            {
              label: "API参考",
              to: "api/configureStore",
            },
            { to: "rtk-query/overview", label: "RTK 查询" },
          ],
        },
        {
          title: "社区",
          items: [
            {
              label: "Stack Overflow",
              href: "http://stackoverflow.com/questions/tagged/redux",
            },
            {
              label: "Discord",
              href: "https://discord.gg/0ZcbPKXt5bZ6au5t",
            },
          ],
        },
        {
          title: "更多",
          items: [
            {
              label: "GitHub",
              href: "https://www.github.com/reduxjs/redux-toolkit",
            },
            {
              html: `
                <a href="https://www.netlify.com">
                  <img
                    src="https://www.netlify.com/img/global/badges/netlify-light.svg"
                    alt="Deploys by Netlify"
                  />
                </a>
              `,
            },
          ],
        },
      ],
      copyright: `版权所有 © 2015–${new Date().getFullYear()} Dan Abramov 和 Redux 文档的作者。`,
    },
    prism: {
      theme: prismThemes.vsDark,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
