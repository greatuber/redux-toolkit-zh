import type { Action } from 'redux'
import type {
  CaseReducer,
  CaseReducers,
  ActionMatcherDescriptionCollection,
} from './createReducer'
import type { TypeGuard } from './tsHelpers'

export interface TypedActionCreator<Type extends string> {
  (...args: any[]): Action<Type>
  type: Type
}

/**
 * 一个用于操作 <-> reducer 映射的构建器。
 *
 * @public
 */
export interface ActionReducerMapBuilder<State> {
  /**
   * 添加一个用于处理单一精确动作类型的 case reducer。
   * @remarks
   * 所有对 `builder.addCase` 的调用都必须在对 `builder.addMatcher` 或 `builder.addDefaultCase` 的任何调用之前。
   * @param actionCreator - 可以是一个普通的动作类型字符串，也可以是由 [`createAction`](./createAction) 生成的动作创建器，用于确定动作类型。
   * @param reducer - 实际的 case reducer 函数。
   */
  addCase<ActionCreator extends TypedActionCreator<string>>(
    actionCreator: ActionCreator,
    reducer: CaseReducer<State, ReturnType<ActionCreator>>,
  ): ActionReducerMapBuilder<State>
  /**
   * 添加一个用于处理单一精确动作类型的 case reducer。
   * @remarks
   * 所有对 `builder.addCase` 的调用都必须在对 `builder.addMatcher` 或 `builder.addDefaultCase` 的任何调用之前。
   * @param actionCreator - 可以是一个普通的动作类型字符串，也可以是由 [`createAction`](./createAction) 生成的动作创建器，用于确定动作类型。
   * @param reducer - 实际的 case reducer 函数。
   */
  addCase<Type extends string, A extends Action<Type>>(
    type: Type,
    reducer: CaseReducer<State, A>,
  ): ActionReducerMapBuilder<State>

  /**
   * 允许你将传入的动作与你自己的过滤函数进行匹配，而不仅仅是 `action.type` 属性。
   * @remarks
   * 如果多个 matcher reducers 匹配，它们都将按照定义的顺序执行 - 即使一个 case reducer 已经匹配。
   * 所有对 `builder.addMatcher` 的调用都必须在对 `builder.addCase` 的任何调用之后，并在对 `builder.addDefaultCase` 的任何调用之前。
   * @param matcher - 一个 matcher 函数。在 TypeScript 中，这应该是一个 [类型谓词](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates) 函数
   * @param reducer - 实际的 case reducer 函数。
   *
   * @example
```ts
import {
  createAction,
  createReducer,
  AsyncThunk,
  UnknownAction,
} from "@reduxjs/toolkit";

type GenericAsyncThunk = AsyncThunk<unknown, unknown, any>;

type PendingAction = ReturnType<GenericAsyncThunk["pending"]>;
type RejectedAction = ReturnType<GenericAsyncThunk["rejected"]>;
type FulfilledAction = ReturnType<GenericAsyncThunk["fulfilled"]>;

const initialState: Record<string, string> = {};
const resetAction = createAction("reset-tracked-loading-state");

function isPendingAction(action: UnknownAction): action is PendingAction {
  return typeof action.type === "string" && action.type.endsWith("/pending");
}

const reducer = createReducer(initialState, (builder) => {
  builder
    .addCase(resetAction, () => initialState)
    // matcher 可以在外部定义为类型谓词函数
    .addMatcher(isPendingAction, (state, action) => {
      state[action.meta.requestId] = "pending";
    })
    .addMatcher(
      // matcher 可以在内部定义为类型谓词函数
      (action): action is RejectedAction => action.type.endsWith("/rejected"),
      (state, action) => {
        state[action.meta.requestId] = "rejected";
      }
    )
    // matcher 可以只返回布尔值，matcher 可以接收一个泛型参数
    .addMatcher<FulfilledAction>(
      (action) => action.type.endsWith("/fulfilled"),
      (state, action) => {
        state[action.meta.requestId] = "fulfilled";
      }
    );
});
```
   */
  addMatcher<A>(
    matcher: TypeGuard<A> | ((action: any) => boolean),
    reducer: CaseReducer<State, A extends Action ? A : A & Action>,
  ): Omit<ActionReducerMapBuilder<State>, 'addCase'>

  /**
   * 添加一个"默认 case" reducer，如果没有 case reducer 和 matcher reducer 为此动作执行，那么将执行它。
   * @param reducer - 作为回退的 "默认 case" reducer 函数。
   *
   * @example
```ts
import { createReducer } from '@reduxjs/toolkit'
const initialState = { otherActions: 0 }
const reducer = createReducer(initialState, builder => {
  builder
    // .addCase(...)
    // .addMatcher(...)
    .addDefaultCase((state, action) => {
      state.otherActions++
    })
})
```
   */
  addDefaultCase(reducer: CaseReducer<State, Action>): {}
}

export function executeReducerBuilderCallback<S>(
  builderCallback: (builder: ActionReducerMapBuilder<S>) => void,
): [
  CaseReducers<S, any>,
  ActionMatcherDescriptionCollection<S>,
  CaseReducer<S, Action> | undefined,
] {
  const actionsMap: CaseReducers<S, any> = {}
  const actionMatchers: ActionMatcherDescriptionCollection<S> = []
  let defaultCaseReducer: CaseReducer<S, Action> | undefined
  const builder = {
    addCase(
      typeOrActionCreator: string | TypedActionCreator<any>,
      reducer: CaseReducer<S>,
    ) {
      if (process.env.NODE_ENV !== 'production') {
        /*
         to keep the definition by the user in line with actual behavior,
         we enforce `addCase` to always be called before calling `addMatcher`
         as matching cases take precedence over matchers
         */
        if (actionMatchers.length > 0) {
          throw new Error(
            '`builder.addCase` should only be called before calling `builder.addMatcher`',
          )
        }
        if (defaultCaseReducer) {
          throw new Error(
            '`builder.addCase` should only be called before calling `builder.addDefaultCase`',
          )
        }
      }
      const type =
        typeof typeOrActionCreator === 'string'
          ? typeOrActionCreator
          : typeOrActionCreator.type
      if (!type) {
        throw new Error(
          '`builder.addCase` cannot be called with an empty action type',
        )
      }
      if (type in actionsMap) {
        throw new Error(
          '`builder.addCase` cannot be called with two reducers for the same action type ' +
            `'${type}'`,
        )
      }
      actionsMap[type] = reducer
      return builder
    },
    addMatcher<A>(
      matcher: TypeGuard<A>,
      reducer: CaseReducer<S, A extends Action ? A : A & Action>,
    ) {
      if (process.env.NODE_ENV !== 'production') {
        if (defaultCaseReducer) {
          throw new Error(
            '`builder.addMatcher` should only be called before calling `builder.addDefaultCase`',
          )
        }
      }
      actionMatchers.push({ matcher, reducer })
      return builder
    },
    addDefaultCase(reducer: CaseReducer<S, Action>) {
      if (process.env.NODE_ENV !== 'production') {
        if (defaultCaseReducer) {
          throw new Error('`builder.addDefaultCase` can only be called once')
        }
      }
      defaultCaseReducer = reducer
      return builder
    },
  }
  builderCallback(builder)
  return [actionsMap, actionMatchers, defaultCaseReducer]
}
