---
id: getting-started
title: 开始使用
sidebar_label: 开始使用
hide_title: true
---

import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css'
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

&nbsp;

# 开始使用 Redux Toolkit

## 目的

**Redux Toolkit** 包旨在成为编写 [Redux](https://cn.redux.js.org) 逻辑的标准方式。它最初是为了解决 Redux 的三个常见问题而创建的：

- "配置 Redux 商店太复杂"
- "我必须添加很多包才能让 Redux 做出有用的事情"
- "Redux 需要太多样板代码"

我们不能解决每一个用例，但是在 [`create-react-app`](https://github.com/facebook/create-react-app) 的精神下，我们可以尝试提供一些工具，这些工具可以抽象出设置过程并处理最常见的用例，同时还包括一些有用的实用程序，这将让用户简化他们的应用程序代码。

Redux Toolkit 还包括一个我们称之为 ["RTK Query"](#rtk-query) 的强大的数据获取和缓存能力。它作为一组独立的入口点包含在包中。它是可选的，但可以消除手动编写数据获取逻辑的需要。

**这些工具应该对所有 Redux 用户有益**。无论你是一个全新的 Redux 用户正在设置你的第一个项目，还是一个有经验的用户想要简化现有的应用程序，**Redux Toolkit** 都可以帮助你改进你的 Redux 代码。

## 安装

### 创建一个 React Redux 应用

使用 React 和 Redux Toolkit 开始新应用的推荐方式是使用[我们的官方 Redux Toolkit + TS 模板 for Vite](https://github.com/reduxjs/redux-templates)，或者使用 [Next 的 `with-redux` 模板](https://github.com/vercel/next.js/tree/canary/examples/with-redux)创建一个新的 Next.js 项目。

这两者都已经为该构建工具适当地配置了 Redux Toolkit 和 React-Redux，并附带了一个小示例应用，演示了如何使用 Redux Toolkit 的几个特性。

```bash
# 使用我们的 Redux+TS 模板的 Vite
# (使用 `degit` 工具克隆和提取模板)
npx degit reduxjs/redux-templates/packages/vite-template-redux my-app

# 使用 `with-redux` 模板的 Next.js
npx create-next-app --example with-redux my-app
```

我们目前没有官方的 React Native 模板，但推荐这些模板用于标准的 React Native 和 Expo：

- https://github.com/rahsheen/react-native-template-redux-typescript
- https://github.com/rahsheen/expo-template-redux-typescript

### 已有的应用

Redux Toolkit 可以在 NPM 上作为一个包使用，用于模块打包器或在 Node 应用中：

<Tabs>
  <TabItem value="npm" label="npm" default>

```bash
npm install @reduxjs/toolkit
```

如果你需要 React 绑定：

```bash
npm install react-redux
```

  </TabItem>
  <TabItem value="yarn" label="yarn" default>

```bash
yarn add @reduxjs/toolkit
```

如果你需要 React 绑定：

```bash
yarn add react-redux
```

  </TabItem>
</Tabs>

该包包括一个预编译的 ESM 构建，可以直接在浏览器中作为 [`<script type="module">` 标签](https://unpkg.com/@reduxjs/toolkit/dist/redux-toolkit.browser.mjs)使用。

## 包含内容

Redux Toolkit 包含以下 API：

- [`configureStore()`](../api/configureStore.mdx)：包装 `createStore` 以提供简化的配置选项和良好的默认值。它可以自动组合你的 slice reducers，添加你提供的任何 Redux 中间件，默认包含 `redux-thunk`，并启用 Redux DevTools Extension 的使用。
- [`createReducer()`](../api/createReducer.mdx)：让你提供一个动作类型到 case reducer 函数的查找表，而不是编写 switch 语句。此外，它自动使用 [`immer` 库](https://github.com/immerjs/immer) 让你用正常的可变代码编写更简单的不可变更新，比如 `state.todos[3].completed = true`。
- [`createAction()`](../api/createAction.mdx)：为给定的动作类型字符串生成一个动作创建函数。
- [`createSlice()`](../api/createSlice.mdx)：接受一个 reducer 函数的对象，一个 slice 名称，和一个初始状态值，并自动生成一个带有对应动作创建者和动作类型的 slice reducer。
- [`combineSlices()`](../api/combineSlices.mdx)：将多个 slices 组合成一个单一的 reducer，并允许在初始化后"懒加载" slices。
- [`createAsyncThunk`](../api/createAsyncThunk.mdx)：接受一个动作类型字符串和一个返回 promise 的函数，并生成一个基于该 promise 分发 `pending/fulfilled/rejected` 动作类型的 thunk。
- [`createEntityAdapter`](../api/createEntityAdapter.mdx)：生成一组可重用的 reducers 和 selectors，用于管理存储中的规范化数据。
- 来自 [Reselect](https://github.com/reduxjs/reselect) 库的 [`createSelector` 实用程序](../api/createSelector.mdx)，重新导出以便于使用。


## RTK 查询

[**RTK 查询**](../rtk-query/overview.md) 是作为 `@reduxjs/toolkit` 包内的可选插件提供的。它专为解决数据获取和缓存的用例而构建，为你的应用提供一个定义 API 接口层的紧凑而强大的工具集。它旨在简化在 web 应用中加载数据的常见情况，消除手动编写数据获取和缓存逻辑的需要。

RTK 查询基于 Redux Toolkit 核心进行构建，内部使用 [Redux](https://cn.redux.js.org/) 作为其架构。虽然使用 RTK 查询不需要了解 Redux 和 RTK，但你应该探索它们提供的所有额外的全局存储管理能力，以及安装 [Redux DevTools 浏览器扩展](https://github.com/reduxjs/redux-devtools)，它与 RTK 查询完美配合，可以遍历和重播你的请求和缓存行为的时间线。

RTK 查询包含在核心 Redux Toolkit 包的安装中。它可以通过以下两个入口点之一使用：

```ts no-transpile
import { createApi } from '@reduxjs/toolkit/query'

/* React 特定的入口点，自动生成对应于定义的端点的钩子 */
import { createApi } from '@reduxjs/toolkit/query/react'
```

### 包含内容

RTK 查询包括以下 API：

- [`createApi()`](../rtk-query/api/createApi.mdx)：RTK 查询功能的核心。它允许你定义一组端点，并描述如何从一系列端点检索数据，包括如何获取和转换该数据的配置。在大多数情况下，你应该每个应用使用一次，以"每个基础 URL 一个 API slice"为经验法则。
- [`fetchBaseQuery()`](../rtk-query/api/fetchBaseQuery.mdx)：围绕 [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) 的小包装器，旨在简化请求。作为 `createApi` 中大多数用户使用的推荐 `baseQuery`。
- [`<ApiProvider />`](../rtk-query/api/ApiProvider.mdx)：如果你**还没有 Redux 存储**，可以作为 `Provider` 使用。
- [`setupListeners()`](../rtk-query/api/setupListeners.mdx)：用于启用 `refetchOnMount` 和 `refetchOnReconnect` 行为的实用程序。

查看 [**RTK 查询概述**](../rtk-query/overview.md) 页面以获取有关 RTK 查询是什么，解决了什么问题以及如何使用它的更多详细信息。

## 学习 Redux

我们有各种资源可供你学习 Redux。

### Redux 基础教程

[**Redux 基础教程**](https://cn.redux.js.org/tutorials/essentials/part-1-overview-concepts) 是一个"自上而下"的教程，教授"如何正确使用 Redux"，使用我们最新推荐的 API 和最佳实践。我们建议从这里开始。

### Redux 基础教程

[**Redux 基础教程**](https://cn.redux.js.org/tutorials/fundamentals/part-1-overview) 是一个"自下而上"的教程，从第一原则和没有任何抽象的情况下教授"Redux 如何工作"，以及为什么存在标准的 Redux 使用模式。

### 学习现代 Redux 直播

Redux 维护者 Mark Erikson 出现在 "Learn with Jason" 节目中，解释我们今天推荐如何使用 Redux。该节目包括一个现场编码的示例应用，展示如何使用 Redux Toolkit 和 React-Redux 钩子与 Typescript，以及新的 RTK 查询数据获取 API。

查看 [“学习现代 Redux”节目笔记页面](https://www.learnwithjason.dev/let-s-learn-modern-redux) 以获取成绩单和示例应用源的链接。

<LiteYouTubeEmbed
    id="9zySeP5vH9c"
    title="Learn Modern Redux - Redux Toolkit, React-Redux Hooks, and RTK Query"
/>

## 帮助和讨论

**[#redux 频道](https://discord.gg/0ZcbPKXt5bZ6au5t)** 是我们的官方资源，用于所有与学习和使用 Redux 相关的问题。Reactiflux 是一个很好的地方，可以挂出，提问和学习 - 加入我们吧！

你也可以在 [Stack Overflow](https://stackoverflow.com) 上使用 **[#redux 标签](https://stackoverflow.com/questions/tagged/redux)** 提问。
