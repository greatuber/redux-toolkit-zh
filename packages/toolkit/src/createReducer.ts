import type { Draft } from 'immer'
import { produce as createNextState, isDraft, isDraftable } from 'immer'
import type { Action, Reducer, UnknownAction } from 'redux'
import type { ActionReducerMapBuilder } from './mapBuilders'
import { executeReducerBuilderCallback } from './mapBuilders'
import type { NoInfer, TypeGuard } from './tsHelpers'
import { freezeDraftable } from './utils'

/**
 * Defines a mapping from action types to corresponding action object shapes.
 *
 * @deprecated This should not be used manually - it is only used for internal
 *             inference purposes and should not have any further value.
 *             It might be removed in the future.
 * @public
 */
export type Actions<T extends keyof any = string> = Record<T, Action>

export type ActionMatcherDescription<S, A extends Action> = {
  matcher: TypeGuard<A>
  reducer: CaseReducer<S, NoInfer<A>>
}

export type ReadonlyActionMatcherDescriptionCollection<S> = ReadonlyArray<
  ActionMatcherDescription<S, any>
>

export type ActionMatcherDescriptionCollection<S> = Array<
  ActionMatcherDescription<S, any>
>

/**
 * A *case reducer* is a reducer function for a specific action type. Case
 * reducers can be composed to full reducers using `createReducer()`.
 *
 * Unlike a normal Redux reducer, a case reducer is never called with an
 * `undefined` state to determine the initial state. Instead, the initial
 * state is explicitly specified as an argument to `createReducer()`.
 *
 * In addition, a case reducer can choose to mutate the passed-in `state`
 * value directly instead of returning a new state. This does not actually
 * cause the store state to be mutated directly; instead, thanks to
 * [immer](https://github.com/mweststrate/immer), the mutations are
 * translated to copy operations that result in a new state.
 *
 * @public
 */
export type CaseReducer<S = any, A extends Action = UnknownAction> = (
  state: Draft<S>,
  action: A,
) => NoInfer<S> | void | Draft<NoInfer<S>>

/**
 * A mapping from action types to case reducers for `createReducer()`.
 *
 * @deprecated This should not be used manually - it is only used
 *             for internal inference purposes and using it manually
 *             would lead to type erasure.
 *             It might be removed in the future.
 * @public
 */
export type CaseReducers<S, AS extends Actions> = {
  [T in keyof AS]: AS[T] extends Action ? CaseReducer<S, AS[T]> : void
}

export type NotFunction<T> = T extends Function ? never : T

function isStateFunction<S>(x: unknown): x is () => S {
  return typeof x === 'function'
}

export type ReducerWithInitialState<S extends NotFunction<any>> = Reducer<S> & {
  getInitialState: () => S
}

/**
 * 这是一个实用函数，允许将 reducer 定义为从动作类型到处理这些动作类型的*case reducer*函数的映射。reducer 的初始状态作为第一个参数传递。
 *
 * @remarks
 * 每个 case reducer 的主体都隐式地用 [immer](https://github.com/mweststrate/immer) 库的 `produce()` 函数进行了包装。
 * 这意味着你可以直接修改传入的状态对象，而不是返回一个新的状态对象；这些修改将自动且高效地转换为副本，为你提供便利性和不变性。
 *
 * @overloadSummary
 * 此函数接受一个回调，该回调接收一个 `builder` 对象作为其参数。
 * 该 builder 提供了 `addCase`，`addMatcher` 和 `addDefaultCase` 函数，可以调用它们来定义此 reducer 将处理哪些动作。
 *
 * @param initialState - `State | (() => State)`: 当 reducer 第一次被调用时应使用的初始状态。这也可以是一个"延迟初始化"函数，当被调用时应返回一个初始状态值。每当 reducer 被调用并且其状态值为 `undefined` 时，都会使用这个函数，这主要用于像从 `localStorage` 读取初始状态这样的情况。
 * @param builderCallback - `(builder: Builder) => void` 一个接收 *builder* 对象的回调，通过调用 `builder.addCase(actionCreatorOrType, reducer)` 来定义 case reducer。
 * @example
```ts
import {
  createAction,
  createReducer,
  UnknownAction,
  PayloadAction,
} from "@reduxjs/toolkit";

const increment = createAction<number>("increment");
const decrement = createAction<number>("decrement");

function isActionWithNumberPayload(
  action: UnknownAction
): action is PayloadAction<number> {
  return typeof action.payload === "number";
}

const reducer = createReducer(
  {
    counter: 0,
    sumOfNumberPayloads: 0,
    unhandledActions: 0,
  },
  (builder) => {
    builder
      .addCase(increment, (state, action) => {
        // 在这里正确推断出 action
        state.counter += action.payload;
      })
      // 你可以链式调用，或者每次都有单独的 `builder.addCase()` 行
      .addCase(decrement, (state, action) => {
        state.counter -= action.payload;
      })
      // 你可以对传入的动作应用一个 "匹配函数"
      .addMatcher(isActionWithNumberPayload, (state, action) => {})
      // 如果没有其他处理器匹配，可以提供一个默认情况
      .addDefaultCase((state, action) => {});
  }
);
```
 * @public
 */
export function createReducer<S extends NotFunction<any>>(
  initialState: S | (() => S),
  mapOrBuilderCallback: (builder: ActionReducerMapBuilder<S>) => void,
): ReducerWithInitialState<S> {
  if (process.env.NODE_ENV !== 'production') {
    if (typeof mapOrBuilderCallback === 'object') {
      throw new Error(
        "The object notation for `createReducer` has been removed. Please use the 'builder callback' notation instead: https://redux-toolkit.js.org/api/createReducer",
      )
    }
  }

  let [actionsMap, finalActionMatchers, finalDefaultCaseReducer] =
    executeReducerBuilderCallback(mapOrBuilderCallback)

  // Ensure the initial state gets frozen either way (if draftable)
  let getInitialState: () => S
  if (isStateFunction(initialState)) {
    getInitialState = () => freezeDraftable(initialState())
  } else {
    const frozenInitialState = freezeDraftable(initialState)
    getInitialState = () => frozenInitialState
  }

  function reducer(state = getInitialState(), action: any): S {
    let caseReducers = [
      actionsMap[action.type],
      ...finalActionMatchers
        .filter(({ matcher }) => matcher(action))
        .map(({ reducer }) => reducer),
    ]
    if (caseReducers.filter((cr) => !!cr).length === 0) {
      caseReducers = [finalDefaultCaseReducer]
    }

    return caseReducers.reduce((previousState, caseReducer): S => {
      if (caseReducer) {
        if (isDraft(previousState)) {
          // If it's already a draft, we must already be inside a `createNextState` call,
          // likely because this is being wrapped in `createReducer`, `createSlice`, or nested
          // inside an existing draft. It's safe to just pass the draft to the mutator.
          const draft = previousState as Draft<S> // We can assume this is already a draft
          const result = caseReducer(draft, action)

          if (result === undefined) {
            return previousState
          }

          return result as S
        } else if (!isDraftable(previousState)) {
          // If state is not draftable (ex: a primitive, such as 0), we want to directly
          // return the caseReducer func and not wrap it with produce.
          const result = caseReducer(previousState as any, action)

          if (result === undefined) {
            if (previousState === null) {
              return previousState
            }
            throw Error(
              'A case reducer on a non-draftable value must not return undefined',
            )
          }

          return result as S
        } else {
          // @ts-ignore createNextState() produces an Immutable<Draft<S>> rather
          // than an Immutable<S>, and TypeScript cannot find out how to reconcile
          // these two types.
          return createNextState(previousState, (draft: Draft<S>) => {
            return caseReducer(draft, action)
          })
        }
      }

      return previousState
    }, state)
  }

  reducer.getInitialState = getInitialState

  return reducer as ReducerWithInitialState<S>
}
