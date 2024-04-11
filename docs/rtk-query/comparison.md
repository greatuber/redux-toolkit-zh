---
id: comparison
title: 与其他工具的比较
sidebar_label: 与其他工具的比较
hide_title: true
description: 'RTK Query > Comparison: Compares features and tradeoffs vs other similar tools'
---

&nbsp;

# 与其他工具的比较

**RTK Query从生态系统中的许多其他数据获取库中汲取灵感**。就像[Redux核心库受到Flux和Elm等工具的启发](https://cn.redux.js.org/understanding/history-and-design/prior-art)一样，RTK Query基于[React Query](https://react-query.tanstack.com/)、[SWR](https://swr.vercel.app/)、[Apollo](https://www.apollographql.com/)和[Urql](https://formidable.com/open-source/urql/)等库普及的API设计模式和功能概念。RTK Query从头开始编写，但试图使用这些库和其他数据获取工具的最佳概念，同时着眼于利用Redux的独特优势和能力。

我们认为所有这些工具都很棒！如果你正在使用其中的一个，对它感到满意，并且它解决了你在应用中面临的问题，那就继续使用那个工具。此页面上的信息旨在帮助展示**在功能、实现方法和API设计上存在哪些差异**。目标是帮助你**做出明智的决策并理解权衡**，而不是争论工具X比工具Y更好。

## 何时应使用RTK Query？

一般来说，使用RTK Query的主要原因是：

- 你已经有一个Redux应用，并且你想简化你现有的数据获取逻辑
- 你希望能够使用Redux DevTools来查看随着时间的推移对你的状态进行更改的历史
- 你希望能够将RTK Query的行为与Redux生态系统的其余部分集成
- 你的应用逻辑需要在React之外工作

### 独特的功能

RTK Query有一些值得考虑的独特API设计方面和功能。

- 使用React Query和SWR，你通常自己定义你的钩子，并且你可以在任何地方和即时做到这一点。使用RTK Query，你在一个中心位置通过定义一个具有多个端点的"API slice"来实现。这允许更紧密集成的模型，即突变自动使查询无效/在触发时重新获取。
- 因为RTK Query在处理请求时分派常规的Redux操作，所有操作都在Redux DevTools中可见。此外，每个请求都自动对你的Redux reducers可见，并且如果需要，可以轻松更新全局应用状态（[参见示例](https://github.com/reduxjs/redux-toolkit/issues/958#issuecomment-809570419)）。你可以使用端点[匹配器功能](./api/created-api/endpoints#matchers)在你自己的reducers中对缓存相关的操作进行额外处理。
- 像Redux本身一样，主要的RTK Query功能是UI不可知的，可以与任何UI层一起使用
- 你可以从中间件轻松使实体无效或修补现有的查询数据（通过`util.updateQueryData`）。
- RTK Query支持[流式缓存更新](./usage/streaming-updates.mdx)，例如，当通过websocket接收到消息时更新初始获取的数据，并内置支持[乐观更新](./usage/manual-cache-updates.mdx#optimistic-updates)。
- RTK Query提供了一个非常小巧且灵活的获取包装器：[`fetchBaseQuery`](./api/fetchBaseQuery.mdx)。也很容易[用你自己的客户端替换我们的客户端](./usage/customizing-queries.mdx)，例如使用`axios`，`redaxios`或自定义的东西。
- RTK Query有[一个（目前还在实验阶段的）代码生成工具](https://github.com/reduxjs/redux-toolkit/tree/master/packages/rtk-query-codegen-openapi)，它将接受一个OpenAPI规范或GraphQL模式，并为你提供一个类型化的API客户端，以及在事实之后增强生成的客户端的方法。

## 权衡

### 没有规范化或去重的缓存

RTK Query故意**不实现一个缓存，该缓存将在多个请求中去重相同的项目**。这有几个原因：

- 一个完全规范化的、跨查询共享的缓存是一个难以解决的问题
- 我们现在没有时间、资源或兴趣试图解决这个问题
- 在许多情况下，当数据无效时简单地重新获取数据效果很好，且更容易理解
- 至少，RTKQ可以帮助解决"获取一些数据"的一般用例，这对许多人来说是一个大痛点

### 包大小

RTK Query会为你的应用的包大小增加一个固定的一次性数量。由于RTK Query建立在Redux Toolkit和React-Redux之上，所以增加的大小取决于你是否已经在你的应用中使用了这些。估计的min+gzip包大小是：

- 如果你已经在使用RTK：RTK Query约9kb，钩子约2kb。
- 如果你还没有使用RTK：
  - 没有React：RTK+依赖项+RTK Query约17 kB
  - 有React：19kB + React-Redux，这是一个对等依赖项

添加额外的端点定义应该只会根据`endpoints`定义中的实际代码增加大小，这通常只会是几个字节。

RTK Query中包含的功能迅速为增加的包大小付出了代价，而且消除手写的数据获取逻辑应该是对大多数有意义的应用程序在大小上的净改进。

## 比较功能集

比较所有这些工具的功能集，以了解它们的相似性和差异性是值得的。

:::info

这个比较表格力求尽可能准确和公正。如果你使用这些库中的任何一个，并觉得信息可以改进，欢迎通过[开启一个问题](https://github.com/reduxjs/redux-toolkit/issues/new)提出改变的建议（附带说明或证据）。

:::

| 功能                                  | rtk-query                               | [react-query]            | [apollo]                                                                            | [urql]                                                                                                      |
| -------------------------------------- | --------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **支持的协议**                        | 任何，包括REST                          | 任何，不包括              | GraphQL                                                                             | GraphQL                                                                                                     |
| **API定义**                           | 声明式                                  | 使用时，声明式            | GraphQL schema                                                                      | GraphQL schema                                                                                              |
| **缓存方式**                          | endpoint + 序列化参数                   | 用户定义的查询键          | 类型/ID                                                                             | 类型/ID?                                                                                                    |
| **失效策略 + 重新获取**                | 声明式，按类型和/或类型/ID              | 手动按缓存键              | 每实体级别的自动缓存更新，手动按缓存键查询失效                                      | 声明式，按类型 OR 每实体级别的自动缓存更新，手动按缓存键查询失效                                           |
| **轮询**                              | 是                                      | 是                        | 是                                                                                  | 是                                                                                                          |
| **并行查询**                          | 是                                      | 是                        | 是                                                                                  | 是                                                                                                          |
| **依赖查询**                          | 是                                      | 是                        | 是                                                                                  | 是                                                                                                          |
| **跳过查询**                          | 是                                      | 是                        | 是                                                                                  | 是                                                                                                          |
| **滞后查询**                          | 是                                      | 是                        | 否                                                                                  | ?                                                                                                           |
| **自动垃圾收集**                      | 是                                      | 是                        | 否                                                                                  | ?                                                                                                           |
| **规范化缓存**                        | 否                                      | 否                        | 是                                                                                  | 是                                                                                                          |
| **无限滚动**                          | 待定                                    | 是                        | 需要手动编码                                                                        | ?                                                                                                           |
| **预获取**                            | 是                                      | 是                        | 是                                                                                  | 是?                                                                                                         |
| **重试**                              | 是                                      | 是                        | 需要手动编码                                                                        | ?                                                                                                           |
| **乐观更新**                          | 可以手动更新缓存                        | 可以手动更新缓存          | `optimisticResponse`                                                                | ?                                                                                                           |
| **手动缓存操作**                      | 是                                      | 是                        | 是                                                                                  | 是                                                                                                          |
| **平台**                              | 适用于React的钩子，Redux工作的任何地方  | 适用于React的钩子         | 各种                                                                                | 各种                                                                                                        |

[react-query]: https://react-query.tanstack.com/
[apollo]: https://www.apollographql.com/
[urql]: https://formidable.com/open-source/urql/

## 进一步的信息

- [React Query "Comparison" 页面](https://tanstack.com/query/latest/docs/react/comparison)有一个额外的详细功能集比较表和能力讨论
- Urql维护者Phil Pluckthun写了[关于什么是"规范化缓存"以及Urql的缓存如何工作的优秀解释](https://kitten.sh/graphql-normalized-caching)
- [RTK Query "Cache Behavior" 页面](./usage/cache-behavior.mdx#tradeoffs)进一步详细说明了为什么RTK Query没有实现规范化缓存
