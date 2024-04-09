---
id: typescript
title: TypeScript 快速开始
sidebar_label: TypeScript 快速开始
hide_title: true
---

&nbsp;

# Redux Toolkit TypeScript 快速入门

:::tip 你将学到什么

- 如何使用 TypeScript 设置和使用 Redux Toolkit 和 React-Redux

:::

:::info 先决条件

- 对 React [Hooks](https://reactjs.org/docs/hooks-intro.html) 的知识
- 对 [Redux 术语和概念](https://cn.redux.js.org/tutorials/fundamentals/part-2-concepts-data-flow) 的理解
- 对 TypeScript 语法和概念的理解

:::

## 介绍

欢迎来到 Redux Toolkit TypeScript 快速入门教程！**本教程将简要介绍如何在 Redux Toolkit 中使用 TypeScript**。

本页主要关注如何设置 TypeScript 方面的内容。对于 Redux 是什么，它是如何工作的，以及如何使用 Redux Toolkit 的完整示例，[请参见 "教程概览" 页面中链接的教程](./overview.md)。

Redux Toolkit 已经用 TypeScript 编写，所以它的 TS 类型定义是内置的。

[React Redux](https://cn.react-redux.js.org) 在 NPM 上有一个单独的 [`@types/react-redux` 类型定义包](https://npm.im/@types/react-redux)。除了对库函数进行类型化外，类型还导出了一些帮助器，使得在你的 Redux store 和你的 React 组件之间编写类型安全的接口更加容易。

从 React Redux v7.2.3 开始，`react-redux` 包依赖于 `@types/react-redux`，所以类型定义将与库一起自动安装。否则，你需要手动自己安装它们（通常是 `npm install @types/react-redux`）。

[Redux+TS 的 Create-React-App 模板](https://github.com/reduxjs/cra-template-redux-typescript)已经配置了这些模式的工作示例。

## 项目设置

### 定义根状态和调度类型

使用 [configureStore](../api/configureStore.mdx) 不应需要任何额外的类型定义。然而，你会想要提取 `RootState` 类型和 `Dispatch` 类型，以便在需要的时候可以引用它们。从 store 本身推断这些类型意味着，当你添加更多的状态切片或修改中间件设置时，它们会正确地更新。

由于这些是类型，所以可以直接从你的 store 设置文件（如 `app/store.ts`）中导出它们，并直接导入到其他文件中。

```ts title="app/store.ts"
import { configureStore } from '@reduxjs/toolkit'
// ...

export const store = configureStore({
  reducer: {
    posts: postsReducer,
    comments: commentsReducer,
    users: usersReducer,
  },
})

// highlight-start
// 从 store 本身推断 `RootState` 和 `AppDispatch` 类型
export type RootState = ReturnType<typeof store.getState>
// 推断的类型：{posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
// highlight-end
```

### 定义类型化的 Hooks

虽然可以将 `RootState` 和 `AppDispatch` 类型导入到每个组件中，但**在你的应用中使用 `useDispatch` 和 `useSelector` hooks 的类型化版本是更好的选择**。这有几个重要的原因：

- 对于 `useSelector`，它可以省去你每次都要输入 `(state: RootState)` 的需要
- 对于 `useDispatch`，默认的 `Dispatch` 类型并不知道 thunk。为了正确地调度 thunk，你需要使用来自包含 thunk 中间件类型的 store 的特定定制的 `AppDispatch` 类型，并将其与 `useDispatch` 一起使用。添加一个预类型的 `useDispatch` hook 可以防止你忘记在需要的地方导入 `AppDispatch`。

由于这些是实际的变量，而不是类型，所以重要的是要在一个单独的文件（如 `app/hooks.ts`）中定义它们，而不是在 store 设置文件中。这允许你将它们导入到任何需要使用 hooks 的组件文件中，并避免可能的循环导入依赖问题。

```ts title="app/hooks.ts"
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from './store'

// highlight-start
// 在你的应用中使用，而不是普通的 `useDispatch` 和 `useSelector`
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
// highlight-end
```

## 应用程序使用

### 定义切片状态和操作类型

每个切片文件都应定义其初始状态值的类型，这样 `createSlice` 可以正确地推断每个 case reducer 中 `state` 的类型。

所有生成的操作都应使用 Redux Toolkit 的 `PayloadAction<T>` 类型定义，该类型将 `action.payload` 字段的类型作为其泛型参数。

你可以安全地从 store 文件中导入 `RootState` 类型。这是一个循环导入，但 TypeScript 编译器可以正确处理类型。这可能需要用于编写选择器函数等用例。

```ts title="features/counter/counterSlice.ts"
import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../../app/store'

// highlight-start
// 为切片状态定义类型
interface CounterState {
  value: number
}

// 使用该类型定义初始状态
const initialState: CounterState = {
  value: 0,
}
// highlight-end

export const counterSlice = createSlice({
  name: 'counter',
  // `createSlice` 将从 `initialState` 参数推断状态类型
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1
    },
    decrement: (state) => {
      state.value -= 1
    },
    // highlight-start
    // 使用 PayloadAction 类型来声明 `action.payload` 的内容
    incrementByAmount: (state, action: PayloadAction<number>) => {
      // highlight-end
      state.value += action.payload
    },
  },
})

export const { increment, decrement, incrementByAmount } = counterSlice.actions

// 其他代码如选择器可以使用导入的 `RootState` 类型
export const selectCount = (state: RootState) => state.counter.value

export default counterSlice.reducer
```

生成的操作创建器将被正确地类型化，以接受基于你为 reducer 提供的 `PayloadAction<T>` 类型的 `payload` 参数。例如，`incrementByAmount` 需要一个 `number` 作为其参数。

在某些情况下，[TypeScript 可能不必要地收紧初始状态的类型](https://github.com/reduxjs/redux-toolkit/pull/827)。如果发生这种情况，你可以通过使用 `as` 强制转换初始状态来解决这个问题，而不是声明变量的类型：

```ts
// 解决方法：强制转换状态，而不是声明变量类型
const initialState = {
  value: 0,
} satisfies CounterState as CounterState
```

### 在组件中使用类型化的 Hooks

在组件文件中，导入预类型化的 hooks，而不是从 React-Redux 导入的标准 hooks。

```tsx no-transpile title="features/counter/Counter.tsx"
import React, { useState } from 'react'

// highlight-next-line
import { useAppSelector, useAppDispatch } from 'app/hooks'

import { decrement, increment } from './counterSlice'

export function Counter() {
  // highlight-start
  // `state` 参数已经被正确地类型化为 `RootState`
  const count = useAppSelector((state) => state.counter.value)
  const dispatch = useAppDispatch()
  // highlight-end

  // 省略渲染逻辑
}
```

## 下一步是什么？

查看 [“与 TypeScript 一起使用”页面](../usage/usage-with-typescript.md)，了解如何使用 Redux Toolkit 的 API 与 TypeScript 的详细信息。
