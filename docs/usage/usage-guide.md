---
id: usage-guide
title: 使用指南
sidebar_label: 使用指南
hide_title: true
---

&nbsp;

# 使用指南

Redux 核心库故意保持无偏见。它让你决定如何处理所有事情，比如存储设置，你的状态包含什么，以及你如何构建你的 reducers。

在某些情况下，这是好的，因为它给你灵活性，但这种灵活性并不总是需要的。有时我们只想以最简单的方式开始，有一些好的默认行为。或者，也许你正在编写一个更大的应用程序，并发现自己正在编写一些相似的代码，你希望减少你必须手动编写的代码量。

如[快速开始](../introduction/getting-started.md)页面所述，Redux Toolkit 的目标是帮助简化常见的 Redux 使用案例。它并不打算成为你可能想要用 Redux 做的所有事情的完整解决方案，但它应该使你需要编写的大部分 Redux 相关代码更简单（或在某些情况下，消除一些手写代码）。

Redux Toolkit 导出了几个你可以在你的应用程序中使用的单独函数，并添加了一些常与 Redux 一起使用的其他包的依赖（如 Reselect 和 Redux-Thunk）。这让你决定如何在你自己的应用程序中使用这些，无论它是一个全新的项目还是更新一个大型现有的应用。

让我们看看 Redux Toolkit 如何帮助你改进你的 Redux 相关代码。

## 存储设置

每个 Redux 应用都需要配置和创建一个 Redux 存储。这通常涉及几个步骤：

- 导入或创建根 reducer 函数
- 设置中间件，可能至少包括一个处理异步逻辑的中间件
- 配置 [Redux DevTools 扩展](https://github.com/reduxjs/redux-devtools)
- 可能根据应用程序是否为开发或生产构建来改变一些逻辑

### 手动存储设置

以下示例来自 Redux 文档的 [配置你的存储](https://redux.js.org/recipes/configuring-your-store) 页面，显示了一个典型的存储设置过程：

```js
import { applyMiddleware, createStore } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension'
import thunkMiddleware from 'redux-thunk'

import monitorReducersEnhancer from './enhancers/monitorReducers'
import loggerMiddleware from './middleware/logger'
import rootReducer from './reducers'

export default function configureStore(preloadedState) {
    const middlewares = [loggerMiddleware, thunkMiddleware]
    const middlewareEnhancer = applyMiddleware(...middlewares)

    const enhancers = [middlewareEnhancer, monitorReducersEnhancer]
    const composedEnhancers = composeWithDevTools(...enhancers)

    const store = createStore(rootReducer, preloadedState, composedEnhancers)

    if (process.env.NODE_ENV !== 'production' && module.hot) {
        module.hot.accept('./reducers', () => store.replaceReducer(rootReducer))
    }

    return store
}
```

这个例子是可读的，但过程并不总是直接的：

- 基本的 Redux `createStore` 函数接受位置参数：`(rootReducer, preloadedState, enhancer)`。有时候很容易忘记哪个参数是哪个。
- 设置中间件和增强器的过程可能会让人困惑，特别是如果你试图添加几个配置。
- Redux DevTools 扩展文档最初建议使用[一些手写的代码来检查全局命名空间以查看扩展是否可用](https://github.com/zalmoxisus/redux-devtools-extension#11-basic-store)。许多用户复制和粘贴这些片段，这使得设置代码更难阅读。

### 使用 `configureStore` 简化存储设置

`configureStore` 通过以下方式帮助解决这些问题：

- 有一个带有 "命名" 参数的选项对象，这可能更容易阅读
- 让你提供你想要添加到存储的中间件和增强器的数组，并自动为你调用 `applyMiddleware` 和 `compose`
- 自动启用 Redux DevTools 扩展

此外，`configureStore` 默认添加了一些中间件，每个中间件都有一个特定的目标：

- [`redux-thunk`](https://github.com/reduxjs/redux-thunk) 是用于处理组件外部的同步和异步逻辑的最常用的中间件
- 在开发中，检查常见错误的中间件，如改变状态或使用非序列化值。

这意味着存储设置代码本身更短，更容易阅读，而且你也可以得到良好的默认行为。

使用它最简单的方式是将根 reducer 函数作为一个名为 `reducer` 的参数传递：

```js
import { configureStore } from '@reduxjs/toolkit'
import rootReducer from './reducers'

const store = configureStore({
    reducer: rootReducer,
})

export default store
```

你也可以传递一个充满 ["slice reducers"](https://redux.js.org/recipes/structuring-reducers/splitting-reducer-logic) 的对象，`configureStore` 将为你调用 [`combineReducers`](https://redux.js.org/api/combinereducers)：

```js
import { configureStore } from '@reduxjs/toolkit'
// highlight-start
import usersReducer from './usersReducer'
import postsReducer from './postsReducer'

const store = configureStore({
    reducer: {
        users: usersReducer,
        posts: postsReducer,
    },
})
// highlight-end

export default store
```

注意，这只适用于一级的 reducers。如果你想要嵌套 reducers，你需要自己调用 `combineReducers` 来处理嵌套。

如果你需要自定义存储设置，你可以传递额外的选项。以下是使用 Redux Toolkit 的热重载示例可能的样子：

```js
import { configureStore } from '@reduxjs/toolkit'

import monitorReducersEnhancer from './enhancers/monitorReducers'
import loggerMiddleware from './middleware/logger'
import rootReducer from './reducers'

export default function configureAppStore(preloadedState) {
    const store = configureStore({
        reducer: rootReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(loggerMiddleware),
        preloadedState,
        enhancers: (getDefaultEnhancers) =>
            getDefaultEnhancers().concat(monitorReducersEnhancer),
    })

    if (process.env.NODE_ENV !== 'production' && module.hot) {
        module.hot.accept('./reducers', () => store.replaceReducer(rootReducer))
    }

    return store
}
```

如果你提供了 `middleware` 参数，`configureStore` 将只使用你列出的任何中间件。
如果你想要有一些自定义的中间件 _和_ 所有的默认值一起，你可以使用回调表示法，
调用 [`getDefaultMiddleware`](../api/getDefaultMiddleware.mdx) 并在你返回的 `middleware` 数组中包含结果。

## 编写 Reducers

[Reducers](https://redux.js.org/basics/reducers) 是 Redux 最重要的概念。典型的 reducer 函数需要：

- 查看 action 对象的 `type` 字段以了解如何响应
- 通过复制需要更改的状态部分并仅修改这些副本，以不可变的方式更新其状态

虽然你可以在 reducer 中[使用任何你想要的条件逻辑](https://blog.isquaredsoftware.com/2017/05/idiomatic-redux-tao-of-redux-part-2/#switch-statements)，但最常见的方法是 `switch` 语句，因为它是处理单个字段的多个可能值的直接方式。然而，许多人不喜欢 switch 语句。Redux 文档展示了一个[编写一个基于 action 类型的查找表函数](https://redux.js.org/recipes/reducing-boilerplate#generating-reducers)的例子，但将自定义该函数的方式留给了用户。

编写 reducers 的其他常见痛点与不可变地更新状态有关。JavaScript 是一种可变语言，[手动更新嵌套的不可变数据很难](https://redux.js.org/recipes/structuring-reducers/immutable-update-patterns)，而且很容易犯错误。

### 使用 `createReducer` 简化 Reducers

由于 "查找表" 方法很受欢迎，Redux Toolkit 包含了一个类似于 Redux 文档中显示的 `createReducer` 函数。然而，我们的 `createReducer` 实用程序有一些特殊的 "魔法"，使它更好。它内部使用 [Immer](https://github.com/mweststrate/immer) 库，该库让你编写 "改变" 一些数据的代码，但实际上以不可变的方式应用更新。这使得在 reducer 中意外地改变状态几乎不可能。

一般来说，任何使用 `switch` 语句的 Redux reducer 都可以直接转换为使用 `createReducer`。switch 中的每个 `case` 都成为传递给 `createReducer` 的对象中的一个键。不可变的更新逻辑，如扩展对象或复制数组，可能可以转换为直接的 "突变"。也可以保持不可变的更新原样，并返回更新的副本。

以下是一些如何使用 `createReducer` 的例子。我们从一个使用 switch 语句和不可变更新的典型 "待办事项列表" reducer 开始：

```js
function todosReducer(state = [], action) {
  switch (action.type) {
    case 'ADD_TODO': {
      return state.concat(action.payload)
    }
    case 'TOGGLE_TODO': {
      const { index } = action.payload
      return state.map((todo, i) => {
        if (i !== index) return todo

        return {
          ...todo,
          completed: !todo.completed,
        }
      })
    }
    case 'REMOVE_TODO': {
      return state.filter((todo, i) => i !== action.payload.index)
    }
    default:
      return state
  }
}
```

注意，我们特别调用 `state.concat()` 来返回一个带有新待办事项条目的复制数组，`state.map()` 来返回切换案例的复制数组，并使用对象扩展运算符来复制需要更新的待办事项。

使用 `createReducer`，我们可以大大缩短这个例子：

```js
const todosReducer = createReducer([], (builder) => {
  builder
    .addCase('ADD_TODO', (state, action) => {
      // 通过调用 push() "改变"数组
      state.push(action.payload)
    })
    .addCase('TOGGLE_TODO', (state, action) => {
      const todo = state[action.payload.index]
      // 通过覆盖字段 "改变"对象
      todo.completed = !todo.completed
    })
    .addCase('REMOVE_TODO', (state, action) => {
      // 如果我们想要，仍然可以返回一个不可变更新的值
      return state.filter((todo, i) => i !== action.payload.index)
    })
})
```

当试图更新深层嵌套的状态时，"改变"状态的能力特别有用。这段复杂而痛苦的代码：

```js
case "UPDATE_VALUE":
  return {
    ...state,
    first: {
      ...state.first,
      second: {
        ...state.first.second,
        [action.someId]: {
          ...state.first.second[action.someId],
          fourth: action.someValue
        }
      }
    }
  }
```

可以简化为：

```js
updateValue(state, action) {
    const {someId, someValue} = action.payload;
    state.first.second[someId].fourth = someValue;
}
```

好多了！

### 使用 `createReducer` 的注意事项

虽然 Redux Toolkit 的 `createReducer` 函数非常有用，但请记住：

- "突变"代码只在我们的 `createReducer` 函数内部正确工作
- Immer 不会让你混合 "突变" 草稿状态并返回新的状态值

有关更多详细信息，请参阅 [`createReducer` API 参考](../api/createReducer.mdx)。

## 编写 Action 创建器

Redux 鼓励你[编写 "action 创建器" 函数](https://blog.isquaredsoftware.com/2016/10/idiomatic-redux-why-use-action-creators/)，封装创建 action 对象的过程。虽然这不是严格要求的，但它是 Redux 使用的标准部分。

大多数 action 创建器非常简单。它们接受一些参数，并返回一个带有特定 `type` 字段和 action 内部参数的 action 对象。这些参数通常放在一个名为 `payload` 的字段中，这是 [Flux Standard Action](https://github.com/redux-utilities/flux-standard-action) 约定组织 action 对象内容的一部分。典型的 action 创建器可能看起来像这样：

```js
function addTodo(text) {
  return {
    type: 'ADD_TODO',
    payload: { text },
  }
}
```

### 使用 `createAction` 定义 Action 创建器

手动编写 action 创建器可能会变得乏味。Redux Toolkit 提供了一个名为 `createAction` 的函数，它简单地生成一个使用给定 action 类型的 action 创建器，并将其参数转换为 `payload` 字段：

```js
const addTodo = createAction('ADD_TODO')
addTodo({ text: 'Buy milk' })
// {type : "ADD_TODO", payload : {text : "Buy milk"}})
```

`createAction` 还接受一个 "prepare callback" 参数，允许你自定义结果 `payload` 字段并可选地添加一个 `meta` 字段。有关使用 prepare callback 定义 action 创建器的详细信息，请参阅 [`createAction` API 参考](../api/createAction.mdx#using-prepare-callbacks-to-customize-action-contents)。

### 使用 Action 创建器作为 Action 类型

Redux reducers 需要查找特定的 action 类型，以确定它们应如何更新其状态。通常，这是通过分别定义 action 类型字符串和 action 创建器函数来完成的。Redux Toolkit 的 `createAction` 函数使这更容易，通过在 action 创建器上定义 action 类型作为 `type` 字段。

```js
const actionCreator = createAction('SOME_ACTION_TYPE')

console.log(actionCreator.type)
// "SOME_ACTION_TYPE"

const reducer = createReducer({}, (builder) => {
  // 如果你使用 TypeScript，action 类型将被正确推断
  builder.addCase(actionCreator, (state, action) => {})

  // 或者，你可以引用 .type 字段：
  // 如果使用 TypeScript，无法以这种方式推断 action 类型
  builder.addCase(actionCreator.type, (state, action) => {})
})
```

这意味着你不必编写或使用单独的 action 类型变量，或重复 action 类型的名称和值，如 `const SOME_ACTION_TYPE = "SOME_ACTION_TYPE"`。

如果你想在 switch 语句中使用其中一个 action 创建器，你需要自己引用 `actionCreator.type`：

```js
const actionCreator = createAction('SOME_ACTION_TYPE')

const reducer = (state = {}, action) => {
  switch (action.type) {
    // 错误：这将无法正确工作！
    case actionCreator: {
      break
    }
    // 正确：这将按预期工作
    case actionCreator.type: {
      break
    }
  }
}
```

## 创建状态切片

Redux 状态通常按照 "切片" 组织，这些切片由传递给 `combineReducers` 的 reducers 定义：

```js
import { combineReducers } from 'redux'
import usersReducer from './usersReducer'
import postsReducer from './postsReducer'

const rootReducer = combineReducers({
  users: usersReducer,
  posts: postsReducer,
})
```

在这个例子中，`users` 和 `posts` 都被认为是 "切片"。这两个 reducers 都：

- "拥有" 一部分状态，包括其初始值是什么
- 定义了如何更新该状态
- 定义了哪些特定的 actions 会导致状态更新

常见的做法是在其自己的文件中定义一个切片的 reducer 函数，而在第二个文件中定义 action 创建器。因为这两个函数都需要引用相同的 action 类型，所以这些类型通常在第三个文件中定义并在两个地方都导入：

```js
// postsConstants.js
const CREATE_POST = 'CREATE_POST'
const UPDATE_POST = 'UPDATE_POST'
const DELETE_POST = 'DELETE_POST'

// postsActions.js
import { CREATE_POST, UPDATE_POST, DELETE_POST } from './postConstants'

export function addPost(id, title) {
  return {
    type: CREATE_POST,
    payload: { id, title },
  }
}

// postsReducer.js
import { CREATE_POST, UPDATE_POST, DELETE_POST } from './postConstants'

const initialState = []

export default function postsReducer(state = initialState, action) {
  switch (action.type) {
    case CREATE_POST: {
      // 省略实现
    }
    default:
      return state
  }
}
```

这里唯一真正必要的部分是 reducer 本身。考虑其他部分：

- 我们可以在两个地方都将 action 类型写为内联字符串
- action 创建器很好，但它们并不是使用 Redux 的 _必要条件_ - 组件可以跳过提供 `mapDispatch` 参数给 `connect`，并直接调用 `this.props.dispatch({type : "CREATE_POST", payload : {id : 123, title : "Hello World"}})`
- 我们甚至写多个文件的唯一原因是因为常见的做法是按照代码的功能进行分离

["ducks" 文件结构](https://github.com/erikras/ducks-modular-redux) 提议将给定切片的所有 Redux 相关逻辑放入一个单独的文件，像这样：

```js
// postsDuck.js
const CREATE_POST = 'CREATE_POST'
const UPDATE_POST = 'UPDATE_POST'
const DELETE_POST = 'DELETE_POST

'



export function addPost(id, title) {
  return {
    type: CREATE_POST,
    payload: { id, title },
  }
}

const initialState = []

export default function postsReducer(state = initialState, action) {
  switch (action.type) {
    case CREATE_POST: {
      // 省略实际代码
      break
    }
    default:
      return state
  }
}
```

这简化了事情，因为我们不需要有多个文件，我们可以删除 action 类型常量的冗余导入。但是，我们仍然需要手动编写 action 类型和 action 创建器。

### 在对象中定义函数

在现代 JavaScript 中，有几种合法的方式在对象中定义键和函数（这并不特定于 Redux），你可以混合匹配不同的键定义和函数定义。例如，这些都是在对象内部定义函数的合法方式：

```js
const keyName = "ADD_TODO4";

const reducerObject = {
	// 显式引号用于键名，箭头函数用于 reducer
	"ADD_TODO1" : (state, action) => { }

	// 没有引号的裸键，function 关键字
	ADD_TODO2 : function(state, action){  }

	// 对象字面量函数简写
	ADD_TODO3(state, action) { }

	// 计算属性
	[keyName] : (state, action) => { }
}
```

使用 ["对象字面量函数简写"](https://www.sitepoint.com/es6-enhanced-object-literals/) 可能是最短的代码，但请随意使用你想要的那种方法。

### 使用 `createSlice` 简化切片

为了简化这个过程，Redux Toolkit 包含了一个 `createSlice` 函数，它会根据你提供的 reducer 函数的名称自动生成 action 类型和 action 创建器。

以下是使用 `createSlice` 的帖子示例：

```js
const postsSlice = createSlice({
  name: 'posts',
  initialState: [],
  reducers: {
    createPost(state, action) {},
    updatePost(state, action) {},
    deletePost(state, action) {},
  },
})

console.log(postsSlice)
/*
{
    name: 'posts',
    actions : {
        createPost,
        updatePost,
        deletePost,
    },
    reducer
}
*/

const { createPost } = postsSlice.actions

console.log(createPost({ id: 123, title: 'Hello World' }))
// {type : "posts/createPost", payload : {id : 123, title : "Hello World"}}
```

`createSlice` 查看了在 `reducers` 字段中定义的所有函数，对于提供的每一个 "case reducer" 函数，生成一个使用 reducer 名称作为 action 类型本身的 action 创建器。所以，`createPost` reducer 成为了一个 action 类型为 `"posts/createPost"`，并且 `createPost()` action 创建器将返回一个具有该类型的 action。

### 导出和使用切片

大多数时候，你会想要定义一个切片，并导出它的动作创建器和reducers。推荐的方式是使用ES6的解构和导出语法：

```js
const postsSlice = createSlice({
  name: 'posts',
  initialState: [],
  reducers: {
    createPost(state, action) {},
    updatePost(state, action) {},
    deletePost(state, action) {},
  },
})

// 提取动作创建器对象和reducer
const { actions, reducer } = postsSlice
// 通过名称提取并导出每个动作创建器
export const { createPost, updatePost, deletePost } = actions
// 导出reducer，可以作为默认或命名导出
export default reducer
```

如果你愿意，也可以直接导出切片对象本身。

这样定义的切片在概念上非常类似于["Redux Ducks"模式](https://github.com/erikras/ducks-modular-redux)用于定义和导出动作创建器和reducers。然而，在导入和导出切片时，需要注意一些可能的问题。

首先，**Redux动作类型并不是专属于单个切片**。从概念上讲，每个切片reducer "拥有" 它自己的Redux状态部分，但它应该能够监听任何动作类型并适当地更新其状态。例如，许多不同的切片可能希望通过清除数据或重置为初始状态值来响应 "用户注销" 动作。在设计你的状态形状和创建你的切片时，请记住这一点。

其次，**如果两个模块试图导入彼此，JS模块可能会有 "循环引用" 问题**。这可能导致导入的内容未定义，这可能会破坏需要该导入的代码。特别是在 "ducks" 或切片的情况下，如果在两个不同的文件中定义的切片都想响应在另一个文件中定义的动作，就可能发生这种情况。

这个CodeSandbox示例演示了这个问题：

<iframe src="https://codesandbox.io/embed/rw7ppj4z0m/?runonclick=1" style={{ width: '100%', height: '500px', border: 0, borderRadius: '4px', overflow: 'hidden' }} sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"></iframe>

如果你遇到这个问题，你可能需要以避免循环引用的方式重构你的代码。这通常需要将共享代码提取到一个独立的公共文件中，这样两个模块都可以导入和使用。在这种情况下，你可能会在一个单独的文件中使用 `createAction` 定义一些公共动作类型，将这些动作创建器导入到每个切片文件中，并使用 `extraReducers` 参数处理它们。

这篇文章 [如何修复JS中的循环依赖问题](https://medium.com/visual-development/how-to-fix-nasty-circular-dependency-issues-once-and-for-all-in-javascript-typescript-a04c987cf0de) 提供了额外的信息和示例，可以帮助解决这个问题。

## 异步逻辑和数据获取

### 使用中间件启用异步逻辑

本身，Redux存储并不知道任何关于异步逻辑的事情。它只知道如何同步地分派动作，通过调用根reducer函数更新状态，并通知UI有些东西已经改变。任何异步性都必须在存储之外发生。

但是，如果你想让异步逻辑通过分派或检查当前存储状态与存储进行交互呢？这就是[Redux中间件](https://redux.js.org/advanced/middleware)的作用。它们扩展了存储，并允许你：

- 当任何动作被分派时执行额外的逻辑（如记录动作和状态）
- 暂停、修改、延迟、替换或阻止分派的动作
- 编写有权访问 `dispatch` 和 `getState` 的额外代码
- 通过拦截它们并分派真正的动作对象，教 `dispatch` 如何接受除纯动作对象之外的其他值，如函数和承诺

[使用中间件的最常见原因是允许不同类型的异步逻辑与存储进行交互](https://redux.js.org/faq/actions#how-can-i-represent-side-effects-such-as-ajax-calls-why-do-we-need-things-like-action-creators-thunks-and-middleware-to-do-async-behavior)。这允许你编写可以分派动作和检查存储状态的代码，同时将该逻辑与你的UI保持分离。

Redux有许多种异步中间件，每种都让你使用不同的语法编写你的逻辑。最常见的异步中间件有：

- [`redux-thunk`](https://github.com/reduxjs/redux-thunk)，它让你直接编写可能包含异步逻辑的普通函数
- [`redux-saga`](https://github.com/redux-saga/redux-saga)，它使用生成器函数返回行为描述，以便中间件可以执行
- [`redux-observable`](https://github.com/redux-observable/redux-observable/)，它使用RxJS可观察库创建处理动作的函数链

[这些库各有不同的用例和权衡](https://redux.js.org/faq/actions#what-async-middleware-should-i-use-how-do-you-decide-between-thunks-sagas-observables-or-something-else)。

:::tip

Redux Toolkit的 [**RTK Query数据获取API**](../rtk-query/overview.md) 是为Redux应用程序专门构建的数据获取和缓存解决方案，可以 **消除编写任何thunks或reducers来管理数据获取的需要**。我们鼓励你尝试一下，看看它是否可以帮助简化你自己应用程序中的数据获取代码！

:::

如果你确实需要自己编写数据获取逻辑，我们推荐 [使用Redux Thunk中间件作为标准方法](https://github.com/reduxjs/redux-thunk)，因为它足以应对大多数典型的使用场景（如基本的AJAX数据获取）。此外，thunks中 `async/await` 语法的使用使它们更易于阅读。

**Redux Toolkit的 `configureStore` 函数 [默认自动设置thunk中间件](../api/getDefaultMiddleware.mdx)**，所以你可以立即开始编写作为你的应用程序代码的thunks。

### 在切片中定义异步逻辑

Redux Toolkit目前并未提供任何特殊的API或语法来编写thunk函数。特别是，**它们不能作为 `createSlice()` 调用的一部分来定义**。你必须将它们与reducer逻辑分开编写，就像在普通的Redux代码中一样。

Thunks通常分派普通的动作，如 `dispatch(dataLoaded(response.data))`。

许多Redux应用程序已经使用 "按类型分文件夹" 的方式来组织代码。在这种结构中，thunk动作创建器通常在 "actions" 文件中定义，与普通的动作创建器一起。

因为我们没有单独的 "actions" 文件，**直接在我们的 "slice" 文件中编写这些thunks是有意义的**。这样，它们可以访问切片中的普通动作创建器，而且很容易找到thunk函数的位置。

一个包含thunks的典型切片文件可能是这样的：

```js
// 首先，通过 `createSlice` 定义reducer和动作创建器
const usersSlice = createSlice({
  name: 'users',
  initialState: {
    loading: 'idle',
    users: [],
  },
  reducers: {
    usersLoading(state, action) {
      // 使用 "状态机" 方法处理加载状态，而不是布尔值
      if (state.loading === 'idle') {
        state.loading = 'pending'
      }
    },
    usersReceived(state, action) {
      if (state.loading === 'pending') {
        state.loading = 'idle'
        state.users = action.payload
      }
    },
  },
})

// 解构并导出普通动作创建器
export const { usersLoading, usersReceived } = usersSlice.actions

// 定义一个分派这些动作创建器的thunk
const fetchUsers = () => async (dispatch) => {
  dispatch(usersLoading())
  const response = await usersAPI.fetchAll()
  dispatch(usersReceived(response.data))
}
```

### Redux 数据获取模式

Redux 的数据获取逻辑通常遵循一个可预测的模式：

- 在请求开始之前，会派发一个 "start" 动作，表示请求正在进行中。这可能用于跟踪加载状态，允许跳过重复的请求，或在 UI 中显示加载指示器。
- 执行异步请求
- 根据请求结果，异步逻辑会派发一个包含结果数据的 "success" 动作，或者一个包含错误详情的 "failure" 动作。在这两种情况下，reducer 逻辑都会清除加载状态，并处理成功情况下的结果数据，或者存储错误值以供可能的显示。

这些步骤不是必需的，但是[在 Redux 教程中推荐作为建议的模式](https://redux.js.org/advanced/async-actions)。

一个典型的实现可能看起来像这样：

```js
const getRepoDetailsStarted = () => ({
  type: 'repoDetails/fetchStarted',
})
const getRepoDetailsSuccess = (repoDetails) => ({
  type: 'repoDetails/fetchSucceeded',
  payload: repoDetails,
})
const getRepoDetailsFailed = (error) => ({
  type: 'repoDetails/fetchFailed',
  error,
})
const fetchIssuesCount = (org, repo) => async (dispatch) => {
  dispatch(getRepoDetailsStarted())
  try {
    const repoDetails = await getRepoDetails(org, repo)
    dispatch(getRepoDetailsSuccess(repoDetails))
  } catch (err) {
    dispatch(getRepoDetailsFailed(err.toString()))
  }
}
```

然而，使用这种方法编写代码是繁琐的。每种不同类型的请求都需要重复类似的实现：

- 需要为三种不同的情况定义唯一的动作类型
- 每种动作类型通常都有一个对应的动作创建函数
- 必须编写一个 thunk，它会按正确的顺序派发正确的动作

`createAsyncThunk` 通过生成动作类型和动作创建者，并生成一个派发这些动作的 thunk，来抽象这种模式。

### 使用 `createAsyncThunk` 的异步请求

作为开发者，你可能最关心的是执行 API 请求所需的实际逻辑，Redux 动作历史记录中显示的动作类型名称，以及你的 reducer 应如何处理获取的数据。定义多个动作类型并按正确的顺序派发动作的重复细节并不重要。

`createAsyncThunk` 简化了这个过程 - 你只需要提供一个动作类型前缀的字符串和一个执行实际异步逻辑并返回带有结果的 promise 的 payload 创建回调。作为回报，`createAsyncThunk` 将给你一个 thunk，它会根据你返回的 promise 派发正确的动作，并提供你可以在 reducer 中处理的动作类型：

```js {5-11,22-25,30}
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { userAPI } from './userAPI'

// 首先，创建 thunk
const fetchUserById = createAsyncThunk(
  'users/fetchByIdStatus',
  async (userId, thunkAPI) => {
    const response = await userAPI.fetchById(userId)
    return response.data
  },
)

// 然后，在你的 reducers 中处理动作：
const usersSlice = createSlice({
  name: 'users',
  initialState: { entities: [], loading: 'idle' },
  reducers: {
    // 标准的 reducer 逻辑，每个 reducer 都有自动生成的动作类型
  },
  extraReducers: (builder) => {
    // 在这里添加额外的动作类型的 reducers，并根据需要处理加载状态
    builder.addCase(fetchUserById.fulfilled, (state, action) => {
      // 将用户添加到 state 数组
      state.entities.push(action.payload)
    })
  },
})

// 稍后，在应用中根据需要派发 thunk
dispatch(fetchUserById(123))
```

thunk 动作创建者接受一个参数，它将作为第一个参数传递给你的 payload 创建回调。

payload 创建者还会接收一个 `thunkAPI` 对象，其中包含通常传递给标准 Redux thunk 函数的参数，以及一个自动生成的唯一随机请求 ID 字符串和一个 [`AbortController.signal` 对象](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/signal)：

```ts
interface ThunkAPI {
  dispatch: Function
  getState: Function
  extra?: any
  requestId: string
  signal: AbortSignal
}
```

你可以在 payload 回调中根据需要使用这些参数来确定最终结果应该是什么。

## 管理规范化数据

大多数应用程序通常处理的数据是深层嵌套的或关系型的。规范化数据的目标是有效地组织你的状态中的数据。这通常是通过将集合存储为带有 `id` 键的对象，同时存储那些 `ids` 的排序数组来完成的。关于更深入的解释和更多的例子，[Redux 文档页面上的 "Normalizing State Shape"](https://redux.js.org/recipes/structuring-reducers/normalizing-state-shape) 是一个很好的参考。

### 手动规范化

规范化数据不需要任何特殊的库。下面是一个基本的例子，展示了你如何规范化一个 `fetchAll` API 请求的响应，该请求返回的数据形状为 `{ users: [{id: 1, first_name: 'normalized', last_name: 'person'}] }`，使用一些手写的逻辑：

```js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import userAPI from './userAPI'

export const fetchUsers = createAsyncThunk('users/fetchAll', async () => {
  const response = await userAPI.fetchAll()
  return response.data
})

export const slice = createSlice({
  name: 'users',
  initialState: {
    ids: [],
    entities: {},
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchUsers.fulfilled, (state, action) => {
      // 通过 id 属性将集合减少到 { 1: { ...user }} 的形状
      const byId = action.payload.users.reduce((byId, user) => {
        byId[user.id] = user
        return byId
      }, {})
      state.entities = byId
      state.ids = Object.keys(byId)
    })
  },
})
```

尽管我们能够编写这段代码，但它确实变得重复，特别是如果你正在处理多种类型的数据。此外，这个例子只处理将条目加载到状态中，而不更新它们。

### 使用 `normalizr` 进行规范化

[`normalizr`](https://github.com/paularmstrong/normalizr) 是一个用于规范化数据的流行库。你可以在没有 Redux 的情况下单独使用它，但它通常与 Redux 一起使用。典型的用法是格式化来自 API 响应的集合，然后在你的 reducer 中处理它们。

```js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { normalize, schema } from 'normalizr'

import userAPI from './userAPI'

const userEntity = new schema.Entity('users')

export const fetchUsers = createAsyncThunk('users/fetchAll', async () => {
  const response = await userAPI.fetchAll()
  // 在将数据传递给我们的 reducer 之前规范化它
  const normalized = normalize(response.data, [userEntity])
  return normalized.entities
})

export const slice = createSlice({
  name: 'users',
  initialState: {
    ids: [],
    entities: {},
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchUsers.fulfilled, (state, action) => {
      state.entities = action.payload.users
      state.ids = Object.keys(action.payload.users)
    })
  },
})
```

与手写版本一样，这并不处理将额外的条目添加到状态中，或稍后更新它们 - 它只是加载接收到的所有内容。

### 使用 `createEntityAdapter` 进行规范化

Redux Toolkit 的 `createEntityAdapter` API 提供了一种标准化的方式来在一个 slice 中存储你的数据，它通过接收一个集合并将其放入 `{ ids: [], entities: {} }` 的形状中。除了这个预定义的状态形状，它还生成了一组知道如何处理数据的 reducer 函数和选择器。

```js
import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
} from '@reduxjs/toolkit'
import userAPI from './userAPI'

export const fetchUsers = createAsyncThunk('users/fetchAll', async () => {
  const response = await userAPI.fetchAll()
  // 在这种情况下，`response.data` 将是：
  // [{id: 1, first_name: 'Example', last_name: 'User'}]
  return response.data
})

export const updateUser = createAsyncThunk('users/updateOne', async (arg) => {
  const response = await userAPI.updateUser(arg)
  // 在这种情况下，`response.data` 将是：
  // { id: 1, first_name: 'Example', last_name: 'UpdatedLastName'}
  return response.data
})

export const usersAdapter = createEntityAdapter()

// 默认情况下，`createEntityAdapter` 会给你 `{ ids: [], entities: {} }`。
// 如果你想要跟踪 'loading' 或其他键，你可以在这里初始化它们：
// `getInitialState({ loading: false, activeRequestId: null })`
const initialState = usersAdapter.getInitialState()

export const slice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    removeUser: usersAdapter.removeOne,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchUsers.fulfilled, usersAdapter.upsertMany)
    builder.addCase(updateUser.fulfilled, (state, { payload }) => {
      const { id, ...changes } = payload
      usersAdapter.updateOne(state, { id, changes })
    })
  },
})

const reducer = slice.reducer
export default reducer

export const { removeUser } = slice.actions
```

你可以在 CodeSandbox 上[查看此示例用法的完整代码](https://codesandbox.io/s/rtk-entities-basic-example-1xubt)。

### 与规范化库一起使用 `createEntityAdapter`

如果你已经在使用 `normalizr` 或其他规范化库，你可以考虑与 `createEntityAdapter` 一起使用。为了扩展上述示例，这里展示了我们如何使用 `normalizr` 格式化有效载荷，然后利用 `createEntityAdapter` 提供的实用程序。

默认情况下，`setAll`，`addMany` 和 `upsertMany` CRUD 方法期望一个实体数组。然而，它们也允许你传入一个形状为 `{ 1: { id: 1, ... }}` 的对象作为替代，这使得插入预规范化的数据更加容易。

```js
// features/articles/articlesSlice.js
import {
  createSlice,
  createEntityAdapter,
  createAsyncThunk,
  createSelector,
} from '@reduxjs/toolkit'
import fakeAPI from '../../services/fakeAPI'
import { normalize, schema } from 'normalizr'

// 定义 normalizr 实体模式
export const userEntity = new schema.Entity('users')
export const commentEntity = new schema.Entity('comments', {
  commenter: userEntity,
})
export const articleEntity = new schema.Entity('articles', {
  author: userEntity,
  comments: [commentEntity],
})

const articlesAdapter = createEntityAdapter()

export const fetchArticle = createAsyncThunk(
  'articles/fetchArticle',
  async (id) => {
    const data = await fakeAPI.articles.show(id)
    // 规范化数据，以便 reducer 可以加载可预测的有效载荷，如：
    // `action.payload = { users: {}, articles: {}, comments: {} }`
    const normalized = normalize(data, articleEntity)
    return normalized.entities
  }
)

export const slice = createSlice({
  name: 'articles',
  initialState: articlesAdapter.getInitialState(),
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchArticle.fulfilled, (state, action) => {
      // 通过在这里插入文章来处理获取结果
      articlesAdapter.upsertMany(state, action.payload.articles)
    })
  },
})

const reducer = slice.reducer
export default reducer

// features/users/usersSlice.js

import { createSlice, createEntityAdapter } from '@reduxjs/toolkit'
import { fetchArticle } from '../articles/articlesSlice'

const usersAdapter = createEntityAdapter()

export const slice = createSlice({
  name: 'users',
  initialState: usersAdapter.getInitialState(),
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchArticle.fulfilled, (state, action) => {
      // 并通过在这里插入用户来处理相同的获取结果
      usersAdapter.upsertMany(state, action.payload.users)
    })
  },
})

const reducer = slice.reducer
export default reducer

// features/comments/commentsSlice.js

import { createSlice, createEntityAdapter } from '@reduxjs/toolkit'
import { fetchArticle } from '../articles/articlesSlice'

const commentsAdapter = createEntityAdapter()

export const slice = createSlice({
  name: 'comments',
  initialState: commentsAdapter.getInitialState(),
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchArticle.fulfilled, (state, action) => {
      // 对于评论也是如此
      commentsAdapter.upsertMany(state, action.payload.comments)
    })
  },
})

const reducer = slice.reducer
export default reducer
```

你可以在 CodeSandbox 上[查看此示例 `normalizr` 用法的完整代码](https://codesandbox.io/s/rtk-entities-basic-example-with-normalizr-bm3ie)

### 使用 `createEntityAdapter` 的选择器

实体适配器提供了一个选择器工厂，为你生成最常见的选择器。以上述示例为例，我们可以向我们的 `usersSlice` 添加选择器，如下所示：

```js
// 重命名导出以便在组件使用中提高可读性
export const {
  selectById: selectUserById,
  selectIds: selectUserIds,
  selectEntities: selectUserEntities,
  selectAll: selectAllUsers,
  selectTotal: selectTotalUsers,
} = usersAdapter.getSelectors((state) => state.users)
```

然后你可以在组件中这样使用这些选择器：

```js
import React from 'react'
import { useSelector } from 'react-redux'
import { selectTotalUsers, selectAllUsers } from './usersSlice'

import styles from './UsersList.module.css'

export function UsersList() {
  const count = useSelector(selectTotalUsers)
  const users = useSelector(selectAllUsers)

  return (
    <div>
      <div className={styles.row}>
        有 <span className={styles.value}>{count}</span> 个用户。{' '}
        {count === 0 && `为什么不获取更多呢？`}
      </div>
      {users.map((user) => (
        <div key={user.id}>
          <div>{`${user.first_name} ${user.last_name}`}</div>
        </div>
      ))}
    </div>
  )
}
```

### 指定替代 ID 字段

默认情况下，`createEntityAdapter` 假设你的数据在 `entity.id` 字段中具有唯一的 ID。如果你的数据集在不同的字段中存储其 ID，你可以传入一个 `selectId` 参数，该参数返回适当的字段。

```js
// 在这个实例中，我们的用户数据总是有一个主键 `idx`
const userData = {
  users: [
    { idx: 1, first_name: 'Test' },
    { idx: 2, first_name: 'Two' },
  ],
}

// 由于我们的主键是 `idx` 而不是 `id`，
// 传入一个 ID 选择器来返回该字段
export const usersAdapter = createEntityAdapter({
  selectId: (user) => user.idx,
})
```

### 对实体进行排序

`createEntityAdapter` 提供了一个 `sortComparer` 参数，你可以利用它来对状态中的 `ids` 集合进行排序。当你想保证排序顺序，而你的数据并未预排序时，这会非常有用。

```js
// 在这个实例中，我们的用户数据总是有一个主键 `id`，所以我们不需要提供 `selectId`。
const userData = {
  users: [
    { id: 1, first_name: 'Test' },
    { id: 2, first_name: 'Banana' },
  ],
}

// 按 `first_name` 排序。`state.ids` 将被排序为
// `ids: [ 2, 1 ]`，因为 'B' 在 'T' 之前。
// 当使用提供的 `selectAll` 选择器时，结果将被排序：
// [{ id: 2, first_name: 'Banana' }, { id: 1, first_name: 'Test' }]
export const usersAdapter = createEntityAdapter({
  sortComparer: (a, b) => a.first_name.localeCompare(b.first_name),
})
```

## 处理非序列化数据

Redux 的一个核心使用原则是[你不应该在状态或动作中放入非序列化的值](https://redux.js.org/style-guide/#do-not-put-non-serializable-values-in-state-or-actions)。

然而，像大多数规则一样，总有例外。可能有时候你需要处理需要接受非序列化数据的动作。这应该非常少见，只有在必要时才这样做，而且这些非序列化的有效载荷不应该通过 reducer 进入你的应用状态。

[序列化开发检查中间件](../api/serializabilityMiddleware.mdx)会在检测到你的动作或状态中有非序列化值时自动发出警告。我们建议你保持这个中间件的活动状态，以帮助避免意外的错误。然而，如果你_确实_需要关闭这些警告，你可以通过配置它来忽略特定的动作类型，或者在动作和状态中的字段：

```js
configureStore({
  //...
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // 忽略这些动作类型
        ignoredActions: ['your/action/type'],
        // 在所有动作中忽略这些字段路径
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        // 忽略状态中的这些路径
        ignoredPaths: ['items.dates'],
      },
    }),
})
```

### 与 Redux-Persist 一起使用

如果使用 Redux-Persist，你应该特别忽略它分派的所有动作类型：

```jsx
import { configureStore } from '@reduxjs/toolkit'
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { PersistGate } from 'redux-persist/integration/react'

import App from './App'
import rootReducer from './reducers'

const persistConfig = {
  key:

 '

root',
  version: 1,
  storage,
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})

let persistor = persistStore(store)

ReactDOM.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <App />
    </PersistGate>
  </Provider>,
  document.getElementById('root'),
)
```

此外，你可以通过在特定的 slice 中添加一个额外的 reducer 来清除任何持久化的状态，当调用 persistor.purge() 时，你希望清除的是在分派注销动作时的持久化状态。这在你希望清除持久化状态时特别有用。

```ts
import { PURGE } from "redux-persist";

...
extraReducers: (builder) => {
    builder.addCase(PURGE, (state) => {
        customEntityAdapter.removeAll(state);
    });
}
```

强烈建议将你配置的任何 api(s) 加入黑名单，如果 api slice reducer 没有被列入黑名单，api 缓存将被自动持久化和恢复，这可能会导致你的组件中出现不存在的幽灵订阅。配置这个应该看起来像这样：

```ts
const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  blacklist: [pokemonApi.reducerPath],
}
```

参见 [Redux Toolkit #121: 如何与 Redux-Persist 一起使用？](https://github.com/reduxjs/redux-toolkit/issues/121) 和 [Redux-Persist #988: 非序列化值错误](https://github.com/rt2zz/redux-persist/issues/988#issuecomment-552242978) 进一步讨论。

### 与 React-Redux-Firebase 一起使用

从 3.x 版本开始，RRF 在大多数动作和状态中都包含了时间戳值，但在 4.x 版本中可能有 PR 可以改进这种行为。

一个可能的配置，以适应这种行为可能如下所示：

```ts
import { configureStore } from '@reduxjs/toolkit'
import {
  getFirebase,
  actionTypes as rrfActionTypes,
} from 'react-redux-firebase'
import { constants as rfConstants } from 'redux-firestore'
import rootReducer from './rootReducer'

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          // 忽略所有 redux-firebase 和 react-redux-firebase 的动作类型
          ...Object.keys(rfConstants.actionTypes).map(
            (type) => `${rfConstants.actionsPrefix}/${type}`,
          ),
          ...Object.keys(rrfActionTypes).map(
            (type) => `@@reactReduxFirebase/${type}`,
          ),
        ],
        ignoredPaths: ['firebase', 'firestore'],
      },
      thunk: {
        extraArgument: {
          getFirebase,
        },
      },
    }),
})

export default store
```

