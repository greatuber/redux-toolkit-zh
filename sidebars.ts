import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docs: [
    {
      type: "category",
      label: "介绍",
      collapsed: false,
      items: [
        "introduction/getting-started",
        "introduction/why-rtk-is-redux-today",
      ],
    },

    {
      type: "category",
      label: "教程",
      collapsed: false,
      items: [
        "tutorials/tutorials-overview",
        "tutorials/quick-start",
        "tutorials/typescript",
        "tutorials/rtk-query",
      ],
    },
    {
      type: "category",
      label: "使用 Redux Toolkit",
      collapsed: false,
      items: [
        "usage/usage-guide",
        "usage/usage-with-typescript",
        "usage/immer-reducers",
        "usage/nextjs",
        {
          type: "category",
          label: "迁移",
          items: ["usage/migrating-to-modern-redux", "usage/migrating-rtk-2"],
        },
      ],
    },
    {
      type: "category",
      label: "API 参考",
      collapsed: true,
      items: [
        {
          type: "category",
          label: "商店设置",
          collapsed: false,
          items: [
            "api/configureStore",
            "api/getDefaultMiddleware",
            "api/immutabilityMiddleware",
            "api/serializabilityMiddleware",
            "api/actionCreatorMiddleware",
            "api/createListenerMiddleware",
            "api/createDynamicMiddleware",
            "api/getDefaultEnhancers",
            "api/autoBatchEnhancer",
          ],
        },
        {
          type: "category",
          label: "Reducers 和 Actions",
          collapsed: false,
          items: [
            "api/createReducer",
            "api/createAction",
            "api/createSlice",
            "api/createAsyncThunk",
            "api/createEntityAdapter",
            "api/combineSlices",
          ],
        },
        {
          type: "category",
          label: "其他",
          collapsed: false,
          items: [
            "api/createSelector",
            "api/matching-utilities",
            "api/other-exports",
            "api/codemods",
            { type: "link", label: "错误信息", href: "/errors" },
          ],
        },
      ],
    },
    {
      type: "category",
      label: "RTK 查询",
      collapsed: true,
      items: [
        "rtk-query/overview",
        "rtk-query/comparison",
        "rtk-query/usage/examples",
        "rtk-query/usage-with-typescript",
        {
          type: "category",
          label: "使用 RTK 查询",
          collapsed: true,
          items: [
            "rtk-query/usage/queries",
            "rtk-query/usage/mutations",
            "rtk-query/usage/cache-behavior",
            "rtk-query/usage/automated-refetching",
            "rtk-query/usage/manual-cache-updates",
            "rtk-query/usage/conditional-fetching",
            "rtk-query/usage/error-handling",
            "rtk-query/usage/pagination",
            "rtk-query/usage/prefetching",
            "rtk-query/usage/polling",
            "rtk-query/usage/streaming-updates",
            "rtk-query/usage/code-splitting",
            "rtk-query/usage/code-generation",
            "rtk-query/usage/server-side-rendering",
            "rtk-query/usage/persistence-and-rehydration",
            "rtk-query/usage/customizing-create-api",
            "rtk-query/usage/customizing-queries",
            "rtk-query/usage/usage-without-react-hooks",
            "rtk-query/usage/migrating-to-rtk-query",
          ],
        },
        {
          type: "category",
          label: "API 参考",
          collapsed: true,
          items: [
            "rtk-query/api/createApi",
            "rtk-query/api/fetchBaseQuery",
            "rtk-query/api/ApiProvider",
            "rtk-query/api/setupListeners",
            {
              type: "category",
              label: "生成 API 切片",
              collapsed: false,
              items: [
                "rtk-query/api/created-api/overview",
                "rtk-query/api/created-api/redux-integration",
                "rtk-query/api/created-api/endpoints",
                "rtk-query/api/created-api/code-splitting",
                "rtk-query/api/created-api/api-slice-utils",
                "rtk-query/api/created-api/hooks",
              ],
            },
          ],
        },
      ],
    },
  ],

  reselect: [
    {
      type: "category",
      collapsed: false,
      label: "介绍",
      items: [
        "reselect/introduction/getting-started",
        "reselect/introduction/how-does-reselect-work",
        "reselect/introduction/v5-summary",
      ],
    },
    {
      type: "category",
      label: "使用 Reselect",
      collapsed: false,
      items: [
        "reselect/usage/best-practices",
        "reselect/usage/common-mistakes",
        "reselect/usage/handling-empty-array-results",
      ],
    },
    {
      type: "category",
      collapsed: false,
      label: "API",
      items: [
        "reselect/api/createSelector",
        "reselect/api/createSelectorCreator",
        "reselect/api/createStructuredSelector",
        "reselect/api/development-only-stability-checks",
        {
          type: "category",
          collapsed: false,
          label: "记忆化函数",
          items: [
            "reselect/api/lruMemoize",
            "reselect/api/weakMapMemoize",
            "reselect/api/unstable_autotrackMemoize",
          ],
        },
      ],
    },

    "reselect/FAQ",
    "reselect/external-references",
    "reselect/related-projects",
  ],
};

export default sidebars;
