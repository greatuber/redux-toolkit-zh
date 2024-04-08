---
id: immer-reducers
title: 使用 Immer 编写 Reducers
sidebar_label: 使用 Immer 编写 Reducers
hide_title: true
---

&nbsp;

# 使用 Immer 编写 Reducers

Redux Toolkit 的 [`createReducer`](../api/createReducer.mdx) 和 [`createSlice`](../api/createSlice.mdx) 自动内部使用 [Immer](https://immerjs.github.io/immer/)，让你使用 "变异" 语法编写更简单的不可变更新逻辑。这有助于简化大多数 reducer 的实现。

因为 Immer 本身是一个抽象层，所以理解 Redux Toolkit 为什么使用 Immer，以及如何正确使用它是很重要的。

## 不可变性和 Redux

### 不可变性基础

"可变"意味着"可改变"。如果某物是"不可变的"，那么它永远不能被改变。

JavaScript 的对象和数组默认都是可变的。如果我创建一个对象，我可以改变其字段的内容。如果我创建一个数组，我也可以改变其内容：

```js
const obj = { a: 1, b: 2 }
// 对象外部仍然相同，但内容已经改变
obj.b = 3

const arr = ['a', 'b']
// 同样，我们可以改变这个数组的内容
arr.push('c')
arr[1] = 'd'
```

这被称为 _变异_ 对象或数组。它在内存中的引用仍然是同一个对象或数组，但现在对象内部的内容已经改变。

**为了以不可变的方式更新值，你的代码必须对现有的对象/数组进行 _复制_，然后修改副本**。

我们可以手动使用 JavaScript 的数组 / 对象扩展运算符，以及返回新数组副本的数组方法（而不是变异原始数组）来实现这一点：

```js
const obj = {
  a: {
    // 为了安全地更新 obj.a.c，我们必须复制每一部分
    c: 3,
  },
  b: 2,
}

const obj2 = {
  // 复制 obj
  ...obj,
  // 覆盖 a
  a: {
    // 复制 obj.a
    ...obj.a,
    // 覆盖 c
    c: 42,
  },
}

const arr = ['a', 'b']
// 创建一个新的 arr 副本，并在末尾添加 "c"
const arr2 = arr.concat('c')

// 或者，我们可以复制原始数组：
const arr3 = arr.slice()
// 然后变异副本：
arr3.push('c')
```

:::info 想了解更多？

有关 JavaScript 中不可变性的工作原理的更多信息，请参阅：

- [JavaScript 中的引用的视觉指南](https://daveceddia.com/javascript-references/)
- [React 和 Redux 中的不可变性：完全指南](https://daveceddia.com/react-redux-immutability-guide/)

:::

### Reducers 和不可变更新

Redux 的主要规则之一是，**我们的 reducers _永远_ 不允许变异原始/当前的状态值！**

:::warning

```js
// ❌ 非法 - 默认情况下，这将变异状态！
state.value = 123
```

:::

在 Redux 中不允许变异状态的原因有几个：

- 它会导致错误，例如 UI 无法正确更新以显示最新的值
- 它使理解状态如何以及为何被更新变得更困难
- 它使编写测试变得更困难
- 它破坏了正确使用 "时间旅行调试" 的能力
- 它违反了 Redux 的预期精神和使用模式

那么，如果我们不能改变原始值，我们应该如何返回更新的状态呢？

:::tip

**Reducers 只能对原始值进行 _复制_，然后他们可以变异副本。**

```js
// ✅ 这是安全的，因为我们做了一个副本
return {
  ...state,
  value: 123,
}
```

:::

我们已经看到，我们可以通过手动使用 JavaScript 的数组 / 对象扩展运算符和其他返回原始值副本的函数来编写不可变的更新。

当数据是嵌套的时候，这变得更难。**不可变更新的一个关键规则是，你必须对需要更新的 _每个_ 嵌套级别进行复制。**

这可能看起来像这样：

```js
function handwrittenReducer(state, action) {
  return {
    ...state,
    first: {
      ...state.first,
      second: {
        ...state.first.second,
        [action.someId]: {
          ...state.first.second[action.someId],
          fourth: action.someValue,
        },
      },
    },
  }
}
```

然而，如果你认为"手动编写这种方式的不可变更新看起来很难记住和正确做到"... 是的，你是对的！:)

手动编写不可变更新逻辑是困难的，而且 **在 reducers 中意外地变异状态是 Redux 用户最常犯的错误**。

## 使用 Immer 进行不可变更新

[Immer](https://immerjs.github.io/immer/) 是一个简化编写不可变更新逻辑的库。

Immer 提供了一个名为 `produce` 的函数，它接受两个参数：你的原始 `state` 和一个回调函数。回调函数会得到一个 "草稿" 版本的 state，在回调函数内部，可以安全地编写改变草稿值的代码。Immer 跟踪所有尝试改变草稿值的操作，然后使用它们的不可变等价物重放这些改变，以创建一个安全的、不可变更新的结果：

```js
import produce from 'immer'

const baseState = [
  {
    todo: 'Learn typescript',
    done: true,
  },
  {
    todo: 'Try immer',
    done: false,
  },
]

const nextState = produce(baseState, (draftState) => {
  // "改变" 草稿数组
  draftState.push({ todo: 'Tweet about it' })
  // "改变" 嵌套的 state
  draftState[1].done = true
})

console.log(baseState === nextState)
// false - 数组被复制了
console.log(baseState[0] === nextState[0])
// true - 第一个项目没有改变，所以引用相同
console.log(baseState[1] === nextState[1])
// false - 第二个项目被复制并更新了
```

### Redux Toolkit 和 Immer

Redux Toolkit 的 [`createReducer` API](../api/createReducer.mdx) 自动内部使用 Immer。所以，传递给 `createReducer` 的任何 case reducer 函数内部 "改变" state 都是安全的：

```js
const todosReducer = createReducer([], (builder) => {
  builder.addCase('todos/todoAdded', (state, action) => {
    // 通过调用 push() "改变" 数组
    state.push(action.payload)
  })
})
```

反过来，`createSlice` 内部使用 `createReducer`，所以在那里 "改变" state 也是安全的：

```js
const todosSlice = createSlice({
  name: 'todos',
  initialState: [],
  reducers: {
    todoAdded(state, action) {
      state.push(action.payload)
    },
  },
})
```

即使 case reducer 函数是在 `createSlice/createReducer` 调用之外定义的，这也适用。例如，你可以有一个可重用的 case reducer 函数，它期望 "改变" 它的 state，并根据需要包含它：

```js
const addItemToArray = (state, action) => {
  state.push(action.payload)
}

const todosSlice = createSlice({
  name: 'todos',
  initialState: [],
  reducers: {
    todoAdded: addItemToArray,
  },
})
```

这是因为 "改变" 逻辑在执行时被 Immer 的 `produce` 方法内部包装了。

:::caution

记住，**只有在 Immer 内部包装的 "改变" 逻辑才能正确工作！** 否则，那段代码 _将_ 真正改变数据。

:::

## Immer 使用模式

在 Redux Toolkit 中使用 Immer 时，有几种有用的模式需要了解，以及一些需要注意的陷阱。

### 改变和返回 State

Immer 通过跟踪尝试改变现有的草稿 state 值的操作来工作，无论是通过赋值给嵌套字段还是通过调用改变值的函数。这意味着 **`state` 必须是一个 JS 对象或数组，以便 Immer 看到尝试的改变**。（你仍然可以让一个 slice 的 state 是一个原始值，如字符串或布尔值，但由于原始值永远不能被改变，所以你只能返回一个新值。）

在任何给定的 case reducer 中，**Immer 期望你要么 _改变_ 现有的 state，要么自己构造一个新的 state 值并返回它，但在同一个函数中 _不要_ 同时做这两件事！** 例如，这两个都是与 Immer 一起的有效 reducer：

```js
const todosSlice = createSlice({
  name: 'todos',
  initialState: [],
  reducers: {
    todoAdded(state, action) {
      // "改变" 现有的 state，不需要返回值
      state.push(action.payload)
    },
    todoDeleted(state, action.payload) {
      // 不可变地构造一个新的结果数组并返回它
      return state.filter(todo => todo.id !== action.payload)
    }
  }
})
```

然而，_是_ 可以使用不可变更新来做部分工作，然后通过 "改变" 来保存结果。这可能是过滤嵌套数组的一个例子：

```js
const todosSlice = createSlice({
  name: 'todos',
  initialState: {todos: [], status: 'idle'}
  reducers: {
    todoDeleted(state, action.payload) {
      // 不可变地构造一个新数组
      const newTodos = state.todos.filter(todo => todo.id !== action.payload)
      // "改变" 现有的 state 来保存新数组
      state.todos = newTodos
    }
  }
})
```

注意，**在具有隐式返回的箭头函数中改变 state 会违反这个规则并导致错误！** 这是因为语句和函数调用可能返回一个值，Immer 看到了尝试的改变 _和_ 新返回的值，不知道哪个用作结果。一些可能的解决方案是使用 `void` 关键字来跳过返回值，或者使用大括号给箭头函数一个主体和没有返回值：

```js
const todosSlice = createSlice({
  name: 'todos',
  initialState: [],
  reducers: {
    // ❌ 错误：改变了 state，但也返回了新数组的大小！
    brokenReducer: (state, action) => state.push(action.payload),
    // ✅ 安全：`void` 关键字阻止了返回值
    fixedReducer1: (state, action) => void state.push(action.payload),
    // ✅ 安全：大括号使这成为一个函数体，没有返回值
    fixedReducer2: (state, action) => {
      state.push(action.payload)
    },
  },
})
```

虽然编写嵌套的不可变更新逻辑很难，但有时候，使用对象扩展操作一次更新多个字段，比分配单个字段更简单：

```js
function objectCaseReducer1(state, action) {
  const { a, b, c, d } = action.payload
  return {
    ...state,
    a,
    b,
    c,
    d,
  }
}

function objectCaseReducer2(state, action) {
  const { a, b, c, d } = action.payload
  // 这可以工作，但我们不断重复 `state.x =`
  state.a = a
  state.b = b
  state.c = c
  state.d = d
}
```

作为替代，你可以使用 `Object.assign` 一次改变多个字段，因为 `Object.assign` 总是改变它得到的第一个对象：

```js
function objectCaseReducer3(state, action) {
  const { a, b, c, d } = action.payload
  Object.assign(state, { a, b, c, d })
}
```

### 重置和替换状态

有时候，你可能想要替换整个现有的 `state`，可能是因为你加载了一些新的数据，或者你想要将状态重置回其初始值。

:::warning

**一个常见的错误是尝试直接赋值 `state = someValue`。这是行不通的！** 这只是将本地的 `state` 变量指向了一个不同的引用。这既没有改变内存中现有的 `state` 对象/数组，也没有返回一个全新的值，所以 Immer 不会做出任何实际的改变。

:::

相反，要替换现有的状态，你应该直接返回新的值：

```js
const initialState = []
const todosSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    brokenTodosLoadedReducer(state, action) {
      // ❌ 错误：并没有实际改变或返回任何新的东西！
      state = action.payload
    },
    fixedTodosLoadedReducer(state, action) {
      // ✅ 正确：返回一个新的值来替换旧的值
      return action.payload
    },
    correctResetTodosReducer(state, action) {
      // ✅ 正确：返回一个新的值来替换旧的值
      return initialState
    },
  },
})
```

### 调试和检查草稿状态

在 reducer 中记录正在更新的状态是很常见的，比如 `console.log(state)`。不幸的是，浏览器以一种难以阅读或理解的格式显示记录的 Proxy 实例：

![记录的代理草稿](/img/usage/immer-reducers/logged-proxy.png)

为了解决这个问题，[Immer 包含了一个 `current` 函数，它提取了包装数据的副本](https://immerjs.github.io/immer/current)，并且 RTK 重新导出了 `current`。如果你需要在你的 reducers 中记录或检查正在进行的状态，你可以使用这个：

```js
import { current } from '@reduxjs/toolkit'

const todosSlice = createSlice({
  name: 'todos',
  initialState: todosAdapter.getInitialState(),
  reducers: {
    todoToggled(state, action) {
      // ❌ 错误：记录了被 Proxy 包装的数据
      console.log(state)
      // ✅ 正确：记录了当前数据的普通 JS 副本
      console.log(current(state))
    },
  },
})
```

正确的输出应该像这样：

![记录的当前值](/img/usage/immer-reducers/logged-current-state.png)

Immer 还提供了 [`original` 和 `isDraft` 函数](https://immerjs.github.io/immer/original)，这些函数检索没有应用任何更新的原始数据，并检查给定的值是否是一个被 Proxy 包装的草稿。从 RTK 1.5.1 开始，这两个函数都被 RTK 重新导出。

### 更新嵌套数据

Immer 极大地简化了更新嵌套数据的过程。嵌套的对象和数组也被包装在 Proxies 和草稿中，可以安全地将嵌套的值提取到它自己的变量中，然后改变它。

然而，这仍然只适用于对象和数组。如果我们将一个原始值提取到它自己的变量中并尝试更新它，Immer 没有任何东西可以包装，也无法跟踪任何更新：

```js
const todosSlice = createSlice({
  name: 'todos',
  initialState: [],
  reducers: {
    brokenTodoToggled(state, action) {
      const todo = state.find((todo) => todo.id === action.payload)
      if (todo) {
        // ❌ 错误：Immer 无法跟踪对原始值的更新！
        let { completed } = todo
        completed = !completed
      }
    },
    fixedTodoToggled(state, action) {
      const todo = state.find((todo) => todo.id === action.payload)
      if (todo) {
        // ✅ 正确：这个对象仍然被包装在一个 Proxy 中，所以我们可以"改变"它
        todo.completed = !todo.completed
      }
    },
  },
})
```

这里有一个陷阱。[Immer 不会包装新插入到状态中的对象](https://immerjs.github.io/immer/pitfalls#data-not-originating-from-the-state-will-never-be-drafted)。大多数时候这不应该有问题，但可能有时候你想要插入一个值然后对它进行进一步的更新。

与此相关，RTK 的 [`createEntityAdapter` 更新函数](../api/createEntityAdapter.mdx#crud-functions)可以被用作独立的 reducers，或者"改变"更新函数。这些函数通过检查给定的状态是否被包装在一个草稿中来决定是否"改变"或返回一个新的值。如果你在 case reducer 中自己调用这些函数，确保你知道你传递的是一个草稿值还是一个普通值。

最后，值得注意的是，**Immer 不会自动为你创建嵌套的对象或数组 - 你必须自己创建它们**。例如，假设我们有一个包含嵌套数组的查找表，我们想要将一个项插入其中的一个数组。如果我们无条件地尝试插入而不检查该数组是否存在，当数组不存在时，逻辑会崩溃。相反，你需要先确保数组存在：

```js
const itemsSlice = createSlice({
  name: 'items',
  initialState: { a: [], b: [] },
  reducers: {
    brokenNestedItemAdded(state, action) {
      const { id, item } = action.payload
      // ❌ 错误：如果 `id` 没有对应的数组，会崩溃！
      state[id].push(item)
    },
    fixedNestedItemAdded(state, action) {
      const { id, item } = action.payload
      // ✅ 正确：首先确保嵌套的数组总是存在
      if (!state[id]) {
        state[id] = []
      }

      state[id].push(item)
    },
  },
})
```

### 对状态变异进行 lint

许多 ESLint 配置包含 https://eslint.org/docs/rules/no-param-reassign 规则，该规则可能也会警告对嵌套字段的变异。这可能导致该规则警告在 Immer-powered reducers 中对 `state` 的变异，这是不有帮助的。

为了解决这个问题，你可以告诉 ESLint 规则只在 slice 文件中忽略对名为 `state` 的参数的变异和赋值：

```js
// @filename .eslintrc.js
module.exports = {
  // 添加到你的 ESLint 配置定义
  overrides: [
    {
      // 随意替换为你喜欢的文件模式 - 例如 'src/**/*Slice.ts'
      files: ['src/**/*.slice.ts'],
      // 避免对 state 参数赋值
      rules: { 'no-param-reassign': ['error', { props: false }] },
    },
  ],
}
```

## 为什么内置 Immer

我们一直以来收到很多请求，希望让 Immer 成为 RTK 的 `createSlice` 和 `createReducer` API 的可选部分，而不是强制要求。

我们的回答总是一样的：**Immer 在 RTK 中是必需的，这一点不会改变**。

我们认为有必要解释一下，为什么我们认为 Immer 是 RTK 的关键部分，以及为什么我们不会让它变成可选。

### Immer 的优点

Immer 主要有两个优点。首先，**Immer 极大地简化了不可变更新逻辑**。[正确的不可变更新非常冗长](https://cn.redux.js.org/usage/structuring-reducers/immutable-update-patterns#updating-nested-objects)。这些冗长的操作总体上很难阅读，而且还掩盖了更新语句的实际意图。Immer 消除了所有嵌套的扩展和数组切片。不仅代码更短，更易于阅读，而且更清楚地表明了实际更新应该发生的情况。

其次，[编写正确的不可变更新是很难的](https://cn.redux.js.org/usage/structuring-reducers/immutable-update-patterns)，而且很容易犯错误（比如忘记复制对象扩展中的嵌套级别，复制顶级数组而不是数组内需要更新的项，或者忘记 `array.sort()` 会改变数组）。这就是为什么[意外的突变一直是 Redux bug 的最常见原因](https://cn.redux.js.org/faq/react-redux#why-isnt-my-component-re-rendering-or-my-mapstatetoprops-running)。**Immer 有效地消除了意外的突变**。不仅没有更多可以写错的扩展操作，而且 Immer 还会自动冻结状态。如果你确实意外地突变了，即使在 reducer 外部，也会抛出错误。**消除 Redux bug 的第一大原因是一个巨大的改进。**

此外，RTK Query 使用 Immer 的补丁功能来启用[乐观更新和手动缓存更新](../rtk-query/usage/manual-cache-updates.mdx)。

### 权衡和顾虑

像任何工具一样，使用 Immer 也有权衡，用户对使用它表达了许多顾虑。

Immer 确实增加了整体应用程序包的大小。它大约是 8K min，3.3K min+gz（参考：[Immer 文档：安装](https://immerjs.github.io/immer/installation)，[Bundle.js.org 分析](https://bundle.js.org/?q=immer&treeshake=[{default+as+produce+}])）。然而，这个库包的大小开始通过缩小你的应用中的 reducer 逻辑来为自己付费。此外，更易读的代码和消除突变 bug 的好处值得这个大小。

Immer 也在运行时性能上增加了一些开销。然而，[根据 Immer "性能" 文档页面，实践中的开销并不重要](https://immerjs.github.io/immer/performance/)。此外，[在 Redux 应用中，reducer 几乎从来不是性能瓶颈](https://github.com/reduxjs/redux-toolkit/issues/242#issuecomment-583296008)。相反，更新 UI 的成本更重要。

所以，虽然使用 Immer 不是"免费"的，但包和性能成本小到足以值得。

使用 Immer 最现实的痛点是，浏览器调试器以一种令人困惑的方式显示代理，这使得在调试时很难检查状态变量。这确实是一个烦恼。然而，这并不影响运行时行为，我们已经在这个页面上方[记录了使用 `current` 创建可视的普通 JS 数据版本的用法](#debugging-and-inspecting-drafted-state)。（鉴于像 Mobx 和 Vue 3 这样的库越来越广泛地使用代理，这也不是 Immer 独有的。）

另一个问题是教育和理解。Redux 一直要求在 reducer 中保持不变性，所以看到"突变"的代码可能会让人困惑。新的 Redux 用户可能会看到示例代码中的那些"突变"，认为这是 Redux 使用的正常情况，然后试图在 `createSlice` 外部做同样的事情。这确实会导致真正的突变和 bug，因为它超出了 Immer 包装更新的能力。

我们通过[在我们的文档中反复强调不变性的重要性](https://cn.redux.js.org/tutorials/essentials/part-1-overview-concepts#immutability)，包括多个强调[只有由于 Immer 的"魔法"，"突变"才能正确工作的部分](https://cn.redux.js.org/tutorials/essentials/part-2-app-structure#reducers-and-immutable-updates)，并添加了你现在正在阅读的这个特定文档页面来解决这个问题。

### 架构和意图

还有两个原因为什么 Immer 不是可选的。

一个是 RTK 的架构。`createSlice` 和 `createReducer` 是通过直接导入 Immer 来实现的。没有简单的方法来创建一个可能有一个假设的 `immer: false` 选项的版本。你不能做可选的导入，我们需要在应用程序的初始加载期间立即并同步地使用 Immer。

最后：**Immer 默认内置在 RTK 中，因为我们相信这是我们用户的最佳选择！** 我们希望我们的用户使用 Immer，并认为它是 RTK 的关键非可谈判组件。像简化 reducer 代码和防止意外突变这样的巨大好处，远远超过了相对较小的顾虑。

## 更多信息

请参阅 [Immer 文档](https://immerjs.github.io/immer/)，了解更多关于 Immer 的 API，边缘情况和行为的详细信息。

关于为什么需要 Immer 的历史讨论，请参阅以下问题：

- [RTK #5: 为什么在入门套件中需要 Immer？](https://github.com/reduxjs/redux-toolkit/issues/5)
- [RTK #183: 考虑添加一个选项来移除 Immer](https://github.com/reduxjs/redux-toolkit/issues/183)
- [RTK #242: 使 `createReducer` 的 `immer` 可选](https://github.com/reduxjs/redux-toolkit/issues/242)
