---
id: usage-with-typescript
title: 与 TypeScript 一起使用
sidebar_label: 与 TypeScript 一起使用
hide_title: true
---

&nbsp;

# 与 TypeScript 一起使用

:::tip 你将学到的

- 如何使用每个 Redux Toolkit API 与 TypeScript 的详细信息

:::

## 简介

Redux Toolkit 是用 TypeScript 编写的，其 API 的设计使其能够与 TypeScript 应用程序进行很好的集成。

此页面为 Redux Toolkit 中包含的不同 API 提供了具体的详细信息，以及如何使用 TypeScript 正确地对它们进行类型化。

**请查看 [TypeScript 快速开始教程页面](../tutorials/typescript.md) ，了解如何设置和使用 Redux Toolkit 和 React Redux 与 TypeScript 一起工作的简要概述**。

:::info

如果你遇到了本页面未描述的类型问题，请[开启一个问题](https://github.com/reduxjs/redux-toolkit/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc)进行讨论。

:::

## `configureStore`

在 [TypeScript 快速开始教程页面](../tutorials/typescript.md) 中展示了使用 `configureStore` 的基础知识。这里有一些你可能会发现有用的额外细节。

### 获取 `State` 类型

获取 `State` 类型的最简单方法是提前定义根 reducer 并提取其 `ReturnType`。建议给类型一个不同的名字，如 `RootState`，以防止混淆，因为 `State` 这个类型名通常被过度使用。

```typescript
import { combineReducers } from '@reduxjs/toolkit'
const rootReducer = combineReducers({})
// highlight-start
export type RootState = ReturnType<typeof rootReducer>
// highlight-end
```

另外，如果你选择不创建 `rootReducer`，而是直接将切片 reducer 传递给 `configureStore()`，你需要稍微修改类型，以正确地推断出根 reducer：

```ts
import { configureStore } from '@reduxjs/toolkit'
// ...
const store = configureStore({
  reducer: {
    one: oneSlice.reducer,
    two: twoSlice.reducer,
  },
})
export type RootState = ReturnType<typeof store.getState>

export default store
```

如果你直接将 reducer 传递给 `configureStore()` 并且没有明确定义根 reducer，那么就没有 `rootReducer` 的引用。相反，你可以引用 `store.getState`，以获取 `State` 类型。

```typescript
import { configureStore } from '@reduxjs/toolkit'
import rootReducer from './rootReducer'
const store = configureStore({
  reducer: rootReducer,
})
export type RootState = ReturnType<typeof store.getState>
```

### 获取 `Dispatch` 类型

如果你想从你的 store 中获取 `Dispatch` 类型，你可以在创建 store 后提取它。建议给类型一个不同的名字，如 `AppDispatch`，以防止混淆，因为 `Dispatch` 这个类型名通常被过度使用。你可能也会发现导出像下面显示的 `useAppDispatch` 这样的钩子更方便，然后在你会调用 `useDispatch` 的任何地方使用它。

```typescript
import { configureStore } from '@reduxjs/toolkit'
import { useDispatch } from 'react-redux'
import rootReducer from './rootReducer'

const store = configureStore({
  reducer: rootReducer,
})

// highlight-start
export type AppDispatch = typeof store.dispatch
export const useAppDispatch = useDispatch.withTypes<AppDispatch>() // 导出一个可以重复解析类型的钩子
// highlight-end

export default store
```

### `Dispatch` 类型的正确类型

`dispatch` 函数类型的类型将直接从 `middleware` 选项推断出来。所以，如果你添加了 _正确类型化_ 的中间件，`dispatch` 应该已经被正确地类型化了。

由于 TypeScript 经常在使用扩展运算符组合数组时扩大数组类型，我们建议使用 `getDefaultMiddleware()` 返回的 `Tuple` 的 `.concat(...)` 和 `.prepend(...)` 方法。

```ts
import { configureStore } from '@reduxjs/toolkit'
import additionalMiddleware from 'additional-middleware'
import logger from 'redux-logger'
// @ts-ignore
import untypedMiddleware from 'untyped-middleware'
import rootReducer from './rootReducer'

export type RootState = ReturnType<typeof rootReducer>
const store = configureStore({
  reducer: rootReducer,
  // highlight-start
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(
        // 正确类型化的中间件可以直接使用
        additionalMiddleware,
        // 你也可以手动类型化中间件
        untypedMiddleware as Middleware<
          (action: Action<'specialAction'>) => number,
          RootState
        >,
      )
      // prepend 和 concat 调用可以被链式调用
      .concat(logger),
  // highlight-end
})

export type AppDispatch = typeof store.dispatch

export default store
```

#### 不使用 `getDefaultMiddleware` 的情况下使用 `Tuple`

如果你想完全跳过使用 `getDefaultMiddleware`，你需要使用 `Tuple` 来类型安全地创建你的 `middleware` 数组。这个类扩展了默认的 JavaScript `Array` 类型，只是修改了 `.concat(...)` 的类型定义，并添加了额外的 `.prepend(...)` 方法。

例如：

```ts
import { configureStore, Tuple } from '@reduxjs/toolkit'

configureStore({
  reducer: rootReducer,
  middleware: () => new Tuple(additionalMiddleware, logger),
})
```

### 使用提取的 `Dispatch` 类型与 React Redux

默认情况下，React Redux 的 `useDispatch` 钩子不包含考虑到中间件的任何类型。如果你在分派时需要 `dispatch` 函数的更具体类型，你可以指定返回的 `dispatch` 函数的类型，或创建一个自定义类型的 `useSelector`。详见 [React Redux 文档](https://cn.react-redux.js.org/using-react-redux/static-typing#typing-the-usedispatch-hook)。

## `createAction`

对于大多数用例，没有必要有 `action.type` 的文字定义，所以可以使用以下内容：

```typescript
createAction<number>('test')
```

这将导致创建的动作类型为 `PayloadActionCreator<number, string>`。

在一些设置中，你可能需要 `action.type` 的文字类型。不幸的是，TypeScript 类型定义不允许手动定义和推断类型参数的混合，所以你必须在泛型定义和实际的 JavaScript 代码中指定 `type`：

```typescript
createAction<number, 'test'>('test')
```

如果你正在寻找一种不重复的写法，你可以使用一个准备回调，这样两个类型参数都可以从参数中推断出来，无需指定动作类型。

```typescript
function withPayloadType<T>() {
  return (t: T) => ({ payload: t })
}
createAction('test', withPayloadType<string>())
```

### 使用文字类型 `action.type` 的替代方案

如果你正在使用 `action.type` 作为一个区分联合的鉴别器，例如为了在 `case` 语句中正确地类型化你的有效载荷，你可能会对这个替代方案感兴趣：

创建的动作创建器有一个 `match` 方法，它充当一个 [类型谓词](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)：

```typescript
const increment = createAction<number>('increment')
function test(action: Action) {
  if (increment.match(action)) {
    // 这里正确地推断出了 action.payload
    action.payload
  }
}
```

这个 `match` 方法与 `redux-observable` 和 RxJS 的 `filter` 方法结合使用非常有用。

## `createReducer`

### 构建类型安全的 Reducer 参数对象

`createReducer` 的第二个参数是一个接收 `ActionReducerMapBuilder` 实例的回调：

```typescript {3-10}
const increment = createAction<number, 'increment'>('increment')
const decrement = createAction<number, 'decrement'>('decrement')
createReducer(0, (builder) =>
  builder
    .addCase(increment, (state, action) => {
      // 这里正确地推断出了 action
    })
    .addCase(decrement, (state, action: PayloadAction<string>) => {
      // 这将会报错
    }),
)
```

#### 类型化 `builder.addMatcher`

作为 `builder.addMatcher` 的第一个 `matcher` 参数，应使用一个 [类型谓词](https://www.typescriptlang.org/docs/handbook/advanced-types.html#using-type-predicates) 函数。
因此，第二个 `reducer` 参数的 `action` 参数可以由 TypeScript 推断出来：

```ts
function isNumberValueAction(action: UnknownAction): action is PayloadAction<{ value: number }> {
  return typeof action.payload.value === 'number'
}

createReducer({ value: 0 }, builder =>
   builder.addMatcher(isNumberValueAction, (state, action) => {
      state.value += action.payload.value
   })
})
```

## `createSlice`

由于 `createSlice` 为你创建了动作和 reducer，所以你不必在这里担心类型安全性。动作类型可以直接内联提供：

```typescript
const slice = createSlice({
  name: 'test',
  initialState: 0,
  reducers: {
    increment: (state, action: PayloadAction<number>) => state + action.payload,
  },
})
// 现在可用：
slice.actions.increment(2)
// 也可用：
slice.caseReducers.increment(0, { type: 'increment', payload: 5 })
```

如果你有太多的 case reducer，而且在内联定义它们会很混乱，或者你想在多个 slice 之间重用 case reducer，你也可以在 `createSlice` 调用之外定义它们，并将它们类型化为 `CaseReducer`：

```typescript
type State = number
const increment: CaseReducer<State, PayloadAction<number>> = (state, action) =>
  state + action.payload

createSlice({
  name: 'test',
  initialState: 0,
  reducers: {
    increment,
  },
})
```

### 定义初始状态类型

你可能已经注意到，将你的 `SliceState` 类型作为泛型传递给 `createSlice` 并不是一个好主意。这是因为在几乎所有情况下，`createSlice` 的后续泛型参数需要被推断，而 TypeScript 不能在同一个 "泛型块" 中混合显式声明和推断泛型类型。

标准的做法是声明一个接口或类型来表示你的状态，创建一个使用该类型的初始状态值，并将初始状态值传递给 `createSlice`。你也可以使用 `initialState: myInitialState satisfies SliceState as SliceState` 的构造。

```ts {1,4,8,15}
type SliceState = { state: 'loading' } | { state: 'finished'; data: string }

// 第一种方法：使用该类型定义初始状态
const initialState: SliceState = { state: 'loading' }

createSlice({
  name: 'test1',
  initialState, // 切片状态的类型 SliceState 被推断出来
  reducers: {},
})

// 或者，根据需要转换初始状态
createSlice({
  name: 'test2',
  initialState: { state: 'loading' } satisfies SliceState as SliceState,
  reducers: {},
})
```

这将导致一个 `Slice<SliceState, ...>`。

### 使用 `prepare` 回调定义动作内容

如果你想给你的动作添加一个 `meta` 或 `error` 属性，或者自定义你的动作的 `payload`，你必须使用 `prepare` 符号。

使用 TypeScript 这样表示：

```ts {5-16}
const blogSlice = createSlice({
  name: 'blogData',
  initialState,
  reducers: {
    receivedAll: {
      reducer(
        state,
        action: PayloadAction<Page[], string, { currentPage: number }>,
      ) {
        state.all = action.payload
        state.meta = action.meta
      },
      prepare(payload: Page[], currentPage: number) {
        return { payload, meta: { currentPage } }
      },
    },
  },
})
```

### 为切片生成的动作类型

`createSlice` 通过将切片的 `name` 字段与 reducer 函数的字段名组合，生成动作类型字符串，如 `'test/increment'`。这是强类型的，准确的值，得益于 TS 的字符串字面量分析。

你也可以使用 `slice.action.myAction.match` [类型谓词](https://www.typescriptlang.org/docs/handbook/advanced-types.html#using-type-predicates)，它将动作对象缩小到精确的类型：

```ts {10}
const slice = createSlice({
  name: 'test',
  initialState: 0,
  reducers: {
    increment: (state, action: PayloadAction<number>) => state + action.payload,
  },
})

type incrementType = typeof slice.actions.increment.type
// 类型 incrementType = 'test/increment'

function myCustomMiddleware(action: Action) {
  if (slice.actions.increment.match(action)) {
    // 在这里，`action` 被缩小到类型 `PayloadAction<number>`。
  }
}
```

如果你实际上 _需要_ 那种类型，不幸的是，除了手动转换之外，没有其他方法。

### 使用 `extraReducers` 的类型安全

将动作 `type` 字符串映射到 reducer 函数的 reducer 查找表不容易完全类型化正确。这影响了 `createReducer` 和 `createSlice` 的 `extraReducers` 参数。所以，像使用 `createReducer` 一样，[你应该使用 "builder 回调" 方法](#building-type-safe-reducer-argument-objects) 来定义 reducer 对象参数。

当一个切片 reducer 需要处理其他切片生成的动作类型，或者由 `createAction` 的特定调用生成的动作（如由 [`createAsyncThunk`](../api/createAsyncThunk.mdx) 生成的动作）时，这特别有用。

```ts {27-30}
const fetchUserById = createAsyncThunk(
  'users/fetchById',
  // 如果你在这里类型化你的函数参数
  async (userId: number) => {
    const response = await fetch(`https://reqres.in/api/users/${userId}`)
    return (await response.json()) as Returned
  },
)

interface UsersState {
  entities: User[]
  loading: 'idle' | 'pending' | 'succeeded' | 'failed'
}

const initialState = {
  entities: [],
  loading: 'idle',
} satisfies UsersState as UsersState

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    // 在这里填写主要逻辑
  },
  extraReducers: (builder) => {
    builder.addCase(fetchUserById.pending, (state, action) => {
      // 现在，`state` 和 `action` 都根据切片状态和 `pending` 动作创建器正确地类型化了
    })
  },
})
```

像 `createReducer` 中的 `builder` 一样，这个 `builder` 也接受 `addMatcher`（参见 [typing `builder.matcher`](#typing-builderaddmatcher)）和 `addDefaultCase`。

### 所有字段都是可选的Payload

如果你尝试提供一个所有字段都是可选的payload类型，比如 `PayloadAction<Partial<User>>` 或 `PayloadAction<{value?: string}>`，TS可能无法正确推断出action的类型。

你可以通过[使用自定义的 `AtLeastOne` 工具类型](https://github.com/reduxjs/redux-toolkit/issues/1423#issuecomment-902680573)来确保至少有一个字段必须传入：

```ts no-transpile
type AtLeastOne<T extends Record<string, any>> = keyof T extends infer K
  ? K extends string
    ? Pick<T, K & keyof T> & Partial<T>
    : never
  : never

// 使用这个类型代替 `Partial<MyPayloadType>`
type AtLeastOneUserField = AtLeastOne<User>
```

### 在 `createSlice` 中为异步 Thunks 类型化

从2.0版本开始，`createSlice` 允许[使用回调语法在 `reducers` 中定义 thunks](../api/createSlice.mdx/#the-reducers-creator-callback-notation)。

`create.asyncThunk` 方法的类型化工作方式与 [`createAsyncThunk`](#createasyncthunk) 相同，但有一个关键的区别。

`state` 和/或 `dispatch` 的类型 _不能_ 作为 `ThunkApiConfig` 的一部分提供，因为这会导致循环类型。

相反，需要在必要时断言类型 - `getState() as RootState`。你也可以为payload函数包含一个明确的返回类型，以打破循环类型推断周期。

```ts no-transpile
create.asyncThunk<Todo, string, { rejectValue: { error: string } }>(
  // highlight-start
  // 可能需要包含一个明确的返回类型
  async (id: string, thunkApi): Promise<Todo> => {
    // 手动为 `getState` 和 `dispatch` 类型转换
    const state = thunkApi.getState() as RootState
    const dispatch = thunkApi.dispatch as AppDispatch
    // highlight-end
    try {
      const todo = await fetchTodo()
      return todo
    } catch (e) {
      throw thunkApi.rejectWithValue({
        error: 'Oh no!',
      })
    }
  },
)
```

对于常见的 thunk API 配置选项，提供了一个 [`withTypes` helper](../usage/usage-with-typescript#defining-a-pre-typed-createasyncthunk)：

```ts no-transpile
reducers: (create) => {
  const createAThunk = create.asyncThunk.withTypes<{
    rejectValue: { error: string }
  }>()

  return {
    fetchTodo: createAThunk<Todo, string>(async (id, thunkApi) => {
      throw thunkApi.rejectWithValue({
        error: 'Oh no!',
      })
    }),
    fetchTodos: createAThunk<Todo[], string>(async (id, thunkApi) => {
      throw thunkApi.rejectWithValue({
        error: 'Oh no, not again!',
      })
    }),
  }
}
```

### 包装 `createSlice`

如果你需要重用 reducer 逻辑，通常会编写["高阶 reducers"](https://cn.redux.js.org/recipes/structuring-reducers/reusing-reducer-logic#customizing-behavior-with-higher-order-reducers) 来用额外的公共行为包装一个 reducer 函数。这也可以用 `createSlice` 来完成，但由于 `createSlice` 的类型复杂性，你必须以非常特定的方式使用 `SliceCaseReducers` 和 `ValidateSliceCaseReducers` 类型。

下面是一个这样的"通用"包装 `createSlice` 调用的例子：

```ts
interface GenericState<T> {
  data?: T
  status: 'loading' | 'finished' | 'error'
}

const createGenericSlice = <
  T,
  Reducers extends SliceCaseReducers<GenericState<T>>,
>({
  name = '',
  initialState,
  reducers,
}: {
  name: string
  initialState: GenericState<T>
  reducers: ValidateSliceCaseReducers<GenericState<T>, Reducers>
}) => {
  return createSlice({
    name,
    initialState,
    reducers: {
      start(state) {
        state.status = 'loading'
      },
      /**
       * 如果你想写入依赖于通用的状态值
       * (在这个例子中：`state.data`，它是 T)，你可能需要在这里手动指定
       * State 类型，因为它默认为 `Draft<GenericState<T>>`，
       * 这在尚未解析的通用中有时可能会有问题。
       * 这是在使用 immer 的 Draft 类型和通用时的一般问题。
       */
      success(state: GenericState<T>, action: PayloadAction<T>) {
        state.data = action.payload
        state.status = 'finished'
      },
      ...reducers,
    },
  })
}

const wrappedSlice = createGenericSlice({
  name: 'test',
  initialState: { status: 'loading' } as GenericState<string>,
  reducers: {
    magic(state) {
      state.status = 'finished'
      state.data = 'hocus pocus'
    },
  },
})
```

## `createAsyncThunk`

### 基本的 `createAsyncThunk` 类型

在最常见的使用场景中，你不应该需要为 `createAsyncThunk` 调用本身显式声明任何类型。

只需为 `payloadCreator` 参数的第一个参数提供一个类型，就像你为任何函数参数提供类型一样，生成的 thunk 将接受相同类型的输入参数。
`payloadCreator` 的返回类型也将反映在所有生成的 action 类型中。

```ts
interface MyData {
  // ...
}

const fetchUserById = createAsyncThunk(
  'users/fetchById',
  // highlight-start
  // 在这里声明你的函数参数类型：
  async (userId: number) => {
    // highlight-end
    const response = await fetch(`https://reqres.in/api/users/${userId}`)
    // 推断的返回类型：Promise<MyData>
    // highlight-next-line
    return (await response.json()) as MyData
  },
)

// `fetchUserById` 的参数在这里自动推断为 `number`
// 并且分发生成的 thunkAction 将返回一个 Promise，其中包含正确类型化的
// "fulfilled" 或 "rejected" action。
const lastReturnedAction = await store.dispatch(fetchUserById(3))
```

### 为 `thunkApi` 对象定义类型

`payloadCreator` 的第二个参数，称为 `thunkApi`，是一个包含对 `dispatch`、`getState` 和 `extra` 参数的引用的对象，这些参数来自 thunk 中间件，以及一个名为 `rejectWithValue` 的实用函数。如果你想在 `payloadCreator` 内部使用这些，你需要定义一些泛型参数，因为这些参数的类型无法推断。此外，由于 TS 无法混合显式和推断的泛型参数，从这一点开始，你必须定义 `Returned` 和 `ThunkArg` 泛型参数。

#### 手动定义 `thunkApi` 类型

要为这些参数定义类型，将一个对象作为第三个泛型参数传递，为这些字段中的一些或全部声明类型：

```ts
type AsyncThunkConfig = {
  /** `thunkApi.getState` 的返回类型 */
  state?: unknown
  /** `thunkApi.dispatch` 的类型 */
  dispatch?: Dispatch
  /** thunk 中间件的 `extra` 参数的类型，将作为 `thunkApi.extra` 传入 */
  extra?: unknown
  /** 要传入 `rejectWithValue` 的第一个参数的类型，最终会在 `rejectedAction.payload` 上 */
  rejectValue?: unknown
  /** `serializeError` 选项回调的返回类型 */
  serializedErrorType?: unknown
  /** 要从 `getPendingMeta` 选项回调返回并合并到 `pendingAction.meta` 的类型 */
  pendingMeta?: unknown
  /** 要传入 `fulfillWithValue` 的第二个参数的类型，最终会合并到 `fulfilledAction.meta` */
  fulfilledMeta?: unknown
  /** 要传入 `rejectWithValue` 的第二个参数的类型，最终会合并到 `rejectedAction.meta` */
  rejectedMeta?: unknown
}
```

```ts
const fetchUserById = createAsyncThunk<
  // highlight-start
  // 负载创建器的返回类型
  MyData,
  // 负载创建器的第一个参数
  number,
  {
    // 定义 thunkApi 字段类型的可选字段
    dispatch: AppDispatch
    state: State
    extra: {
      jwt: string
    }
  }
  // highlight-end
>('users/fetchById', async (userId, thunkApi) => {
  const response = await fetch(`https://reqres.in/api/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${thunkApi.extra.jwt}`,
    },
  })
  return (await response.json()) as MyData
})
```

如果你正在执行一个请求，你知道它通常会成功，或者有一个预期的错误格式，你可以传入一个类型到 `rejectValue` 并在动作创建器中 `return rejectWithValue(knownPayload)`。这允许你在 reducer 中以及在分派 `createAsyncThunk` 动作后的组件中引用错误负载。

```ts
interface MyKnownError {
  errorMessage: string
  // ...
}
interface UserAttributes {
  id: string
  first_name: string
  last_name: string
  email: string
}

const updateUser = createAsyncThunk<
  // 负载创建器的返回类型
  MyData,
  // 负载创建器的第一个参数
  UserAttributes,
  // ThunkAPI 的类型
  {
    extra: {
      jwt: string
    }
    rejectValue: MyKnownError
  }
>('users/update', async (user, thunkApi) => {
  const { id, ...userData } = user
  const response = await fetch(`https://reqres.in/api/users/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${thunkApi.extra.jwt}`,
    },
    body: JSON.stringify(userData),
  })
  if (response.status === 400) {
    // 返回已知错误以供将来处理
    return thunkApi.rejectWithValue((await response.json()) as MyKnownError)
  }
  return (await response.json()) as MyData
})
```

虽然对 `state`、`dispatch`、`extra` 和 `rejectValue` 的这种表示法一开始可能看起来不常见，但它允许你只提供你实际需要的这些类型 - 所以例如，如果你在你的 `payloadCreator` 中没有访问 `getState`，就没有必要为 `state` 提供类型。关于 `rejectValue` 也可以说同样的事情 - 如果你不需要访问任何可能的错误负载，你可以忽略它。

此外，你可以利用 `createAction` 提供的对 `action.payload` 和 `match` 的检查作为类型保护，当你想访问已定义类型上的已知属性时。例如：

- 在 reducer 中

```ts
const usersSlice = createSlice({
  name: 'users',
  initialState: {
    entities: {},
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(updateUser.fulfilled, (state, { payload }) => {
      state.entities[payload.id] = payload
    })
    builder.addCase(updateUser.rejected, (state, action) => {
      if (action.payload) {
        // 由于我们在 `updateUser` 中传入了 `MyKnownError` 到 `rejectValue`，类型信息将在这里可用。
        state.error = action.payload.errorMessage
      } else {
        state.error = action.error
      }
    })
  },
})
```

- 在组件中

```ts
const handleUpdateUser = async (userData) => {
  const resultAction = await dispatch(updateUser(userData))
  if (updateUser.fulfilled.match(resultAction)) {
    const user = resultAction.payload
    showToast('success', `Updated ${user.name}`)
  } else {
    if (resultAction.payload) {
      // 由于我们在 `updateUser` 中传入了 `MyKnownError` 到 `rejectValue`，类型信息将在这里可用。
      // 注意：这也将是一个依赖于 `rejectedWithValue` 负载的任何处理的好地方，例如设置字段错误
      showToast('error', `Update failed: ${resultAction.payload.errorMessage}`)
    } else {
      showToast('error', `Update failed: ${resultAction.error.message}`)
    }
  }
}
```

### 定义预设类型的 `createAsyncThunk`

从 RTK 1.9 开始，你可以定义一个预设类型的 `createAsyncThunk`，它可以内置 `state`，`dispatch` 和 `extra` 的类型。这样可以让你一次性设置这些类型，以便在每次调用 `createAsyncThunk` 时不必重复它们。

要做到这一点，调用 `createAsyncThunk.withTypes<>()`，并传入一个包含 `AsyncThunkConfig` 类型中列出的任何字段的字段名和类型的对象。这可能看起来像这样：

```ts
const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: RootState
  dispatch: AppDispatch
  rejectValue: string
  extra: { s: string; n: number }
}>()
```

导入并使用预设类型的 `createAppAsyncThunk` 替代原始的，类型将自动使用。

## `createEntityAdapter`

为 `createEntityAdapter` 定义类型只需要将实体类型作为单一的泛型参数指定。

`createEntityAdapter` 文档中的示例在 TypeScript 中看起来像这样：

```ts
interface Book {
  bookId: number
  title: string
  // ...
}

// highlight-next-line
const booksAdapter = createEntityAdapter<Book>({
  selectId: (book) => book.bookId,
  sortComparer: (a, b) => a.title.localeCompare(b.title),
})

const booksSlice = createSlice({
  name: 'books',
  initialState: booksAdapter.getInitialState(),
  reducers: {
    bookAdded: booksAdapter.addOne,
    booksReceived(state, action: PayloadAction<{ books: Book[] }>) {
      booksAdapter.setAll(state, action.payload.books)
    },
  },
})
```

### 使用 `createEntityAdapter` 和 `normalizr`

当使用像 [`normalizr`](https://github.com/paularmstrong/normalizr/) 这样的库时，你的规范化数据将呈现这种形状：

```js
{
  result: 1,
  entities: {
    1: { id: 1, other: 'property' },
    2: { id: 2, other: 'property' }
  }
}
```

`addMany`，`upsertMany` 和 `setAll` 方法都允许你直接传入这个 `entities` 部分，无需额外的转换步骤。然而，`normalizr` 的 TS 类型目前并未正确反映结果中可能包含的多种数据类型，所以你需要自己指定该类型结构。

以下是一个示例：

```ts
type Author = { id: number; name: string }
type Article = { id: number; title: string }
type Comment = { id: number; commenter: number }

export const fetchArticle = createAsyncThunk(
  'articles/fetchArticle',
  async (id: number) => {
    const data = await fakeAPI.articles.show(id)
    // 规范化数据，使得 reducers 可以响应可预测的负载。
    // 注意：在编写时，normalizr 不会自动推断结果，
    // 所以我们明确声明返回的规范化数据的形状作为一个泛型参数。
    const normalized = normalize<
      any,
      {
        articles: { [key: string]: Article }
        users: { [key: string]: Author }
        comments: { [key: string]: Comment }
      }
    >(data, articleEntity)
    return normalized.entities
  },
)

export const slice = createSlice({
  name: 'articles',
  initialState: articlesAdapter.getInitialState(),
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchArticle.fulfilled, (state, action) => {
      // action.payload 的类型签名与我们传入 `normalize` 的泛型匹配，允许我们在需要时访问 `payload.articles` 的特定属性
      articlesAdapter.upsertMany(state, action.payload.articles)
    })
  },
})
```
