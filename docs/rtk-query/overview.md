---
id: overview
title: RTK 查询概览
sidebar_label: RTK 查询概览
hide_title: true
description: 'RTK Query > Overview: a summary of the RTK Query data caching API for Redux Toolkit'
---

&nbsp;

# RTK Query 概览

:::tip 学到什么

- RTK Query 是什么以及它解决了哪些问题
- RTK Query 包含哪些 API
- RTK Query 的基本用法

:::

**RTK Query** 是一个强大的数据获取和缓存工具。它旨在简化 Web 应用程序中常见的数据加载情况，**消除了手动编写数据获取和缓存逻辑的需要**。

RTK Query 是 Redux Toolkit 包中包含的一个可选附加组件，其功能是构建在 Redux Toolkit 的其他 API 之上的。

:::info

要了解如何使用 RTK Query，请参阅 Redux 核心文档站点上的完整的 ["Redux Essentials" 教程](https://redux.js.org/tutorials/essentials/part-7-rtk-query-basics)。

如果您更喜欢视频课程，您可以免费观看 RTK Query 的 [Egghead 上由 RTK Query 的创建者 Lenz Weber-Tronic 所讲的视频课程](https://egghead.io/courses/rtk-query-basics-query-endpoints-data-flow-and-typescript-57ea3c43?af=7pnhj6)，或者在这里查看第一课的内容：

<div style={{position:"relative",paddingTop:"56.25%"}}>
  <iframe
    src="https://app.egghead.io/lessons/redux-course-introduction-and-application-walk-through-for-rtk-query-basics/embed?af=7pnhj6"
    title="RTK Query Video course at Egghead: Course Introduction and Application Walk through for RTK Query Basics"
    frameborder="0"
    allowfullscreen
    style={{position:"absolute",top:0,left:0,width:"100%",height:"100%"}}
  ></iframe>
</div>

:::

## 动机

Web应用通常需要从服务器获取数据以进行显示。它们通常也需要更新这些数据，将这些更新发送到服务器，并保持客户端上的缓存数据与服务器上的数据同步。这被今天的应用程序中使用的其他行为的实现所复杂化：

- 跟踪加载状态以显示UI旋转器
- 避免对同一数据的重复请求
- 乐观的更新以使UI感觉更快
- 随着用户与UI的交互，管理缓存的生命周期

Redux核心一直非常简洁 - 开发人员需要编写所有实际的逻辑。这意味着Redux从未包含任何内置的帮助解决这些用例的东西。Redux文档已经教授了[一些常见的模式，用于在请求生命周期周围调度动作以跟踪加载状态和请求结果](https://redux.js.org/tutorials/fundamentals/part-7-standard-patterns#async-request-status)，以及[Redux Toolkit的`createAsyncThunk` API](../api/createAsyncThunk.mdx)被设计为抽象这种典型模式。然而，用户仍然需要编写大量的reducer逻辑来管理加载状态和缓存数据。

在过去的几年中，React社区已经意识到**"数据获取和缓存"实际上是一组与"状态管理"不同的关注点**。虽然你可以使用像Redux这样的状态管理库来缓存数据，但是用例足够不同，值得使用为数据获取用例专门构建的工具。

RTK Query从其他工具中汲取灵感，这些工具已经为数据获取开创了解决方案，如Apollo Client、React Query、Urql和SWR，但是对其API设计增加了独特的方法：

- 数据获取和缓存逻辑是建立在Redux Toolkit的`createSlice`和`createAsyncThunk`API之上的
- 因为Redux Toolkit是UI不可知的，所以RTK Query的功能可以与任何UI层一起使用
- API端点是提前定义的，包括如何从参数生成查询参数和转换响应以进行缓存
- RTK Query还可以生成React钩子，这些钩子封装了整个数据获取过程，向组件提供`data`和`isLoading`字段，并在组件挂载和卸载时管理缓存数据的生命周期
- RTK Query提供了"缓存条目生命周期"选项，这些选项使得在获取初始数据后通过websocket消息进行流式缓存更新的用例成为可能
- 我们有早期的从OpenAPI和GraphQL模式生成API切片的代码生成示例
- 最后，RTK Query完全用TypeScript编写，并且旨在提供出色的TS使用体验

## 包含内容

### API

RTK Query包含在核心Redux Toolkit包的安装中。它可以通过以下两个入口点之一获得：

```ts no-transpile
import { createApi } from '@reduxjs/toolkit/query'

/* 针对React的特定入口点，自动生成与定义的端点相对应的钩子 */
import { createApi } from '@reduxjs/toolkit/query/react'
```

RTK Query包括这些API：

- [`createApi()`](./api/createApi.mdx)：RTK Query功能的核心。它允许你定义一组"端点"，描述如何从后端API和其他异步源获取数据，包括如何获取和转换该数据的配置。在大多数情况下，你应该在每个应用程序中使用一次，以"每个基础URL一个API切片"为经验法则。
- [`fetchBaseQuery()`](./api/fetchBaseQuery.mdx)：围绕[`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)的小包装器，旨在简化请求。作为大多数用户在`createApi`中使用的推荐`baseQuery`。
- [`<ApiProvider />`](./api/ApiProvider.mdx)：如果你**还没有Redux存储**，可以作为`Provider`使用。
- [`setupListeners()`](./api/setupListeners.mdx)：用于启用`refetchOnMount`和`refetchOnReconnect`行为的实用程序。

### 包大小

RTK Query向你的应用程序的包大小添加了固定的一次性数量。由于RTK Query建立在Redux Toolkit和React-Redux之上，所以增加的大小取决于你是否已经在你的应用程序中使用了这些。估计的min+gzip包大小是：

- 如果你已经在使用RTK：RTK Query约9kb，钩子约2kb。
- 如果你还没有使用RTK：
  - 没有React：RTK+依赖+RTK Query约17 kB
  - 有React：19kB + React-Redux，这是一个对等依赖

添加额外的端点定义应该只根据`endpoints`定义中的实际代码增加大小，这通常只会是几个字节。

RTK Query中包含的功能很快就会为增加的包大小付出代价，而手写数据获取逻辑的消除应该是大多数有意义的应用程序在大小上的净改进。

## 基本使用

### 创建一个API切片

RTK Query包含在核心Redux Toolkit包的安装中。它可以通过以下两个入口点之一获得：

```ts
import { createApi } from '@reduxjs/toolkit/query'

/* 针对React的特定入口点，自动生成与定义的端点相对应的钩子 */
import { createApi } from '@reduxjs/toolkit/query/react'
```

对于React的典型使用，首先导入`createApi`并定义一个"API切片"，列出服务器的基础URL以及我们想要交互的端点：

```ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { Pokemon } from './types'

// 使用基础URL和预期的端点定义一个服务
export const pokemonApi = createApi({
    reducerPath: 'pokemonApi',
    baseQuery: fetchBaseQuery({ baseUrl: 'https://pokeapi.co/api/v2/' }),
    endpoints: (builder) => ({
        getPokemonByName: builder.query<Pokemon, string>({
            query: (name) => `pokemon/${name}`,
        }),
    }),
})

// 导出用于在功能组件中使用的钩子，这些钩子是基于定义的端点自动生成的
export const { useGetPokemonByNameQuery } = pokemonApi
```

### 配置存储

"API切片"还包含一个自动生成的Redux切片reducer和一个管理订阅生命周期的自定义中间件。这两者都需要添加到Redux存储中：

```ts
import { configureStore } from '@reduxjs/toolkit'
// 或者从'@reduxjs/toolkit/query/react'
import { setupListeners } from '@reduxjs/toolkit/query'
import { pokemonApi } from './services/pokemon'

export const store = configureStore({
    reducer: {
        // 将生成的reducer添加为特定的顶级切片
        [pokemonApi.reducerPath]: pokemonApi.reducer,
    },
    // 添加api中间件启用缓存，失效，轮询，
    // 和`rtk-query`的其他有用功能。
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(pokemonApi.middleware),
})

// 可选的，但对于refetchOnFocus/refetchOnReconnect行为是必需的
// 查看`setupListeners`文档 - 接受一个可选的回调作为第二个参数进行自定义
setupListeners(store.dispatch)
```

### 在组件中使用钩子

最后，将API切片中自动生成的React钩子导入到你的组件文件中，并在你的组件中使用任何需要的参数调用钩子。RTK Query将在挂载时自动获取数据，当参数更改时重新获取，提供`{data, isFetching}`结果中的值，并在这些值更改时重新渲染组件：

```ts
import * as React from 'react'
import { useGetPokemonByNameQuery } from './services/pokemon'

export default function App() {
    // 使用查询钩子自动获取数据并返回查询值
    const { data, error, isLoading } = useGetPokemonByNameQuery('bulbasaur')
    // 也可以在生成的端点下访问单独的钩子：
    // const { data, error, isLoading } = pokemonApi.endpoints.getPokemonByName.useQuery('bulbasaur')

    // 根据数据和加载状态渲染UI
}
```

## 更多信息

查看 [**RTK Query快速开始教程**](../tutorials/rtk-query.mdx/)，了解如何将RTK Query添加到使用Redux Toolkit的项目中，如何设置带有端点定义的"API切片"，以及如何在组件中使用自动生成的React钩子的示例。

[**RTK Query使用指南部分**](./usage/queries.mdx)有关于[查询数据](./usage/queries.mdx)，[使用突变向服务器发送更新](./usage/mutations.mdx)，[流式缓存更新](./usage/streaming-updates.mdx)等主题的信息。

[**示例页面**](./usage/examples.mdx)有可运行的CodeSandboxes，演示了如何[使用GraphQL进行查询](./usage/examples.mdx#react-with-graphql)，[身份验证](./usage/examples.mdx#authentication)，甚至[如何将RTK Query与其他UI库（如Svelte）一起使用](./usage/examples.mdx#svelte)等主题。
