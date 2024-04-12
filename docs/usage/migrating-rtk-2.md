---
id: migrating-rtk-2
title: 迁移到 RTK 2.0 和 Redux 5.0
sidebar_label: 迁移到 RTK 2.0 和 Redux 5.0
hide_title: true
toc_max_heading_level: 4
---

&nbsp;

# 迁移到 RTK 2.0 和 Redux 5.0

:::tip 你将学到什么

- Redux Toolkit 2.0、Redux core 5.0、Reselect 5.0 和 Redux Thunk 3.0 中的变化，包括破坏性变化和新特性

:::

## 介绍

Redux Toolkit 自 2019 年以来一直可用，现在它是编写 Redux 应用的标准方式。我们已经过去了 4+ 年没有任何破坏性的变化。现在，RTK 2.0 给我们一个机会来现代化包装，清理已弃用的选项，并收紧一些边缘情况。

**Redux Toolkit 2.0 伴随着所有其他 Redux 包的主要版本：Redux core 5.0、React-Redux 9.0、Reselect 5.0 和 Redux Thunk 3.0**。

此页面列出了每个包中已知的可能的破坏性变化，以及 Redux Toolkit 2.0 中的新特性。作为提醒，**你实际上不应该需要直接安装或使用核心 `redux` 包** - RTK 包装了它，并重新导出所有方法和类型。

实际上，**大多数的 "破坏性" 变化不应该对最终用户产生实际效果，我们预计许多项目只需要更新包版本，需要的代码更改非常少**。

最有可能需要更新应用代码的变化是：

- [为 `createReducer` 和 `createSlice.extraReducers` 移除了对象语法](#object-syntax-for-createsliceextrareducers-and-createreducer-removed)
- [`configureStore.middleware` 必须是一个回调函数](#configurestoremiddleware-must-be-a-callback)
- [`Middleware` 类型已改变 - Middleware `action` 和 `next` 被类型化为 `unknown`](#middleware-type-changed---middleware-action-and-next-are-typed-as-unknown)

## 包装变化（全部）

我们对所有 Redux 相关库的构建包装进行了更新。这些技术上是 "破坏性的"，但 _应该_ 对最终用户透明，并实际上为诸如在 Node 下通过 ESM 文件使用 Redux 的场景提供了更好的支持。

#### 在 `package.json` 中添加 `exports` 字段

我们已经迁移了包定义，以包含 `exports` 字段，用于定义要加载的工件，以现代 ESM 构建为主要工件（为了兼容性目的仍然包含 CJS）。

我们已经对包进行了本地测试，但我们请求社区在你们自己的项目中试用这个，并报告你们发现的任何破坏！

#### 构建工件现代化

我们以几种方式更新了构建输出：

- **构建输出不再被转译！** 相反，我们针对现代 JS 语法（ES2020）
- 将所有构建工件移动到 `./dist/` 下，而不是分开的顶级文件夹
- 我们现在测试的最低 Typescript 版本是 **TS 4.7**。

#### 放弃 UMD 构建

Redux 一直都带有 UMD 构建工件。这些主要是为了直接作为脚本标签导入，例如在 CodePen 或无打包器构建环境中。

现在，我们从发布的包中删除了这些构建工件，理由是今天的使用案例似乎相当罕见。

我们确实有一个浏览器准备好的 ESM 构建工件，包含在 `dist/$PACKAGE_NAME.browser.mjs` 中，可以通过指向 Unpkg 上该文件的脚本标签来加载。

如果你有强烈的使用案例让我们继续包含 UMD 构建工件，请告诉我们！

## 破坏性变化

### 核心

#### Action 类型 _必须_ 是字符串

我们一直特别告诉我们的用户，[actions 和 state _必须_ 是可序列化的](https://cn.redux.js.org/style-guide/#do-not-put-non-serializable-values-in-state-or-actions)，并且 `action.type` _应该_ 是一个字符串。这既是为了确保 actions 是可序列化的，也是为了在 Redux DevTools 中提供一个可读的 action 历史。

`store.dispatch(action)` 现在特别强制 **`action.type` _必须_ 是一个字符串**，如果不是，就会抛出一个错误，就像如果 action 不是一个普通对象时它会抛出一个错误一样。

实际上，这已经在 99.99% 的时间内是真的，并且不应该对用户产生任何影响（特别是那些使用 Redux Toolkit 和 `createSlice` 的用户），但可能有一些旧的 Redux 代码库选择使用 Symbols 作为 action 类型。

#### `createStore` 废弃

在 [Redux 4.2.0 中，我们将原始的 `createStore` 方法标记为 `@deprecated`](https://github.com/reduxjs/redux/releases/tag/v4.2.0)。严格来说，**这 _不是_ 一个破坏性变化**，也不是 5.0 中的新特性，但我们在这里记录它以便完整性。

**这个废弃只是一个 _视觉_ 指示器，旨在鼓励用户 [将他们的应用从旧的 Redux 模式迁移到使用现代 Redux Toolkit API](https://cn.redux.js.org/usage/migrating-to-modern-redux)**。

废弃导致在导入和使用时出现 **视觉删除线**，如 **~~`createStore`~~**，但 **_没有_ 运行时错误或警告**。

**`createStore` 将继续无限期工作，并且 _不会_ 被移除**。但是，今天我们希望 _所有_ Redux 用户都使用 Redux Toolkit 来处理他们所有的 Redux 逻辑。

要解决这个问题，有三个选项：

- **[按照我们的强烈建议，切换到 Redux Toolkit 和 `configureStore`](https://cn.redux.js.org/usage/migrating-to-modern-redux)**
- 什么都不做。这只是一个视觉删除线，它不影响你的代码的行为。忽略它。
- 切换到使用现在导出的 `legacy_createStore` API，这是完全相同的函数，但没有 `@deprecated` 标签。最简单的选项是做一个别名导入重命名，如 `import { legacy_createStore as createStore } from 'redux'`

#### Typescript 重写

在2019年，我们开始了由社区驱动的将 Redux 代码库转换为 TypeScript 的工作。最初的努力在 [#3500: Port to TypeScript](https://github.com/reduxjs/redux/issues/3500) 中进行了讨论，并在 PR [#3536: Convert to TypeScript](https://github.com/reduxjs/redux/issues/3536) 中进行了整合。

然而，由于对可能与现有生态系统存在兼容性问题的担忧（以及我们的一般惰性），TS 转换后的代码在仓库中闲置了几年，未被使用和发布。

现在，Redux 核心 v5 是从那个 TS 转换的源代码构建的。理论上，这应该在运行时行为和类型上与 4.x 构建几乎相同，但很可能一些变化可能会导致类型问题。

请在 [Github](https://github.com/reduxjs/redux/issues) 上报告任何意外的兼容性问题！

#### `AnyAction` 已被 `UnknownAction` 取代

Redux 的 TS 类型一直都导出了一个 `AnyAction` 类型，它被定义为具有 `{type: string}` 并将任何其他字段视为 `any`。这使得编写像 `console.log(action.whatever)` 这样的用法变得容易，但不幸的是，它并未提供任何有意义的类型安全性。

我们现在导出一个 `UnknownAction` 类型，它将 `action.type` 以外的所有字段视为 `unknown`。这鼓励用户编写类型保护，检查动作对象并断言其 _特定_ 的 TS 类型。在这些检查中，你可以更安全地访问字段。

`UnknownAction` 现在是 Redux 源代码中期望一个动作对象的任何地方的默认值。

`AnyAction` 仍然存在以保持兼容性，但已被标记为已弃用。

请注意，[Redux Toolkit 的动作创建器有一个 `.match()` 方法](/redux-toolkit-zh/api/createAction#actioncreatormatch)，它充当了一个有用的类型保护：

```ts
if (todoAdded.match(someUnknownAction)) {
  // action 现在被类型化为 PayloadAction<Todo>
}
```

你还可以使用新的 `isAction` 工具来检查一个未知值是否是某种动作对象。

#### `Middleware` 类型已更改 - Middleware 的 `action` 和 `next` 被类型化为 `unknown`

以前，`next` 参数被类型化为传递的 `D` 类型参数，`action` 被类型化为从 dispatch 类型中提取的 `Action`。这两者都不是安全的假设：

- `next` 将被类型化为具有 **所有** dispatch 扩展，包括那些在链中较早的不再适用的扩展。
  - 技术上，将 `next` 类型化为基础 redux 存储实现的默认 Dispatch 是 _大部分_ 安全的，然而这将导致 `next(action)` 出错（因为我们不能保证 `action` 实际上是一个 `Action`） - 并且它不会考虑到任何后续的中间件，它们在看到特定动作时返回的不是它们给出的动作。
- `action` 不一定是一个已知的动作，它可以是任何东西 - 例如，一个 thunk 将是一个没有 `.type` 属性的函数（所以 `AnyAction` 将是不准确的）

我们已经将 `next` 更改为 `(action: unknown) => unknown`（这是准确的，我们不知道 `next` 期望或将返回什么），并将 `action` 参数更改为 `unknown`（如上所述，这是准确的）。

为了安全地与 `action` 参数中的值进行交互或访问字段，你必须首先进行类型保护检查以缩小类型，如 `isAction(action)` 或 `someActionCreator.match(action)`。

这种新类型与 v4 的 `Middleware` 类型不兼容，所以如果一个包的中间件说它不兼容，检查它从哪个版本的 Redux 获取其类型！（参见本页后面的 [覆盖依赖项](#overriding-dependencies)。）

#### `PreloadedState` 类型已被 `Reducer` 泛型取代

我们对 TS 类型进行了调整以提高类型安全性和行为。

首先，`Reducer` 类型现在有一个可能的 `PreloadedState` 泛型：

```ts
type Reducer<S, A extends Action, PreloadedState = S> = (
  state: S | PreloadedState | undefined,
  action: A,
) => S
```

根据 [#4491](https://github.com/reduxjs/redux/pull/4491) 中的解释：

为什么需要这个变化？当通过 `createStore`/`configureStore` 首次创建存储时，初始状态被设置为传递的 `preloadedState` 参数（如果没有传递任何东西，则为 `undefined`）。这意味着，当 reducer 首次被调用时，它被传递的是 `preloadedState`。在第一次调用之后，reducer 总是传递当前状态（即 `S`）。

对于大多数正常的 reducer，`S | undefined` 准确地描述了可以传入 `preloadedState` 的内容。然而 `combineReducers` 函数允许预加载状态为 `Partial<S> | undefined`。

解决方案是有一个单独的泛型，代表 reducer 接受其预加载状态。这样 `createStore` 就可以使用该泛型作为其 `preloadedState` 参数。

以前，这是由 `$CombinedState` 类型处理的，但那复杂化了事情，并导致了一些用户报告的问题。这消除了对 `$CombinedState` 的全部需要。

这个变化确实包括一些破坏性的变化，但总体上对于在用户领域升级的用户应该没有太大影响：

- `Reducer`，`ReducersMapObject`，和 `createStore`/`configureStore` 类型/函数接受一个额外的 `PreloadedState` 泛型，它默认为 `S`。
- `combineReducers` 的重载被移除，取而代之的是一个单一的函数定义，它将 `ReducersMapObject` 作为其泛型参数。这些变化必须移除重载，因为有时它会选择错误的重载。
- 明确列出 reducer 泛型的增强器需要添加第三个泛型。

### 仅限 Toolkit

#### 移除了 `createSlice.extraReducers` 和 `createReducer` 的对象语法

RTK 的 `createReducer` API 最初被设计为接受一个动作类型字符串到案例 reducer 的查找表，如 `{ "ADD_TODO": (state, action) => {} }`。我们后来添加了 "builder callback" 形式，以便在添加 "matchers" 和默认处理器时提供更多的灵活性，并对 `createSlice.extraReducers` 做了同样的处理。

我们在 RTK 2.0 中移除了 `createReducer` 和 `createSlice.extraReducers` 的 "object" 形式，因为 builder callback 形式实际上是相同数量的代码行，并且与 TypeScript 一起工作得更好。

例如，这样：

```ts
const todoAdded = createAction('todos/todoAdded')

createReducer(initialState, {
  [todoAdded]: (state, action) => {},
})

createSlice({
  name,
  initialState,
  reducers: {
     /* 这里是案例 reducer */
  },
  extraReducers: {
    [todoAdded]: (state, action) => {},
  },
})
```

应迁移到：

```ts
createReducer(initialState, (builder) => {
  builder.addCase(todoAdded, (state, action) => {})
})

createSlice({
  name,
  initialState,
  reducers: {
    /* 这里是案例 reducer */
  },
  extraReducers: (builder) => {
    builder.addCase(todoAdded, (state, action) => {})
  },
})
```

##### Codemods

为了简化代码库的升级，我们发布了一套 codemods，它们会自动将已弃用的 "object" 语法转换为等效的 "builder" 语法。

codemods 包在 NPM 上以 [`@reduxjs/rtk-codemods`](https://www.npmjs.com/package/@reduxjs/rtk-codemods) 的形式提供。更多详情请参阅[这里](../api/codemods)。

要在您的代码库中运行 codemods，请运行 `npx @reduxjs/rtk-codemods <TRANSFORM NAME> path/of/files/ or/some**/*glob.js.`

示例：

```sh
npx @reduxjs/rtk-codemods createReducerBuilder ./src

npx @reduxjs/rtk-codemods createSliceBuilder ./packages/my-app/**/*.ts
```

我们还建议在提交更改之前重新运行 Prettier。

这些 codemods 应该可以工作，但我们非常欢迎来自更多实际代码库的反馈！

#### `configureStore.middleware` 必须是回调函数

从一开始，`configureStore` 就接受了一个直接的数组值作为 `middleware` 选项。然而，直接提供一个数组会阻止 `configureStore` 调用 `getDefaultMiddleware()`。所以，`middleware: [myMiddleware]` 意味着没有添加 thunk 中间件（或任何开发模式检查）。

这是一个陷阱，我们有很多用户不小心这样做，导致他们的应用程序失败，因为默认的中间件从未被配置。

因此，我们现在只让 `middleware` 接受回调形式。_如果_ 由于某种原因你仍然想要替换 _所有_ 内置的中间件，可以通过从回调中返回一个数组来实现：

```ts
const store = configureStore({
  reducer,
  middleware: (getDefaultMiddleware) => {
    // 警告：这意味着 _没有_ 默认的中间件被添加！
    return [myMiddleware]
    // 或者对于 TS 用户，使用：
    // return new Tuple(myMiddleware)
  },
})
```

但请注意，**我们始终建议不要完全替换默认的中间件**，你应该使用 `return getDefaultMiddleware().concat(myMiddleware)`。

#### `configureStore.enhancers` 必须是回调函数

与 `configureStore.middleware` 类似，`enhancers` 字段也必须是回调函数，原因相同。

回调函数将接收一个 `getDefaultEnhancers` 函数，可以用来自定义批处理增强器[现在默认包含](#configurestore-adds-autobatchenhancer-by-default)。

例如：

```ts
const store = configureStore({
  reducer,
  enhancers: (getDefaultEnhancers) => {
    return getDefaultEnhancers({
      autoBatch: { type: 'tick' },
    }).concat(myEnhancer)
  },
})
```

重要的是要注意，`getDefaultEnhancers` 的结果将**也**包含用任何配置的/默认的中间件创建的中间件增强器。为了防止错误，如果提供了中间件并且在回调结果中没有包含中间件增强器，`configureStore` 将在控制台中记录一个错误。

```ts
const store = configureStore({
  reducer,
  enhancers: (getDefaultEnhancers) => {
    return [myEnhancer] // 我们在这里丢失了中间件
    // 替代方案：
    return getDefaultEnhancers().concat(myEnhancer)
  },
})
```

#### 独立的 `getDefaultMiddleware` 和 `getType` 已被移除

独立版本的 `getDefaultMiddleware` 自 v1.6.1 起已被弃用，并已被移除。请使用传递给 `middleware` 回调的函数，它具有正确的类型。

我们还移除了 `getType` 导出，它用于从用 `createAction` 创建的动作创建器中提取类型字符串。相反，使用静态属性 `actionCreator.type`。

#### RTK Query 行为变化

我们收到了一些报告，其中 RTK Query 在使用 `dispatch(endpoint.initiate(arg, {subscription: false}))` 时遇到了问题。还有报告说多个触发的懒查询在错误的时间解析了 promises。这两者都有相同的底层问题，即 RTKQ 在这些情况下没有跟踪缓存条目（有意为之）。我们重新设计了逻辑，始终跟踪缓存条目（并在需要时删除它们），这应该解决了这些行为问题。

我们还收到了关于尝试连续运行多个突变以及标签失效行为如何的问题。RTKQ 现在有内部逻辑来短暂延迟标签失效，以允许多个失效一起处理。这由 `createApi` 上的新 `invalidationBehavior: 'immediate' | 'delayed'` 标志控制。新的默认行为是 `'delayed'`。将其设置为 `'immediate'` 以恢复到 RTK 1.9 中的行为。

在 RTK 1.9 中，我们重新设计了 RTK Query 的内部结构，将大部分订阅状态保留在 RTKQ 中间件中。这些值仍然与 Redux 存储状态同步，但这主要是为了由 Redux DevTools "RTK Query" 面板显示。与上述缓存条目更改相关，我们优化了这些值同步到 Redux 状态的频率，以提高性能。

#### `reactHooksModule` 自定义钩子配置

以前，React Redux 的自定义版本钩子（`useSelector`，`useDispatch` 和 `useStore`）可以分别传递给 `reactHooksModule`，通常是为了使用与默认的 `ReactReduxContext` 不同的上下文。

实际上，react hooks 模块需要提供所有三个这些钩子，而只传递 `useSelector` 和 `useDispatch`，而不是 `useStore`，很容易出错。

该模块现在已将这三个钩子都移到了同一个配置键下，并且如果该键存在，将检查是否都提供了所有三个钩子。

```ts
// 以前
const customCreateApi = buildCreateApi(
  coreModule(),
  reactHooksModule({
    useDispatch: createDispatchHook(MyContext),
    useSelector: createSelectorHook(MyContext),
    useStore: createStoreHook(MyContext),
  }),
)

// 现在
const customCreateApi = buildCreateApi(
  coreModule(),
  reactHooksModule({
    hooks: {
      useDispatch: createDispatchHook(MyContext),
      useSelector: createSelectorHook(MyContext),
      useStore: createStoreHook(MyContext),
    },
  }),
)
```

#### 错误消息提取

Redux 4.1.0 通过[从生产构建中提取错误消息字符串](https://github.com/reduxjs/redux/releases/tag/v4.1.0)来优化其包大小，这种方法基于 React 的方法。我们已将同样的技术应用到 RTK 上。这大约可以从生产包中节省 1000 字节（实际效益将取决于正在使用哪些导入）。



#### `configureStore` 中 `middleware` 的字段顺序很重要

如果你同时传递 `middleware` 和 `enhancers` 字段给 `configureStore`，那么 `middleware` 字段 _必须_ 首先出现，以便内部 TS 推断能够正确工作。

#### 非默认的中间件/增强器必须使用 `Tuple`

我们已经看到许多用户在将 `middleware` 参数传递给 configureStore 时尝试展开 `getDefaultMiddleware()` 返回的数组，或者传递一个替代的普通数组。不幸的是，这会丢失来自单个中间件的确切 TS 类型，并且通常会导致后续的 TS 问题（例如 `dispatch` 被类型化为 `Dispatch<AnyAction>` 并且不知道关于 thunks 的信息）。

`getDefaultMiddleware()` 已经使用了一个内部的 `MiddlewareArray` 类，这是一个 `Array` 子类，它具有强类型的 `.concat/prepend()` 方法，用于正确捕获并保留中间件类型。

我们已经将该类型重命名为 `Tuple`，并且 `configureStore` 的 TS 类型现在要求你 _必须_ 使用 `Tuple`，如果你想传递你自己的中间件数组：

```ts
import { configureStore, Tuple } from '@reduxjs/toolkit'

configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => new Tuple(additionalMiddleware, logger),
})
```

（注意，如果你使用纯 JS 的 RTK，这将没有影响，你仍然可以在这里传递一个普通数组。）

这种同样的限制也适用于 `enhancers` 字段。

#### 实体适配器类型更新

`createEntityAdapter` 现在有一个 `Id` 泛型参数，它将被用于强类型化任何地方暴露的项目 ID。以前，ID 字段类型总是 `string | number`。TS 现在将尝试从你的实体类型的 `.id` 字段或 `selectId` 返回类型中推断出确切的类型。你也可以选择回退到直接传递那个泛型类型。**如果你直接使用 `EntityState<Data, Id>` 类型，你 _必须_ 提供两个泛型参数！**

`.entities` 查找表现在被定义为使用标准的 TS `Record<Id, MyEntityType>`，它默认假设每个项目查找都存在。以前，它使用了一个 `Dictionary<MyEntityType>` 类型，该类型假设结果是 `MyEntityType | undefined`。`Dictionary` 类型已被移除。

如果你更喜欢假设查找 _可能_ 是未定义的，使用 TypeScript 的 `noUncheckedIndexedAccess` 配置选项来控制。


### Reselect

#### `createSelector` 默认使用 `weakMapMemoize` 作为 Memoizer

**`createSelector` 现在使用一个新的默认 memoization 函数，称为 `weakMapMemoize`**。这个 memoizer 提供了一个实际上无限的缓存大小，这应该简化了对不同参数的使用，但是完全依赖于引用比较。

如果你需要自定义等式比较，自定义 `createSelector` 以使用原始的 `lruMemoize` 方法：

```ts no-emit
createSelector(inputs, resultFn, {
  memoize: lruMemoize,
  memoizeOptions: { equalityCheck: yourEqualityFunction },
})
```

#### `defaultMemoize` 重命名为 `lruMemoize`

由于原始的 `defaultMemoize` 函数实际上不再是默认的，我们已经将其重命名为 `lruMemoize` 以便清晰。这只有在你特别将其导入到你的应用程序中以自定义选择器时才有关系。

#### `createSelector` 开发模式检查

`createSelector` 现在在开发模式中进行常见错误的检查，比如总是返回新引用的输入选择器，或者立即返回其参数的结果函数。这些检查可以在选择器创建或全局进行自定义。

这很重要，因为一个输入选择器返回一个与相同参数材质不同的结果意味着输出选择器将永远不会正确地 memoize 并且会不必要地运行，从而（可能）创建一个新的结果并导致重新渲染。

```ts
const addNumbers = createSelector(
  // 这个输入选择器将总是在运行时返回一个新的引用
  // 所以缓存将永远不会被使用
  (a, b) => ({ a, b }),
  ({ a, b }) => ({ total: a + b }),
)
// 相反，你应该为每个稳定的数据片段有一个输入选择器
const addNumbersStable = createSelector(
  (a, b) => a,
  (a, b) => b,
  (a, b) => ({
    total: a + b,
  }),
)
```

这是在第一次调用选择器时完成的，除非配置了其他方式。更多细节可以在 [Reselect docs on dev-mode checks](/redux-toolkit-zh/reselect/api/development-only-stability-checks) 中找到。

请注意，虽然 RTK 重新导出了 `createSelector`，但它故意没有重新导出全局配置此检查的函数 - 如果你希望这样做，你应该直接依赖 `reselect` 并自己导入它。


#### `ParametricSelector` 类型已移除

已经移除了 `ParametricSelector` 和 `OutputParametricSelector` 类型。请改用 `Selector` 和 `OutputSelector`。


### React-Redux

#### 需要 React 18

React-Redux v7 和 v8 与所有支持 hooks 的 React 版本（16.8+，17 和 18）都兼容。v8 从内部订阅管理切换到 React 的新 `useSyncExternalStore` hook，但使用了 "shim" 实现以支持没有内置该 hook 的 React 16.8 和 17。

**React-Redux v9 切换到 _需要_ React 18，并且 _不支持_ React 16 或 17**。这使我们能够删除 shim 并节省一小部分包大小。


#### 自定义上下文类型

React Redux 支持使用[自定义上下文](https://cn.react-redux.js.org/api/hooks#custom-context)创建 `hooks`（和 `connect`），但是这种类型化一直相当非标准。在 v9 之前的类型需要 `Context<ReactReduxContextValue>`，但是上下文默认值通常会初始化为 `null`（因为 hooks 使用它来确保它们实际上有一个提供的上下文）。在"最好"的情况下，这会导致如下所示的结果：

```ts title="Pre-v9 custom context"
import { createContext } from 'react'
import {
    ReactReduxContextValue,
    createDispatchHook,
    createSelectorHook,
    createStoreHook,
} from 'react-redux'
import { AppStore, RootState, AppDispatch } from './store'

// highlight-next-line
const context = createContext<ReactReduxContextValue>(null as any)

export const useStore = createStoreHook(context).withTypes<AppStore>()
export const useDispatch = createDispatchHook(context).withTypes<AppDispatch>()
export const useSelector = createSelectorHook(context).withTypes<RootState>()
```

在 v9 中，类型现在匹配运行时行为。上下文被类型化为持有 `ReactReduxContextValue | null`，并且 hooks 知道如果它们接收到 `null`，它们会抛出错误，所以它不影响返回类型。

上述示例现在变为：

```ts title="v9+ custom context"
import { createContext } from 'react'
import {
    ReactReduxContextValue,
    createDispatchHook,
    createSelectorHook,
    createStoreHook,
} from 'react-redux'
import { AppStore, RootState, AppDispatch } from './store'

// highlight-next-line
const context = createContext<ReactReduxContextValue | null>(null)

export const useStore = createStoreHook(context).withTypes<AppStore>()
export const useDispatch = createDispatchHook(context).withTypes<AppDispatch>()
export const useSelector = createSelectorHook(context).withTypes<RootState>()
```

### Redux Thunk

#### Thunk 使用命名导出

`redux-thunk` 包以前使用了一个单一的默认导出，这是中间件，带有一个名为 `withExtraArgument` 的附加字段，允许自定义。

默认导出已被移除。现在有两个命名导出：`thunk`（基本中间件）和 `withExtraArgument`。

如果你正在使用 Redux Toolkit，这应该没有影响，因为 RTK 已经在 `configureStore` 内部处理了这个。

## 新特性

这些特性是 Redux Toolkit 2.0 的新特性，帮助覆盖我们在生态系统中看到用户请求的额外用例。

### `combineSlices` API 与切片 reducer 注入用于代码分割

Redux 核心一直包含 `combineReducers`，它接受一个充满 "切片 reducer" 函数的对象，并生成一个调用这些切片 reducers 的 reducer。RTK 的 `createSlice` 生成切片 reducers + 相关的 action creators，我们已经教授了导出单个 action creators 作为命名导出和切片 reducer 作为默认导出的模式。同时，我们从未对懒加载 reducers 有过官方支持，尽管我们在我们的文档中有一些 "reducer 注入" 模式的[示例代码](https://cn.redux.js.org/usage/code-splitting)。

此版本包含一个新的 [`combineSlices`](../api/combineSlices) API，旨在在运行时启用 reducers 的懒加载。它接受单个切片或一个充满切片的对象作为参数，并自动调用 `combineReducers`，使用 `sliceObject.name` 字段作为每个状态字段的键。生成的 reducer 函数有一个额外的 `.inject()` 方法附加，可以用来在运行时动态注入额外的切片。它还包括一个 `.withLazyLoadedSlices()` 方法，可以用来为稍后添加的 reducers 生成 TS 类型。参见 [#2776](https://github.com/reduxjs/redux-toolkit/issues/2776) 以获取关于这个想法的原始讨论。

目前，我们没有将这个构建到 `configureStore` 中，所以你需要自己调用 `const rootReducer = combineSlices(.....)` 并将其传递给 `configureStore({reducer: rootReducer})`。

**基本使用：将切片和独立的 reducers 混合传递给 `combineSlices`**

```ts
const stringSlice = createSlice({
    name: 'string',
    initialState: '',
    reducers: {},
})

const numberSlice = createSlice({
    name: 'number',
    initialState: 0,
    reducers: {},
})

const booleanReducer = createReducer(false, () => {})

const api = createApi(/*  */)

const combinedReducer = combineSlices(
    stringSlice,
    {
        num: numberSlice.reducer,
        boolean: booleanReducer,
    },
    api,
)
expect(combinedReducer(undefined, dummyAction())).toEqual({
    string: stringSlice.getInitialState(),
    num: numberSlice.getInitialState(),
    boolean: booleanReducer.getInitialState(),
    api: api.reducer.getInitialState(),
})
```

**基本的切片 reducer 注入**

```ts
// 创建一个 reducer，其 TS 类型知道 `numberSlice` 将被注入
const combinedReducer =
    combineSlices(stringSlice).withLazyLoadedSlices<
        WithSlice<typeof numberSlice>
    >()

// `state.number` 最初不存在
expect(combinedReducer(undefined, dummyAction()).number).toBe(undefined)

// 创建一个带有 `numberSlice` 注入的 reducer 版本（主要用于类型）
const injectedReducer = combinedReducer.inject(numberSlice)

// `state.number` 现在存在，且 injectedReducer 的类型不再将其标记为可选
expect(injectedReducer(undefined, dummyAction()).number).toBe(
    numberSlice.getInitialState(),
)

// 原始 reducer 也已被改变（类型仍然是可选的）
expect(combinedReducer(undefined, dummyAction()).number).toBe(
    numberSlice.getInitialState(),
)
```

### `createSlice` 中的 `selectors` 字段

现有的 `createSlice` API 现在支持直接作为切片的一部分定义 [`selectors`](../api/createSlice#selectors)。默认情况下，这些将假定切片在根状态下挂载，使用 `slice.name` 作为字段，例如 `name: "todos"` -> `rootState.todos`。此外，现在有一个 `slice.selectSlice` 方法，它执行默认的根状态查找。

你可以调用 `sliceObject.getSelectors(selectSliceState)` 来生成带有替代位置的选择器，类似于 `entityAdapter.getSelectors()` 的工作方式。

```ts
const slice = createSlice({
    name: 'counter',
    initialState: 42,
    reducers: {},
    selectors: {
        selectSlice: (state) => state,
        selectMultiple: (state, multiplier: number) => state * multiplier,
    },
})

// 基本使用
const testState = {
    [slice.name]: slice.getInitialState(),
}
const { selectSlice, selectMultiple } = slice.selectors
expect(selectSlice(testState)).toBe(slice.getInitialState())
expect(selectMultiple(testState, 2)).toBe(slice.getInitialState() * 2)

// 使用切片 reducer 挂载在不同的键下
const customState = {
    number: slice.getInitialState(),
}
const { selectSlice, selectMultiple } = slice.getSelectors(
    (state: typeof customState) => state.number,
)
expect(selectSlice(customState)).toBe(slice.getInitialState())
expect(selectMultiple(customState, 2)).toBe(slice.getInitialState() * 2)
```

### `createSlice.reducers` 回调语法和 thunk 支持

我们收到的最早的功能请求之一是能够直接在 `createSlice` 中声明 thunks。到目前为止，你总是需要单独声明它们，给 thunk 一个字符串动作前缀，并通过 `createSlice.extraReducers` 处理动作：

```ts
// 单独声明 thunk
const fetchUserById = createAsyncThunk(
  'users/fetchByIdStatus',
  async (userId: number, thunkAPI) => {
    const response = await userAPI.fetchById(userId)
    return response.data
  },
)

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    // 标准

的

 reducer 逻辑，每个 reducer 都自动生成动作类型
  },
  extraReducers: (builder) => {
    // 在这里添加额外的动作类型的 reducers，并根据需要处理加载状态
    builder.addCase(fetchUserById.fulfilled, (state, action) => {
      state.entities.push(action.payload)
    })
  },
})
```

许多用户告诉我们，这种分离感觉很尴尬。

我们一直_希望_能够包含一种方式，直接在 `createSlice` 中定义 thunks，并且已经尝试了各种原型。总是有两个主要的阻碍问题，和一个次要的关注点：

1. 不清楚在内部声明 thunk 应该看起来像什么样的语法。
2. Thunks 可以访问 `getState` 和 `dispatch`，但 `RootState` 和 `AppDispatch` 类型通常是从 store 中推断出来的，而 store 又从 slice state 类型中推断出来。在 `createSlice` 中声明 thunks 会导致循环类型推断错误，因为 store 需要 slice 类型，但 slice 需要 store 类型。我们不愿意发布一个 API，对我们的 JS 用户来说工作得还可以，但对我们的 TS 用户来说却不行，尤其是我们_希望_人们使用 TS 和 RTK。
3. 你不能在 ES 模块中进行同步条件导入，并且没有好的方式来使 `createAsyncThunk` 导入变为可选。要么 `createSlice` 总是依赖它（并将其添加到包大小中），要么就不能完全使用 `createAsyncThunk`。

我们已经达成了以下妥协：

- **为了使用 `createSlice` 创建异步 thunks，你特别需要[设置一个有权访问 `createAsyncThunk` 的 `createSlice` 的自定义版本](../api/createSlice#createasyncthunk)**。
- 你可以在 `createSlice.reducers` 中声明 thunks，通过使用一个类似于 RTK Query 的 `createApi` 中的 `build` 回调语法的 "creator callback" 语法来创建 `reducers` 字段（使用类型化的函数来在对象中创建字段）。这样做看起来确实与现有的 `reducers` 字段的 "对象" 语法有些不同，但仍然相当相似。
- 你可以自定义 `createSlice` 中 thunks 的_一些_类型，但你_不能_自定义 `state` 或 `dispatch` 类型。如果需要这些，你可以手动进行 `as` 转换，如 `getState() as RootState`。

实际上，我们希望这些是合理的妥协。在 `createSlice` 中创建 thunks 的需求很广泛，所以我们认为这是一个会被使用的 API。如果 TS 自定义选项是一个限制，你仍然可以像以前一样在 `createSlice` 外部声明 thunks，而且大多数异步 thunks 不需要 `dispatch` 或 `getState` - 它们只是获取数据并返回。最后，设置一个自定义的 `createSlice` 允许你选择是否将 `createAsyncThunk` 包含在你的包大小中（尽管如果直接使用或作为 RTK Query 的一部分使用，它可能已经被包含在内 - 在这些情况下，没有_额外_的包大小）。

以下是新的回调语法看起来的样子：

```ts
const createAppSlice = buildCreateSlice({
  creators: { asyncThunk: asyncThunkCreator },
})

const todosSlice = createAppSlice({
  name: 'todos',
  initialState: {
    loading: false,
    todos: [],
    error: null,
  } as TodoState,
  reducers: (create) => ({
    // 一个正常的 "case reducer"，和以前一样
    deleteTodo: create.reducer((state, action: PayloadAction<number>) => {
      state.todos.splice(action.payload, 1)
    }),
    // 一个带有 "prepare callback" 的 case reducer，用于自定义动作
    addTodo: create.preparedReducer(
      (text: string) => {
        const id = nanoid()
        return { payload: { id, text } }
      },
      // 动作类型是从 prepare callback 中推断出来的
      (state, action) => {
        state.todos.push(action.payload)
      },
    ),
    // 一个异步 thunk
    fetchTodo: create.asyncThunk(
      // 异步负载函数作为第一个参数
      async (id: string, thunkApi) => {
        const res = await fetch(`myApi/todos?id=${id}`)
        return (await res.json()) as Item
      },
      // 包含 `{pending?, rejected?, fulfilled?, settled?, options?}` 的对象作为第二个参数
      {
        pending: (state) => {
          state.loading = true
        },
        rejected: (state, action) => {
          state.error = action.payload ?? action.error
        },
        fulfilled: (state, action) => {
          state.todos.push(action.payload)
        },
        // settled 会在 rejected 和 fulfilled 动作都被调用
        settled: (state, action) => {
          state.loading = false
        },
      },
    ),
  }),
})

// `addTodo` 和 `deleteTodo` 是正常的动作创建者。
// `fetchTodo` 是异步 thunk
export const { addTodo, deleteTodo, fetchTodo } = todosSlice.actions
```

#### Codemod

**使用新的回调语法完全是可选的（对象语法仍然是标准的）**，但是现有的 slice 需要在它可以利用这种语法提供的新功能之前进行转换。为了使这更容易，提供了一个 [codemod](../api/codemods)。

```sh
npx @reduxjs/rtk-codemods createSliceReducerBuilder ./src/features/todos/slice.ts
```

### "动态中间件"中间件

Redux存储的中间件管道在创建存储时固定，后续无法更改。我们_已经_看到生态系统库试图允许动态添加和删除中间件，这对于代码分割等可能有用。

这是一个相对小众的用例，但我们已经构建了[我们自己版本的"动态中间件"中间件](../api/createDynamicMiddleware)。在设置Redux存储时将其添加，它允许您在运行时后添加中间件。它还带有一个[React hook集成，将自动向存储添加中间件并返回更新的dispatch方法。](../api/createDynamicMiddleware#react-integration)。

```ts
import { createDynamicMiddleware, configureStore } from '@reduxjs/toolkit'

const dynamicMiddleware = createDynamicMiddleware()

const store = configureStore({
  reducer: {
    todos: todosReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(dynamicMiddleware.middleware),
})

// later
dynamicMiddleware.addMiddleware(someOtherMiddleware)
```

### `configureStore`默认添加`autoBatchEnhancer`

[在v1.9.0中，我们添加了一个新的`autoBatchEnhancer`](https://github.com/reduxjs/redux-toolkit/releases/tag/v1.9.0)，当连续派发多个"低优先级"动作时，它会稍微延迟通知订阅者。这提高了性能，因为UI更新通常是更新过程中最昂贵的部分。RTK Query默认将其大部分自身的内部动作标记为"低优先级"，但您必须将`autoBatchEnhancer`添加到存储中才能从中受益。

我们已经更新了`configureStore`，默认在存储设置中添加`autoBatchEnhancer`，这样用户可以在不需要手动调整存储配置的情况下受益于改进的性能。

### `entityAdapter.getSelectors`接受一个`createSelector`函数

[`entityAdapter.getSelectors()`](../api/createEntityAdapter#selector-functions)现在接受一个选项对象作为其第二个参数。这允许您传入自己首选的`createSelector`方法，该方法将用于记忆生成的选择器。如果您想使用Reselect的新的备用记忆器之一，或者具有等效签名的其他记忆库，这可能会很有用。

### Immer 10.0

[Immer 10.0](https://github.com/immerjs/immer/releases/tag/v10.0.0)现在已经最终确定，并有几个主要的改进和更新：

- 更快的更新性能
- 更小的包大小
- 更好的ESM/CJS包格式
- 没有默认导出
- 没有ES5回退

我们已经更新了RTK以依赖最终的Immer 10.0版本。

### Next.js设置指南

我们现在有一个文档页面，涵盖了[如何正确设置Next.js与Redux](https://cn.redux.js.org/usage/nextjs)。我们看到了很多关于使用Redux、Next和App Router的问题，这个指南应该可以提供帮助。

（目前，Next.js的`with-redux`示例仍然显示过时的模式 - 我们将很快提交一个PR来更新它以匹配我们的文档指南。）

## 覆盖依赖

更新包的对等依赖以允许Redux core 5.0需要一段时间，在此期间，像[中间件类型](#middleware-type-changed---middleware-action-and-next-are-typed-as-unknown)这样的更改将导致感知的不兼容性。

大多数库可能实际上没有与5.0不兼容的实践，但由于对4.0的对等依赖，它们最终拉入了旧的类型声明。

这可以通过手动覆盖依赖解析来解决，这是`npm`和`yarn`都支持的。

### `npm` - `overrides`

NPM通过`package.json`中的[`overrides`](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#overrides)字段支持这一点。您可以覆盖特定包的依赖，或确保每个拉入Redux的包都收到相同的版本。

```json title="Individual override - redux-persist"
{
  "overrides": {
    "redux-persist": {
      "redux": "^5.0.0"
    }
  }
}
```

```json title="Blanket override"
{
  "overrides": {
    "redux": "^5.0.0"
  }
}
```

### `yarn` - `resolutions`

Yarn通过`package.json`中的[`resolutions`](https://classic.yarnpkg.com/lang/en/docs/selective-version-resolutions/)字段支持这一点。就像NPM一样，您可以覆盖特定包的依赖，或确保每个拉入Redux的包都收到相同的版本。

```json title="Individual override - redux-persist"
{
  "resolutions": {
    "redux-persist/redux": "^5.0.0"
  }
}
```

```json title="Blanket override"
{
  "resolutions": {
    "redux": "^5.0.0"
  }
}
```

## 推荐

基于2.0和以前版本的变化，有一些思维转变是值得了解的，即使不是必要的。

### `actionCreator.toString()`的替代方案

作为RTK原始API的一部分，使用`createAction`创建的动作创建器具有一个自定义的`toString()`覆盖，它返回动作类型。

这主要用于`createReducer`的（[现已移除](#object-syntax-for-createsliceextrareducers-and-createreducer-removed)）对象语法：

```ts
const todoAdded = createAction<Todo>('todos/todoAdded')

createReducer(initialState, {
  [todoAdded]: (state, action) => {}, // 这里调用了toString，'todos/todoAdded'
})
```

虽然这很方便（Redux生态系统中的其他库，如`redux-saga`和`redux-observable`，在不同程度上支持了这一点），但它与Typescript的兼容性不好，而且通常有点过于"神奇"。

```ts
const test = todoAdded.toString()
//    ^? 类型为字符串，而不是特定的动作类型
```

随着时间的推移，动作创建器还获得了一个静态的`type`属性和`match`方法，这些方法更加明确，与Typescript的兼容性更好。

```ts
const test = todoAdded.type
//    ^? 'todos/todoAdded'

// 作为类型谓词
if (todoAdded.match(unknownAction)) {
  unknownAction.payload
  // ^? 现在类型为PayloadAction<Todo>
}
```

为了兼容性，这个覆盖仍然存在，但我们建议考虑使用其中任何一个静态属性以编写更易理解的代码。

例如，使用`redux-observable`：

```ts
// 之前（在运行时工作，但不会正确过滤类型）
const epic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(todoAdded),
    map((action) => action),
    //   ^? 仍然是Action<any>
  )

// 考虑（更好的类型过滤）
const epic = (action$: Observable<Action>) =>
  action$.pipe(
    filter(todoAdded.match),
    map((action) => action),
    //   ^? 现在是PayloadAction<Todo>
  )
```

使用`redux-saga`：

```ts
// 之前（仍然有效）
yield takeEvery(todoAdded, saga)

// 考虑
yield takeEvery(todoAdded.match, saga)
// 或者
yield takeEvery(todoAdded.type, saga)
```

## 未来计划

### 自定义切片reducer创建器

随着[为createSlice添加回调语法](#callback-syntax-for-createslicereducers)，[提出了](https://github.com/reduxjs/redux-toolkit/issues/3837)启用自定义切片reducer创建器的建议。这些创建器将能够：

- 通过添加case或matcher reducer来修改reducer行为
- 将动作（或任何其他有用的函数）附加到`slice.actions`
- 将提供的case reducer附加到`slice.caseReducers`

创建器首次调用`createSlice`时需要首先返回一个"定义"形状，然后它通过添加任何必要的reducer和/或动作来处理。

这个API还没有确定，但是现有的`create.asyncThunk`创建器实现了一个可能的API，可能看起来像这样：

```ts
const asyncThunkCreator = {
  type: ReducerType.asyncThunk,
  define(payloadCreator, config) {
    return {
      type: ReducerType.asyncThunk, // 需要匹配reducer类型，以便可以调用正确的处理器
      payloadCreator,
      ...config,
    }
  },
  handle(
    {
      // 定义reducer的键
      reducerName,
      // 自动生成的动作类型，即`${slice.name}/${reducerName}`
      type,
    },
    // 来自define()的定义
    definition,
    // 修改slice的方法
    context,
  ) {
    const { payloadCreator, options, pending, fulfilled, rejected, settled } =
      definition
    const asyncThunk = createAsyncThunk(type, payloadCreator, options)

    if (pending) context.addCase(asyncThunk.pending, pending)
    if (fulfilled) context.addCase(asyncThunk.fulfilled, fulfilled)
    if (rejected) context.addCase(asyncThunk.rejected, rejected)
    if (settled) context.addMatcher(asyncThunk.settled, settled)

    context.exposeAction(reducerName, asyncThunk)
    context.exposeCaseReducer(reducerName, {
      pending: pending || noop,
      fulfilled: fulfilled || noop,
      rejected: rejected || noop,
      settled: settled || noop,
    })
  },
}

const createSlice = buildCreateSlice({
  creators: {
    asyncThunk: asyncThunkCreator,
  },
})
```

我们不确定有多少人/库会真正使用这个，所以欢迎在[Github issue](https://github.com/reduxjs/redux-toolkit/issues/3837)上提供任何反馈！

### `createSlice.selector` 选择器工厂

关于 `createSlice.selectors` 是否足够支持记忆选择器，我们内部提出了一些疑虑。你可以向你的 `createSlice.selectors` 配置提供一个记忆选择器，但你只能使用那一个实例。

```ts
const todoSlice = createSlice({
  name: 'todos',
  initialState: {
    todos: [] as Todo[],
  },
  reducers: {},
  selectors: {
    selectTodosByAuthor: createSelector(
      (state: TodoState) => state.todos,
      (state: TodoState, author: string) => author,
      (todos, author) => todos.filter((todo) => todo.author === author),
    ),
  },
})

export const { selectTodosByAuthor } = todoSlice.selectors
```

使用 `createSelector` 的默认缓存大小为1，如果在多个组件中使用不同的参数调用，可能会导致缓存问题。对此的一个典型解决方案（不使用 `createSlice`）是使用[选择器工厂](https://cn.redux.js.org/usage/deriving-data-selectors#创建唯一的-selector-实例)：

```ts
export const makeSelectTodosByAuthor = () =>
  createSelector(
    (state: RootState) => state.todos.todos,
    (state: RootState, author: string) => author,
    (todos, author) => todos.filter((todo) => todo.author === author),
  )

function AuthorTodos({ author }: { author: string }) {
  const selectTodosByAuthor = useMemo(makeSelectTodosByAuthor, [])
  const todos = useSelector((state) => selectTodosByAuthor(state, author))
}
```

当然，使用 `createSlice.selectors`，这就不再可能了，因为你在创建切片时需要选择器实例。

在2.0.0版本中，我们没有为此设置解决方案 - 提出了一些API（[PR 1](https://github.com/reduxjs/redux-toolkit/pull/3671)，[PR 2](https://github.com/reduxjs/redux-toolkit/pull/3836)），但没有做出决定。如果你希望看到对此的支持，请考虑在 [Github 讨论](https://github.com/reduxjs/redux-toolkit/discussions/3387)中提供反馈！

### 3.0 - RTK 查询

RTK 2.0 主要关注核心和工具箱的变化。现在2.0已经发布，我们希望将注意力转向 RTK 查询，因为还有一些需要解决的粗糙边缘 - 其中一些可能需要破坏性的变化，需要发布3.0版本。

如果你对这可能是什么样的有任何反馈，请考虑在 [RTK 查询 API 痛点和粗糙点反馈线程](https://github.com/reduxjs/redux-toolkit/issues/3692)中发表意见！
