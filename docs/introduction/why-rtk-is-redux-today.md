---
id: why-rtk-is-redux-today
title: 为什么 Redux Toolkit 是今天使用 Redux 的方式
# Yes, we are serious with the title. It's okay as it is. Please don't open more Pull Requests to change it.
description: 'Introduction > Why RTK is Redux Today: details on how RTK replaces the Redux core'
---

## 什么是 Redux Toolkit？

[**Redux Toolkit**](/redux-toolkit-zh)（也被简称为 **"RTK"**）是我们官方推荐的编写 Redux 逻辑的方法。`@reduxjs/toolkit` 包装了核心的 `redux` 包，并包含我们认为构建 Redux 应用所必需的 API 方法和常见依赖。Redux Toolkit 内置了我们建议的最佳实践，简化了大多数 Redux 任务，防止了常见错误，使编写 Redux 应用更加容易。

**如果你今天正在编写任何 Redux 逻辑，你应该使用 Redux Toolkit 来编写那些代码！**

RTK 包含了帮助简化许多常见用例的实用工具，包括[设置 store](/redux-toolkit-zh/api/configureStore)，
[创建 reducers 和编写不可变的更新逻辑](/redux-toolkit-zh/api/createreducer)，
甚至[一次性创建整个 "slices" 的状态](/redux-toolkit-zh/api/createslice)。

无论你是刚开始使用 Redux 的新用户，还是想要简化现有应用的经验丰富的用户，**[Redux Toolkit](/redux-toolkit-zh/)** 都可以帮助你改进你的 Redux 代码。

:::tip

查看这些页面，了解如何使用 Redux Toolkit 进行 "现代 Redux" 编程：

- [**"Redux 基础" 教程**](https://cn.redux.js.org/tutorials/essentials/part-1-overview-concepts)，教你如何在实际应用中使用 Redux Toolkit 进行 "正确的" Redux 编程，
- [**Redux 基础，第8部分：使用 Redux Toolkit 的现代 Redux**](https://cn.redux.js.org/tutorials/fundamentals/part-8-modern-redux)，展示如何将教程前面部分的低级示例转换为现代 Redux Toolkit 等效项
- [**使用 Redux：迁移到现代 Redux**](../usage/migrating-to-modern-redux.mdx)，介绍如何将不同类型的旧版 Redux 逻辑迁移到现代 Redux 等效项

:::

## Redux Toolkit 与 Redux 核心有何不同

### 什么是 "Redux"？

首先要问的是，"什么是 Redux？"

Redux 实际上是：

- 包含 "全局" 状态的单一 store
- 当应用发生某些事情时，向 store 分发纯对象操作
- 纯 reducer 函数查看这些操作并返回不可变更新的状态

虽然不是必需的，但[你的 Redux 代码通常也包括](https://cn.redux.js.org/tutorials/fundamentals/part-7-standard-patterns)：

- 生成这些操作对象的操作创建器
- 启用副作用的中间件
- 包含有副作用的同步或异步逻辑的 Thunk 函数
- 使得可以通过 ID 查找项目的规范化状态
- 使用 Reselect 库进行派生数据优化的 Memoized 选择器函数
- 查看你的操作历史和状态变化的 Redux DevTools 扩展
- 操作、状态和其他函数的 TypeScript 类型

此外，Redux 通常与 React-Redux 库一起使用，让你的 React 组件能够与 Redux store 进行交互。

### Redux 核心做了什么？

Redux 核心是一个非常小且故意无主见的库。它提供了一些小的 API 原语：

- `createStore` 实际上创建一个 Redux store
- `combineReducers` 将多个 slice reducers 合并成一个更大的 reducer
- `applyMiddleware` 将多个中间件合并成一个 store 增强器
- `compose` 将多个 store 增强器合并成一个 store 增强器

除此之外，你的应用中所有其他与 Redux 相关的逻辑都必须完全由你自己编写。

好消息是，这意味着 Redux _可以_ 以许多不同的方式使用。坏消息是，没有任何助手可以使你的代码更容易编写。

例如，reducer 函数就是一个函数。在 Redux Toolkit 之前，你通常会使用 `switch` 语句和手动更新来编写那个 reducer。你可能还会手动编写操作创建器和操作类型常量：

```js title="手动编写的旧版 Redux 使用"
const ADD_TODO = 'ADD_TODO'
const TODO_TOGGLED = 'TODO_TOGGLED'

export const addTodo = (text) => ({
  type: ADD_TODO,
  payload: { text, id: nanoid() },
})

export const todoToggled = (id) => ({
  type: TODO_TOGGLED,
  payload: { id },
})

export const todosReducer = (state = [], action) => {
  switch (action.type) {
    case ADD_TODO:
      return state.concat({
        id: action.payload.id,
        text: action.payload.text,
        completed: false,
      })
    case TODO_TOGGLED:
      return state.map((todo) => {
        if (todo.id !== action.payload.id) return todo

        return {
          ...todo,
          completed: !todo.completed,
        }
      })
    default:
      return state
  }
}
```

这段代码并没有特别依赖 `redux` 核心库的任何 API。但是，这是需要编写的大量代码。不可变的更新需要大量的手写对象扩展和数组操作，而且很容易在过程中犯错误并意外地改变状态（这总是 Redux bugs 的第一大原因！）。虽然不是严格要求，但通常会将一个特性的代码分散在多个文件中，如 `actions/todos.js`，`constants/todos.js` 和 `reducers/todos.js`。

此外，store 的设置通常需要一系列步骤来添加常用的中间件，如 thunks，并启用 Redux DevTools 扩展的支持，尽管这些都是几乎每个 Redux 应用都会使用的标准工具。

### Redux Toolkit 是做什么的？

虽然这些原本是 Redux 文档中展示的模式，但不幸的是，它们需要大量的冗长和重复的代码。大部分的样板代码并不是使用 Redux 必要的。此外，样板代码导致了更多的错误机会。

**我们特别创建了 Redux Toolkit 来消除手写 Redux 逻辑的 "样板"，防止常见错误，并提供简化标准 Redux 任务的 API**。

Redux Toolkit 从两个关键 API 开始，简化了你在每个 Redux 应用中最常做的事情：

- `configureStore` 通过一个函数调用设置了一个配置良好的 Redux 存储，包括组合 reducers，添加 thunk 中间件，并设置 Redux DevTools 集成。它比 `createStore` 更容易配置，因为它接受命名的选项参数。
- `createSlice` 让你编写使用 [Immer 库](https://immerjs.github.io/immer/) 的 reducers，以便使用 "mutating" JS 语法（如 `state.value = 123`）编写不可变更新，无需扩展。它还会为每个 reducer 自动生成 action 创建函数，并根据你的 reducer 的名称在内部生成 action 类型字符串。最后，它与 TypeScript 配合得很好。

这意味着你编写的代码可以大大简化。例如，同样的 todos reducer 可以是：

```js title="features/todos/todosSlice.js"
import { createSlice } from '@reduxjs/toolkit'

const todosSlice = createSlice({
  name: 'todos',
  initialState: [],
  reducers: {
    todoAdded(state, action) {
      state.push({
        id: action.payload.id,
        text: action.payload.text,
        completed: false,
      })
    },
    todoToggled(state, action) {
      const todo = state.find((todo) => todo.id === action.payload)
      todo.completed = !todo.completed
    },
  },
})

export const { todoAdded, todoToggled } = todosSlice.actions
export default todosSlice.reducer
```

所有的 action 创建者和 action 类型都是自动生成的，reducer 代码更短，更容易理解。每种情况下实际更新的内容也更清晰。

使用 `configureStore`，存储设置可以简化为：

```js title="app/store.js"
import { configureStore } from '@reduxjs/toolkit'
import todosReducer from '../features/todos/todosSlice'
import filtersReducer from '../features/filters/filtersSlice'

export const store = configureStore({
  reducer: {
    todos: todosReducer,
    filters: filtersReducer,
  },
})
```

注意，**这一个 `configureStore` 调用自动完成了你通常需要手动完成的所有设置工作**：

- slice reducers 自动传递给 `combineReducers()`
- 自动添加了 `redux-thunk` 中间件
- 添加了用于捕获意外突变的开发模式中间件
- 自动设置了 Redux DevTools 扩展
- 中间件和 DevTools 增强器被组合在一起并添加到存储中

同时，**`configureStore` 提供了选项，让用户可以修改任何这些默认行为**（如关闭 thunks 和添加 sagas，或在生产中禁用 DevTools），

从那里，Redux Toolkit 包括其他常见 Redux 任务的 API：

- `createAsyncThunk`：抽象了标准的 "在异步请求前后分派操作" 模式
- `createEntityAdapter`：预构建的 reducers 和选择器，用于对规范化状态进行 CRUD 操作
- `createSelector`：用于 memoized 选择器的标准 Reselect API 的重新导出
- `createListenerMiddleware`：一个副作用中间件，用于响应分派的操作运行逻辑

最后，RTK 包还包括 "RTK Query"，这是一个完整的数据获取和缓存解决方案，作为一个单独的可选 `@reduxjs/toolkit/query` 入口点。它让你定义端点（REST，GraphQL，或任何异步函数），并生成一个 reducer 和中间件，完全管理获取数据，更新加载状态，和缓存结果。它还自动生成可以在组件中使用的 React 钩子来获取数据，如 `const { data, isFetching} = useGetPokemonQuery('pikachu')`

这些 API 每一个都是完全可选的，设计用于特定的使用场景，**你可以挑选在你的应用中实际使用哪些 API**。但是，所有这些都是强烈推荐的，以帮助完成这些任务。

注意，**Redux Toolkit 仍然是 "Redux"！** 仍然有一个单一的存储，用于更新的分派操作对象，以及不可变更新状态的 reducers，加上编写异步逻辑的 thunks，管理规范化状态，使用 TypeScript 类型化你的代码，和使用 DevTools 的能力。**只是你需要编写的代码少了很多，得到的结果却是一样的！**

## 为什么我们希望你使用 Redux Toolkit

作为 Redux 的维护者，我们的观点是：

:::tip

**我们希望 _所有_ 的 Redux 用户都使用 Redux Toolkit 来编写他们的 Redux 代码，因为它可以简化你的代码 _并且_ 消除许多常见的 Redux 错误和 bug！**

:::

早期 Redux 模式的 "样板" 和复杂性从来都不是 Redux 的 _必要_ 部分。这些模式之所以存在，是因为：

- 原始的 "Flux 架构" 使用了一些相同的方法
- 早期的 Redux 文档展示了像 action 类型常量这样的东西，以便将代码按类型分隔到不同的文件中
- JavaScript 默认是一种可变的语言，编写不可变的更新需要手动的对象扩展和数组更新
- Redux 最初只用了几周的时间就被构建出来，而且有意设计成只有几个 API 原语

此外，Redux 社区采用了一些特定的方法，增加了额外的样板：

- 强调使用 `redux-saga` 中间件作为编写副作用的常见方法
- 坚持手写 Redux action 对象的 TS 类型，并创建联合类型以限制在类型级别可以分派的操作

多年来，我们看到了人们实际上如何使用 Redux。我们看到了社区如何为生成 action 类型和创建者、异步逻辑和副作用、数据获取等任务编写了数百个附加库。我们也看到了一直给我们的用户带来痛苦的问题，比如意外地突变状态，只是为了做一个简单的状态更新就需要编写几十行代码，以及在追踪代码库如何组合在一起时遇到困难。我们帮助了数千个试图学习和使用 Redux 的用户，他们努力理解所有的部分是如何组合在一起的，对他们必须编写的概念数量和额外代码感到困惑。我们 _知道_ 我们的用户面临什么问题。

**我们特别设计了 Redux Toolkit 来解决这些问题！**

- Redux Toolkit 将存储设置简化为一个清晰的函数调用，同时保留了如果需要的话完全配置存储选项的能力
- Redux Toolkit 消除了意外的突变，这一直是 Redux bug 的第一大原因
- Redux Toolkit 消除了手动编写任何 action 创建者或 action 类型的需要
- Redux Toolkit 消除了编写手动和容易出错的不可变更新逻辑的需要
- Redux Toolkit 使得在一个文件中编写 Redux 特性的代码变得容易，而不是将其分散在多个单独的文件中
- Redux Toolkit 提供了优秀的 TS 支持，其 API 设计为提供优秀的类型安全性，并最小化你在代码中需要定义的类型数量
- RTK Query 可以消除编写 _任何_ thunk，reducer，action 创建者，或管理获取数据和跟踪加载状态的 effect hook 的需要

因此：

:::tip

**我们特别推荐我们的用户 _应该_ 使用 Redux Toolkit（`@reduxjs/toolkit` 包），并且 _不应该_ 在今天的任何新的 Redux 代码中使用旧版的 `redux` 核心包！**

:::

即使对于现有的应用，我们也推荐至少将 `createStore` 切换为 `configureStore`，因为开发模式中间件也将帮助你捕获现有代码库中的意外突变和可序列化错误。我们也希望鼓励你将你最常使用的 reducer（以及你将来编写的任何 reducer）切换为 `createSlice` - 代码将更短，更容易理解，安全性的提升将为你节省时间和精力。

**`redux` 核心包仍然可以工作，但今天我们认为它已经过时**。所有的 API 也都从 `@reduxjs/toolkit` 中重新导出，`configureStore` 做了 `createStore` 所做的所有事情，但具有更好的默认行为和可配置性。

理解低级概念 _是_ 有用的，这样你就能更好地理解 Redux Toolkit 为你做了什么。这就是为什么[“Redux 基础”教程展示了 Redux 如何工作，没有任何抽象](https://cn.redux.js.org/tutorials/fundamentals/part-1-overview)。_但是_，它仅仅作为一个学习工具展示了这些例子，并最后展示了 Redux Toolkit 如何简化旧的手写 Redux 代码。

如果你正在单独使用 `redux` 核心包，你的代码将继续工作。**但是，我们强烈建议你切换到 `@reduxjs/toolkit`，并更新你的代码以使用 Redux Toolkit API！**

## 更多信息

查看这些文档页面和博客文章以获取更多详细信息

- [Redux 基础：Redux Toolkit 应用结构](https://cn.redux.js.org/tutorials/essentials/part-2-app-structure)
- [Redux 基础：现代 Redux 与 Redux Toolkit](https://cn.redux.js.org/tutorials/fundamentals/part-8-modern-redux)
- [Redux 风格指南：最佳实践和推荐](https://cn.redux.js.org/style-guide/)
- [演示：现代 Redux 与 Redux Toolkit](https://blog.isquaredsoftware.com/2022/06/presentations-modern-redux-rtk/)
- [Mark Erikson：Redux Toolkit 1.0 公告和开发历史](https://blog.isquaredsoftware.com/2019/10/redux-toolkit-1.0/)
