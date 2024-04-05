import type {
  Selector,
  ThunkAction,
  ThunkDispatch,
  UnknownAction,
} from '@reduxjs/toolkit'
import type {
  Api,
  ApiContext,
  ApiEndpointMutation,
  ApiEndpointQuery,
  CoreModule,
  EndpointDefinitions,
  MutationActionCreatorResult,
  MutationDefinition,
  MutationResultSelectorResult,
  PrefetchOptions,
  QueryActionCreatorResult,
  QueryArgFrom,
  QueryDefinition,
  QueryKeys,
  QueryResultSelectorResult,
  QuerySubState,
  ResultTypeFrom,
  RootState,
  SerializeQueryArgs,
  SkipToken,
  SubscriptionOptions,
  TSHelpersId,
  TSHelpersNoInfer,
  TSHelpersOverride,
} from '@reduxjs/toolkit/query'
import { QueryStatus, skipToken } from '@reduxjs/toolkit/query'
import type { DependencyList } from 'react'
import {
  useCallback,
  useDebugValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { shallowEqual } from 'react-redux'
import type { BaseQueryFn } from '../baseQueryTypes'
import type { SubscriptionSelectors } from '../core/buildMiddleware/types'
import { defaultSerializeQueryArgs } from '../defaultSerializeQueryArgs'
import type { UninitializedValue } from './constants'
import { UNINITIALIZED_VALUE } from './constants'
import type { ReactHooksModuleOptions } from './module'
import { useStableQueryArgs } from './useSerializedStableValue'
import { useShallowStableValue } from './useShallowStableValue'

// Copy-pasted from React-Redux
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' &&
  !!window.document &&
  !!window.document.createElement
    ? useLayoutEffect
    : useEffect

export interface QueryHooks<
  Definition extends QueryDefinition<any, any, any, any, any>,
> {
  useQuery: UseQuery<Definition>
  useLazyQuery: UseLazyQuery<Definition>
  useQuerySubscription: UseQuerySubscription<Definition>
  useLazyQuerySubscription: UseLazyQuerySubscription<Definition>
  useQueryState: UseQueryState<Definition>
}

export interface MutationHooks<
  Definition extends MutationDefinition<any, any, any, any, any>,
> {
  useMutation: UseMutation<Definition>
}

/**
 * 一个 React 钩子，它会自动触发从端点获取数据的请求，将组件'订阅'到缓存数据，并从 Redux 存储中读取请求状态和缓存数据。随着加载状态的变化和数据的可用性，组件将重新渲染。
 *
 * 查询参数被用作缓存键。改变查询参数将告诉钩子如果缓存中不存在数据则重新获取数据，一旦数据可用，钩子将返回该查询参数的数据。
 *
 * 这个钩子将 [`useQueryState`](#usequerystate) 和 [`useQuerySubscription`](#usequerysubscription) 的功能结合在一起，预期在大多数情况下使用。
 *
 * #### 特性
 *
 * - 根据钩子参数和是否存在缓存数据，默认自动触发获取数据的请求
 * - 将组件'订阅'以在存储中保持缓存数据，并在组件卸载时'取消订阅'
 * - 接受轮询/重新获取选项，当满足相应条件时触发自动重新获取
 * - 从 Redux 存储中返回最新的请求状态和缓存数据
 * - 随着请求状态的变化和数据的可用性重新渲染
 */
export type UseQuery<D extends QueryDefinition<any, any, any, any>> = <
  R extends Record<string, any> = UseQueryStateDefaultResult<D>,
>(
  arg: QueryArgFrom<D> | SkipToken,
  options?: UseQuerySubscriptionOptions & UseQueryStateOptions<D, R>,
) => UseQueryHookResult<D, R>

export type TypedUseQuery<
  ResultType,
  QueryArg,
  BaseQuery extends BaseQueryFn,
> = UseQuery<QueryDefinition<QueryArg, BaseQuery, string, ResultType, string>>

export type UseQueryHookResult<
  D extends QueryDefinition<any, any, any, any>,
  R = UseQueryStateDefaultResult<D>,
> = UseQueryStateResult<D, R> & UseQuerySubscriptionResult<D>

/**
 * 辅助类型，用于在用户代码中手动输入 `useQuery` 钩子的结果。
 */
export type TypedUseQueryHookResult<
  ResultType,
  QueryArg,
  BaseQuery extends BaseQueryFn,
  R = UseQueryStateDefaultResult<
    QueryDefinition<QueryArg, BaseQuery, string, ResultType, string>
  >,
> = TypedUseQueryStateResult<ResultType, QueryArg, BaseQuery, R> &
  TypedUseQuerySubscriptionResult<ResultType, QueryArg, BaseQuery>

interface UseQuerySubscriptionOptions extends SubscriptionOptions {
  /**
   * 阻止查询自动运行。
   *
   * @remarks
   * 当 `skip` 为 true（或者 `arg` 中传入 `skipToken`）时：
   *
   * - **如果查询有缓存数据：**
   *   * 初始加载时**不会使用**缓存数据，并且在 `skip` 条件被移除之前，将忽略来自任何相同查询的更新
   *   * 查询的状态将为 `uninitialized`
   *   * 如果在初始加载后设置 `skip: false`，将使用缓存结果
   * - **如果查询没有缓存数据：**
   *   * 查询的状态将为 `uninitialized`
   *   * 在使用开发工具查看时，查询不会存在于状态中
   *   * 查询不会在挂载时自动获取
   *   * 当添加了其他运行相同查询的组件时，查询不会自动运行
   *
   * @example
   * ```tsx
   * // 代码块元数据 不转译 标题="Skip 示例"
   * const Pokemon = ({ name, skip }: { name: string; skip: boolean }) => {
   *   const { data, error, status } = useGetPokemonByNameQuery(name, {
   *     skip,
   *   });
   *
   *   return (
   *     <div>
   *       {name} - {status}
   *     </div>
   *   );
   * };
   * ```
   */
  skip?: boolean
  /**
   * 默认为 `false`。此设置允许你控制如果已有缓存结果，RTK Query 是否只提供缓存结果，或者如果设置为 `true` 或者自上次成功查询结果已经过去足够的时间，它应该 `refetch`。
   * - `false` - 不会导致查询被执行，_除非_ 它还不存在。
   * - `true` - 当添加新的查询订阅者时，总是会重新获取。行为与调用 `refetch` 回调或在 action 创建器中传递 `forceRefetch: true` 相同。
   * - `number` - **值以秒为单位**。如果提供了一个数字并且缓存中存在一个查询，它将比较当前时间与上次满足的时间戳，并且只有当足够的时间已经过去时才会重新获取。
   *
   * 如果你在 `skip: true` 旁边指定了此选项，这个**不会被评估**，直到 `skip` 为 false。
   */
  refetchOnMountOrArgChange?: boolean | number
}

/**
 * 一个 React 钩子，它自动触发从端点获取数据，并将组件 '订阅' 到缓存数据。
 *
 * 查询参数被用作缓存键。改变查询参数将告诉钩子如果数据在缓存中不存在则重新获取数据。
 *
 * 注意，这个钩子不返回请求状态或缓存数据。对于这种用例，请查看 [`useQuery`](#usequery) 或 [`useQueryState`](#usequerystate)。
 *
 * #### 特性
 *
 * - 根据钩子参数和是否存在缓存数据，默认自动触发请求以检索数据
 * - '订阅' 组件以保持缓存数据在存储中，并在组件卸载时 '取消订阅'
 * - 接受轮询/重新获取选项，当满足相应条件时触发自动重新获取
 */
export type UseQuerySubscription<
  D extends QueryDefinition<any, any, any, any>,
> = (
  arg: QueryArgFrom<D> | SkipToken,
  options?: UseQuerySubscriptionOptions,
) => UseQuerySubscriptionResult<D>

export type TypedUseQuerySubscription<
  ResultType,
  QueryArg,
  BaseQuery extends BaseQueryFn,
> = UseQuerySubscription<
  QueryDefinition<QueryArg, BaseQuery, string, ResultType, string>
>

export type UseQuerySubscriptionResult<
  D extends QueryDefinition<any, any, any, any>,
> = Pick<QueryActionCreatorResult<D>, 'refetch'>

/**
 * 辅助类型，用于在用户代码中手动类型化
 * `useQuerySubscription` 钩子的结果。
 */
export type TypedUseQuerySubscriptionResult<
  ResultType,
  QueryArg,
  BaseQuery extends BaseQueryFn,
> = UseQuerySubscriptionResult<
  QueryDefinition<QueryArg, BaseQuery, string, ResultType, string>
>

export type UseLazyQueryLastPromiseInfo<
  D extends QueryDefinition<any, any, any, any>,
> = {
  lastArg: QueryArgFrom<D>
}

/**
 * 一个类似于 [`useQuery`](#usequery) 的 React 钩子，但对数据获取的时间有手动控制。
 *
 * 这个钩子包含了 [`useLazyQuerySubscription`](#uselazyquerysubscription) 的功能。
 *
 * #### 特性
 *
 * - 手动控制触发请求以检索数据
 * - '订阅' 组件以保持缓存数据在存储中，并在组件卸载时 '取消订阅'
 * - 从 Redux 存储中返回最新的请求状态和缓存数据
 * - 随着请求状态的变化和数据的可用性重新渲染
 * - 接受轮询/重新获取选项，当满足相应条件并且至少手动调用了一次获取时，触发自动重新获取
 *
 * #### 注意
 *
 * 当从 LazyQuery 返回的触发函数被调用时，即使有缓存数据，它总是启动一个新的请求到服务器。如果你希望它立即返回一个缓存值（如果存在的话），请将 `preferCacheValue`（函数的第二个参数）设置为 `true`。
 */
export type UseLazyQuery<D extends QueryDefinition<any, any, any, any>> = <
  R extends Record<string, any> = UseQueryStateDefaultResult<D>,
>(
  options?: SubscriptionOptions & Omit<UseQueryStateOptions<D, R>, 'skip'>,
) => [
  LazyQueryTrigger<D>,
  UseQueryStateResult<D, R>,
  UseLazyQueryLastPromiseInfo<D>,
]

export type TypedUseLazyQuery<
  ResultType,
  QueryArg,
  BaseQuery extends BaseQueryFn,
> = UseLazyQuery<
  QueryDefinition<QueryArg, BaseQuery, string, ResultType, string>
>

export type LazyQueryTrigger<D extends QueryDefinition<any, any, any, any>> = {
  /**
   * 触发一个懒查询。
   *
   * 默认情况下，即使缓存中已经有值，这也会启动一个新的请求。如果你希望使用缓存值，并且只有在没有缓存值的情况下才开始请求，将第二个参数设置为 `true`。
   *
   * @remarks
   * 如果你需要在懒查询后立即访问错误或成功的负载，你可以链式调用 .unwrap()。
   *
   * @example
   * ```ts
   * // 代码块元数据 标题="使用 .unwrap 和 async await"
   * try {
   *   const payload = await getUserById(1).unwrap();
   *   console.log('fulfilled', payload)
   * } catch (error) {
   *   console.error('rejected', error);
   * }
   * ```
   */
  (
    arg: QueryArgFrom<D>,
    preferCacheValue?: boolean,
  ): QueryActionCreatorResult<D>
}

export type TypedLazyQueryTrigger<
  ResultType,
  QueryArg,
  BaseQuery extends BaseQueryFn,
> = LazyQueryTrigger<
  QueryDefinition<QueryArg, BaseQuery, string, ResultType, string>
>

/**
 * 一个类似于 [`useQuerySubscription`](#usequerysubscription) 的 React 钩子，但对数据获取的时间有手动控制。
 *
 * 注意，这个钩子不返回请求状态或缓存数据。对于这种用例，请查看 [`useLazyQuery`](#uselazyquery)。
 *
 * #### 特性
 *
 * - 手动控制触发请求以检索数据
 * - '订阅' 组件以保持缓存数据在存储中，并在组件卸载时 '取消订阅'
 * - 接受轮询/重新获取选项，当满足相应条件并且至少手动调用了一次获取时，触发自动重新获取
 */
export type UseLazyQuerySubscription<
  D extends QueryDefinition<any, any, any, any>,
> = (
  options?: SubscriptionOptions,
) => readonly [LazyQueryTrigger<D>, QueryArgFrom<D> | UninitializedValue]

export type TypedUseLazyQuerySubscription<
  ResultType,
  QueryArg,
  BaseQuery extends BaseQueryFn,
> = UseLazyQuerySubscription<
  QueryDefinition<QueryArg, BaseQuery, string, ResultType, string>
>

export type QueryStateSelector<
  R extends Record<string, any>,
  D extends QueryDefinition<any, any, any, any>,
> = (state: UseQueryStateDefaultResult<D>) => R

/**
 * 一个React钩子，从Redux存储中读取请求状态和缓存数据。当加载状态改变和数据变得可用时，组件将重新渲染。
 *
 * 注意，这个钩子不会触发获取新数据。对于这种用例，请查看 [`useQuery`](#usequery) 或 [`useQuerySubscription`](#usequerysubscription)。
 *
 * #### 特性
 *
 * - 从Redux存储中返回最新的请求状态和缓存数据
 * - 当请求状态改变和数据变得可用时重新渲染
 */
export type UseQueryState<D extends QueryDefinition<any, any, any, any>> = <
  R extends Record<string, any> = UseQueryStateDefaultResult<D>,
>(
  arg: QueryArgFrom<D> | SkipToken,
  options?: UseQueryStateOptions<D, R>,
) => UseQueryStateResult<D, R>

export type TypedUseQueryState<
  ResultType,
  QueryArg,
  BaseQuery extends BaseQueryFn,
> = UseQueryState<
  QueryDefinition<QueryArg, BaseQuery, string, ResultType, string>
>

export type UseQueryStateOptions<
  D extends QueryDefinition<any, any, any, any>,
  R extends Record<string, any>,
> = {
  /**
   * 阻止查询自动运行。
   *
   * @remarks
   * 当skip为true时：
   *
   * - **如果查询有缓存数据：**
   *   * 初始加载**不会使用**缓存数据，并且会忽略任何相同查询的更新，直到移除`skip`条件
   *   * 查询将有一个`uninitialized`的状态
   *   * 如果在跳过初始加载后设置`skip: false`，将使用缓存结果
   * - **如果查询没有缓存数据：**
   *   * 查询将有一个`uninitialized`的状态
   *   * 当使用开发工具查看时，查询将不会存在于状态中
   *   * 查询将不会在挂载时自动获取
   *   * 当添加了其他运行相同查询的组件时，查询不会自动运行
   *
   * @example
   * ```ts
   * // 代码块元数据 标题="跳过示例"
   * const Pokemon = ({ name, skip }: { name: string; skip: boolean }) => {
   *   const { data, error, status } = useGetPokemonByNameQuery(name, {
   *     skip,
   *   });
   *
   *   return (
   *     <div>
   *       {name} - {status}
   *     </div>
   *   );
   * };
   * ```
   */
  skip?: boolean
  /**
   * `selectFromResult`允许你以高效的方式从查询结果中获取特定段落。
   * 使用此功能时，除非所选项的底层数据已更改，否则组件不会重新渲染。
   * 如果所选项是更大集合中的一个元素，它将忽略同一集合中的元素的更改。
   *
   * @example
   * ```ts
   * // 代码块元数据 标题="使用selectFromResult提取单个结果"
   * function PostsList() {
   *   const { data: posts } = api.useGetPostsQuery();
   *
   *   return (
   *     <ul>
   *       {posts?.data?.map((post) => (
   *         <PostById key={post.id} id={post.id} />
   *       ))}
   *     </ul>
   *   );
   * }
   *
   * function PostById({ id }: { id: number }) {
   *   // 将选择给定id的帖子，并且只有在给定帖子的数据更改时才会重新渲染
   *   const { post } = api.useGetPostsQuery(undefined, {
   *     selectFromResult: ({ data }) => ({ post: data?.find((post) => post.id === id) }),
   *   });
   *
   *   return <li>{post?.name}</li>;
   * }
   * ```
   */
  selectFromResult?: QueryStateSelector<R, D>
}

export type UseQueryStateResult<
  _ extends QueryDefinition<any, any, any, any>,
  R,
> = TSHelpersNoInfer<R>

/**
 * 辅助类型，用于在用户代码中手动类型化`useQueryState`钩子的结果。
 */
export type TypedUseQueryStateResult<
  ResultType,
  QueryArg,
  BaseQuery extends BaseQueryFn,
  R = UseQueryStateDefaultResult<
    QueryDefinition<QueryArg, BaseQuery, string, ResultType, string>
  >,
> = TSHelpersNoInfer<R>

type UseQueryStateBaseResult<D extends QueryDefinition<any, any, any, any>> =
  QuerySubState<D> & {
    /**
     * `data`尽可能地持有数据，也重用
     * 钩子传入的最后参数的数据，此属性
     * 将始终包含查询的接收数据，对于当前的查询参数。
     */
    currentData?: ResultTypeFrom<D>
    /**
     * 查询尚未开始。
     */
    isUninitialized: false
    /**
     * 查询当前正在首次加载。还没有数据。
     */
    isLoading: false
    /**
     * 查询当前正在获取，但可能有来自早期请求的数据。
     */
    isFetching: false
    /**
     * 查询有来自成功加载的数据。
     */
    isSuccess: false
    /**
     * 查询当前处于"错误"状态。
     */
    isError: false
  }

type UseQueryStateDefaultResult<D extends QueryDefinition<any, any, any, any>> =
  TSHelpersId<
    | TSHelpersOverride<
        Extract<
          UseQueryStateBaseResult<D>,
          { status: QueryStatus.uninitialized }
        >,
        { isUninitialized: true }
      >
    | TSHelpersOverride<
        UseQueryStateBaseResult<D>,
        | { isLoading: true; isFetching: boolean; data: undefined }
        | ({
            isSuccess: true
            isFetching: true
            error: undefined
          } & Required<
            Pick<UseQueryStateBaseResult<D>, 'data' | 'fulfilledTimeStamp'>
          >)
        | ({
            isSuccess: true
            isFetching: false
            error: undefined
          } & Required<
            Pick<
              UseQueryStateBaseResult<D>,
              'data' | 'fulfilledTimeStamp' | 'currentData'
            >
          >)
        | ({ isError: true } & Required<
            Pick<UseQueryStateBaseResult<D>, 'error'>
          >)
      >
  > & {
    /**
     * @deprecated 包含在内以完整性，但不推荐使用。
     * 请使用 `isLoading`，`isFetching`，`isSuccess`，`isError`
     * 和 `isUninitialized` 标志代替
     */
    status: QueryStatus
  }

export type MutationStateSelector<
  R extends Record<string, any>,
  D extends MutationDefinition<any, any, any, any>,
> = (state: MutationResultSelectorResult<D>) => R

export type UseMutationStateOptions<
  D extends MutationDefinition<any, any, any, any>,
  R extends Record<string, any>,
> = {
  selectFromResult?: MutationStateSelector<R, D>
  fixedCacheKey?: string
}

export type UseMutationStateResult<
  D extends MutationDefinition<any, any, any, any>,
  R,
> = TSHelpersNoInfer<R> & {
  originalArgs?: QueryArgFrom<D>
  /**
   * 将钩子状态重置为其初始的 `uninitialized` 状态。
   * 这也将从缓存中移除最后的结果。
   */
  reset: () => void
}

/**
 * 辅助类型，用于在用户代码中手动输入 `useMutation` 钩子的结果。
 */
export type TypedUseMutationResult<
  ResultType,
  QueryArg,
  BaseQuery extends BaseQueryFn,
  R = MutationResultSelectorResult<
    MutationDefinition<QueryArg, BaseQuery, string, ResultType, string>
  >,
> = UseMutationStateResult<
  MutationDefinition<QueryArg, BaseQuery, string, ResultType, string>,
  R
>

/**
 * 一个React钩子，它让你触发给定端点的更新请求，并让组件订阅从Redux存储中读取请求状态。当加载状态改变时，组件将重新渲染。
 *
 * #### 特性
 *
 * - 手动控制触发请求以更改服务器上的数据或可能使缓存失效
 * - '订阅' 组件以保持缓存数据在存储中，并在组件卸载时 '取消订阅'
 * - 从Redux存储中返回最新的请求状态和缓存数据
 * - 当请求状态改变和数据变得可用时重新渲染
 */
export type UseMutation<D extends MutationDefinition<any, any, any, any>> = <
  R extends Record<string, any> = MutationResultSelectorResult<D>,
>(
  options?: UseMutationStateOptions<D, R>,
) => readonly [MutationTrigger<D>, UseMutationStateResult<D, R>]

export type TypedUseMutation<
  ResultType,
  QueryArg,
  BaseQuery extends BaseQueryFn,
> = UseMutation<
  MutationDefinition<QueryArg, BaseQuery, string, ResultType, string>
>

export type MutationTrigger<D extends MutationDefinition<any, any, any, any>> =
  {
    /**
     * 触发变异并返回一个Promise。
     * @remarks
     * 如果你需要在变异后立即访问错误或成功的负载，你可以链式调用 .unwrap()。
     *
     * @example
     * ```ts
     * // 代码块元数据 标题="使用 .unwrap 和 async await"
     * try {
     *   const payload = await addPost({ id: 1, name: 'Example' }).unwrap();
     *   console.log('fulfilled', payload)
     * } catch (error) {
     *   console.error('rejected', error);
     * }
     * ```
     */
    (arg: QueryArgFrom<D>): MutationActionCreatorResult<D>
  }

export type TypedMutationTrigger<
  ResultType,
  QueryArg,
  BaseQuery extends BaseQueryFn,
> = MutationTrigger<
  MutationDefinition<QueryArg, BaseQuery, string, ResultType, string>
>

/**
 * `useQuery`中使用的`defaultQueryStateSelector`的包装器。
 * 我们希望初始渲染已经返回
 * `{ isUninitialized: false, isFetching: true, isLoading: true }`
 * 以防止库用户必须进行额外的`isUninitialized`检查。
 */
const noPendingQueryStateSelector: QueryStateSelector<any, any> = (
  selected,
) => {
  if (selected.isUninitialized) {
    return {
      ...selected,
      isUninitialized: false,
      isFetching: true,
      isLoading: selected.data !== undefined ? false : true,
      status: QueryStatus.pending,
    } as any
  }
  return selected
}

type GenericPrefetchThunk = (
  endpointName: any,
  arg: any,
  options: PrefetchOptions,
) => ThunkAction<void, any, any, UnknownAction>

/**
 *
 * @param opts.api - 一个定义了端点以创建钩子的API
 * @param opts.moduleOptions.batch - 要使用的 `batchedUpdates` 函数的版本
 * @param opts.moduleOptions.useDispatch - 要使用的 `useDispatch` 钩子的版本
 * @param opts.moduleOptions.useSelector - 要使用的 `useSelector` 钩子的版本
 * @returns 一个包含基于端点生成钩子的函数的对象
 */
export function buildHooks<Definitions extends EndpointDefinitions>({
  api,
  moduleOptions: {
    batch,
    hooks: { useDispatch, useSelector, useStore },
    unstable__sideEffectsInRender,
    createSelector,
  },
  serializeQueryArgs,
  context,
}: {
  api: Api<any, Definitions, any, any, CoreModule>
  moduleOptions: Required<ReactHooksModuleOptions>
  serializeQueryArgs: SerializeQueryArgs<any>
  context: ApiContext<Definitions>
}) {
  const usePossiblyImmediateEffect: (
    effect: () => void | undefined,
    deps?: DependencyList,
  ) => void = unstable__sideEffectsInRender ? (cb) => cb() : useEffect

  return { buildQueryHooks, buildMutationHook, usePrefetch }

  function queryStatePreSelector(
    currentState: QueryResultSelectorResult<any>,
    lastResult: UseQueryStateDefaultResult<any> | undefined,
    queryArgs: any,
  ): UseQueryStateDefaultResult<any> {
    // 如果我们有上一次的结果，而当前的结果是未初始化的，
    // 我们可能已经调用了 `api.util.resetApiState`
    // 在这种情况下，重置钩子
    if (lastResult?.endpointName && currentState.isUninitialized) {
      const { endpointName } = lastResult
      const endpointDefinition = context.endpointDefinitions[endpointName]
      if (
        serializeQueryArgs({
          queryArgs: lastResult.originalArgs,
          endpointDefinition,
          endpointName,
        }) ===
        serializeQueryArgs({
          queryArgs,
          endpointDefinition,
          endpointName,
        })
      )
        lastResult = undefined
    }

    // data 是我们已经跟踪的最后一个已知的良好请求结果 - 或者如果还没有跟踪到任何结果，那么就是当前参数的最后一个良好结果
    let data = currentState.isSuccess ? currentState.data : lastResult?.data
    if (data === undefined) data = currentState.data

    const hasData = data !== undefined

    // 当请求在执行时，isFetching = true
    const isFetching = currentState.isLoading
    // 当加载时还没有数据（缓存中没有数据的初始加载），isLoading = true
    const isLoading = !hasData && isFetching
    // 当数据存在时，isSuccess = true
    const isSuccess = currentState.isSuccess || (isFetching && hasData)

    return {
      ...currentState,
      data,
      currentData: currentState.data,
      isFetching,
      isLoading,
      isSuccess,
    } as UseQueryStateDefaultResult<any>
  }

  function usePrefetch<EndpointName extends QueryKeys<Definitions>>(
    endpointName: EndpointName,
    defaultOptions?: PrefetchOptions,
  ) {
    const dispatch = useDispatch<ThunkDispatch<any, any, UnknownAction>>()
    const stableDefaultOptions = useShallowStableValue(defaultOptions)

    return useCallback(
      (arg: any, options?: PrefetchOptions) =>
        dispatch(
          (api.util.prefetch as GenericPrefetchThunk)(endpointName, arg, {
            ...stableDefaultOptions,
            ...options,
          }),
        ),
      [endpointName, dispatch, stableDefaultOptions],
    )
  }

  function buildQueryHooks(name: string): QueryHooks<any> {
    const useQuerySubscription: UseQuerySubscription<any> = (
      arg: any,
      {
        refetchOnReconnect,
        refetchOnFocus,
        refetchOnMountOrArgChange,
        skip = false,
        pollingInterval = 0,
        skipPollingIfUnfocused = false,
      } = {},
    ) => {
      const { initiate } = api.endpoints[name] as ApiEndpointQuery<
        QueryDefinition<any, any, any, any, any>,
        Definitions
      >
      const dispatch = useDispatch<ThunkDispatch<any, any, UnknownAction>>()
      const subscriptionSelectorsRef = useRef<SubscriptionSelectors>()
      if (!subscriptionSelectorsRef.current) {
        const returnedValue = dispatch(
          api.internalActions.internal_getRTKQSubscriptions(),
        )

        if (process.env.NODE_ENV !== 'production') {
          if (
            typeof returnedValue !== 'object' ||
            typeof returnedValue?.type === 'string'
          ) {
            throw new Error(
              `Warning: Middleware for RTK-Query API at reducerPath "${api.reducerPath}" has not been added to the store.
    You must add the middleware for RTK-Query to function correctly!`,
            )
          }
        }

        subscriptionSelectorsRef.current =
          returnedValue as unknown as SubscriptionSelectors
      }
      const stableArg = useStableQueryArgs(
        skip ? skipToken : arg,
        // 即使用户为每个端点提供了一个 `serializeQueryArgs` ，并且
        // 返回值是一致的，_在这里_ 我们想使用默认行为
        // 这样我们可以判断 _是否有任何东西_ 实际上发生了变化。否则，我们可能会遇到
        // 查询参数确实发生了变化，但序列化没有变化，
        // 然后我们永远不会尝试启动重新获取。
        defaultSerializeQueryArgs,
        context.endpointDefinitions[name],
        name,
      )
      const stableSubscriptionOptions = useShallowStableValue({
        refetchOnReconnect,
        refetchOnFocus,
        pollingInterval,
        skipPollingIfUnfocused,
      })

      const lastRenderHadSubscription = useRef(false)

      const promiseRef = useRef<QueryActionCreatorResult<any>>()

      let { queryCacheKey, requestId } = promiseRef.current || {}

      // HACK 我们已经将中间件订阅查找回调保存到一个ref中，
      // 所以我们可以直接在这里检查这个查询的订阅是否存在。
      let currentRenderHasSubscription = false
      if (queryCacheKey && requestId) {
        currentRenderHasSubscription =
          subscriptionSelectorsRef.current.isRequestSubscribed(
            queryCacheKey,
            requestId,
          )
      }

      const subscriptionRemoved =
        !currentRenderHasSubscription && lastRenderHadSubscription.current

      usePossiblyImmediateEffect(() => {
        lastRenderHadSubscription.current = currentRenderHasSubscription
      })

      usePossiblyImmediateEffect((): void | undefined => {
        if (subscriptionRemoved) {
          promiseRef.current = undefined
        }
      }, [subscriptionRemoved])

      usePossiblyImmediateEffect((): void | undefined => {
        const lastPromise = promiseRef.current
        if (
          typeof process !== 'undefined' &&
          process.env.NODE_ENV === 'removeMeOnCompilation'
        ) {
          // this is only present to enforce the rule of hooks to keep `isSubscribed` in the dependency array
          console.log(subscriptionRemoved)
        }

        if (stableArg === skipToken) {
          lastPromise?.unsubscribe()
          promiseRef.current = undefined
          return
        }

        const lastSubscriptionOptions = promiseRef.current?.subscriptionOptions

        if (!lastPromise || lastPromise.arg !== stableArg) {
          lastPromise?.unsubscribe()
          const promise = dispatch(
            initiate(stableArg, {
              subscriptionOptions: stableSubscriptionOptions,
              forceRefetch: refetchOnMountOrArgChange,
            }),
          )

          promiseRef.current = promise
        } else if (stableSubscriptionOptions !== lastSubscriptionOptions) {
          lastPromise.updateSubscriptionOptions(stableSubscriptionOptions)
        }
      }, [
        dispatch,
        initiate,
        refetchOnMountOrArgChange,
        stableArg,
        stableSubscriptionOptions,
        subscriptionRemoved,
      ])

      useEffect(() => {
        return () => {
          promiseRef.current?.unsubscribe()
          promiseRef.current = undefined
        }
      }, [])

      return useMemo(
        () => ({
          /**
           * A method to manually refetch data for the query
           */
          refetch: () => {
            if (!promiseRef.current)
              throw new Error(
                'Cannot refetch a query that has not been started yet.',
              )
            return promiseRef.current?.refetch()
          },
        }),
        [],
      )
    }

    const useLazyQuerySubscription: UseLazyQuerySubscription<any> = ({
      refetchOnReconnect,
      refetchOnFocus,
      pollingInterval = 0,
      skipPollingIfUnfocused = false,
    } = {}) => {
      const { initiate } = api.endpoints[name] as ApiEndpointQuery<
        QueryDefinition<any, any, any, any, any>,
        Definitions
      >
      const dispatch = useDispatch<ThunkDispatch<any, any, UnknownAction>>()

      const [arg, setArg] = useState<any>(UNINITIALIZED_VALUE)
      const promiseRef = useRef<QueryActionCreatorResult<any> | undefined>()

      const stableSubscriptionOptions = useShallowStableValue({
        refetchOnReconnect,
        refetchOnFocus,
        pollingInterval,
        skipPollingIfUnfocused,
      })

      usePossiblyImmediateEffect(() => {
        const lastSubscriptionOptions = promiseRef.current?.subscriptionOptions

        if (stableSubscriptionOptions !== lastSubscriptionOptions) {
          promiseRef.current?.updateSubscriptionOptions(
            stableSubscriptionOptions,
          )
        }
      }, [stableSubscriptionOptions])

      const subscriptionOptionsRef = useRef(stableSubscriptionOptions)
      usePossiblyImmediateEffect(() => {
        subscriptionOptionsRef.current = stableSubscriptionOptions
      }, [stableSubscriptionOptions])

      const trigger = useCallback(
        function (arg: any, preferCacheValue = false) {
          let promise: QueryActionCreatorResult<any>

          batch(() => {
            promiseRef.current?.unsubscribe()

            promiseRef.current = promise = dispatch(
              initiate(arg, {
                subscriptionOptions: subscriptionOptionsRef.current,
                forceRefetch: !preferCacheValue,
              }),
            )

            setArg(arg)
          })

          return promise!
        },
        [dispatch, initiate],
      )

      /* cleanup on unmount */
      useEffect(() => {
        return () => {
          promiseRef?.current?.unsubscribe()
        }
      }, [])

      /* if "cleanup on unmount" was triggered from a fast refresh, we want to reinstate the query */
      useEffect(() => {
        if (arg !== UNINITIALIZED_VALUE && !promiseRef.current) {
          trigger(arg, true)
        }
      }, [arg, trigger])

      return useMemo(() => [trigger, arg] as const, [trigger, arg])
    }

    const useQueryState: UseQueryState<any> = (
      arg: any,
      { skip = false, selectFromResult } = {},
    ) => {
      const { select } = api.endpoints[name] as ApiEndpointQuery<
        QueryDefinition<any, any, any, any, any>,
        Definitions
      >
      const stableArg = useStableQueryArgs(
        skip ? skipToken : arg,
        serializeQueryArgs,
        context.endpointDefinitions[name],
        name,
      )

      type ApiRootState = Parameters<ReturnType<typeof select>>[0]

      const lastValue = useRef<any>()

      const selectDefaultResult: Selector<ApiRootState, any, [any]> = useMemo(
        () =>
          createSelector(
            [
              select(stableArg),
              (_: ApiRootState, lastResult: any) => lastResult,
              (_: ApiRootState) => stableArg,
            ],
            queryStatePreSelector,
            {
              memoizeOptions: {
                resultEqualityCheck: shallowEqual,
              },
            },
          ),
        [select, stableArg],
      )

      const querySelector: Selector<ApiRootState, any, [any]> = useMemo(
        () =>
          selectFromResult
            ? createSelector([selectDefaultResult], selectFromResult, {
                devModeChecks: { identityFunctionCheck: 'never' },
              })
            : selectDefaultResult,
        [selectDefaultResult, selectFromResult],
      )

      const currentState = useSelector(
        (state: RootState<Definitions, any, any>) =>
          querySelector(state, lastValue.current),
        shallowEqual,
      )

      const store = useStore<RootState<Definitions, any, any>>()
      const newLastValue = selectDefaultResult(
        store.getState(),
        lastValue.current,
      )
      useIsomorphicLayoutEffect(() => {
        lastValue.current = newLastValue
      }, [newLastValue])

      return currentState
    }

    return {
      useQueryState,
      useQuerySubscription,
      useLazyQuerySubscription,
      useLazyQuery(options) {
        const [trigger, arg] = useLazyQuerySubscription(options)
        const queryStateResults = useQueryState(arg, {
          ...options,
          skip: arg === UNINITIALIZED_VALUE,
        })

        const info = useMemo(() => ({ lastArg: arg }), [arg])
        return useMemo(
          () => [trigger, queryStateResults, info],
          [trigger, queryStateResults, info],
        )
      },
      useQuery(arg, options) {
        const querySubscriptionResults = useQuerySubscription(arg, options)
        const queryStateResults = useQueryState(arg, {
          selectFromResult:
            arg === skipToken || options?.skip
              ? undefined
              : noPendingQueryStateSelector,
          ...options,
        })

        const { data, status, isLoading, isSuccess, isError, error } =
          queryStateResults
        useDebugValue({ data, status, isLoading, isSuccess, isError, error })

        return useMemo(
          () => ({ ...queryStateResults, ...querySubscriptionResults }),
          [queryStateResults, querySubscriptionResults],
        )
      },
    }
  }

  function buildMutationHook(name: string): UseMutation<any> {
    return ({ selectFromResult, fixedCacheKey } = {}) => {
      const { select, initiate } = api.endpoints[name] as ApiEndpointMutation<
        MutationDefinition<any, any, any, any, any>,
        Definitions
      >
      const dispatch = useDispatch<ThunkDispatch<any, any, UnknownAction>>()
      const [promise, setPromise] = useState<MutationActionCreatorResult<any>>()

      useEffect(
        () => () => {
          if (!promise?.arg.fixedCacheKey) {
            promise?.reset()
          }
        },
        [promise],
      )

      const triggerMutation = useCallback(
        function (arg: Parameters<typeof initiate>['0']) {
          const promise = dispatch(initiate(arg, { fixedCacheKey }))
          setPromise(promise)
          return promise
        },
        [dispatch, initiate, fixedCacheKey],
      )

      const { requestId } = promise || {}
      const selectDefaultResult = useMemo(
        () => select({ fixedCacheKey, requestId: promise?.requestId }),
        [fixedCacheKey, promise, select],
      )
      const mutationSelector = useMemo(
        (): Selector<RootState<Definitions, any, any>, any> =>
          selectFromResult
            ? createSelector([selectDefaultResult], selectFromResult)
            : selectDefaultResult,
        [selectFromResult, selectDefaultResult],
      )

      const currentState = useSelector(mutationSelector, shallowEqual)
      const originalArgs =
        fixedCacheKey == null ? promise?.arg.originalArgs : undefined
      const reset = useCallback(() => {
        batch(() => {
          if (promise) {
            setPromise(undefined)
          }
          if (fixedCacheKey) {
            dispatch(
              api.internalActions.removeMutationResult({
                requestId,
                fixedCacheKey,
              }),
            )
          }
        })
      }, [dispatch, fixedCacheKey, promise, requestId])

      const {
        endpointName,
        data,
        status,
        isLoading,
        isSuccess,
        isError,
        error,
      } = currentState
      useDebugValue({
        endpointName,
        data,
        status,
        isLoading,
        isSuccess,
        isError,
        error,
      })

      const finalState = useMemo(
        () => ({ ...currentState, originalArgs, reset }),
        [currentState, originalArgs, reset],
      )

      return useMemo(
        () => [triggerMutation, finalState] as const,
        [triggerMutation, finalState],
      )
    }
  }
}
