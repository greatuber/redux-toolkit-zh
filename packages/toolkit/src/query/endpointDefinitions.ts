import type { SerializeQueryArgs } from './defaultSerializeQueryArgs'
import type { QuerySubState, RootState } from './core/apiState'
import type {
  BaseQueryExtraOptions,
  BaseQueryFn,
  BaseQueryResult,
  BaseQueryArg,
  BaseQueryApi,
  QueryReturnValue,
  BaseQueryError,
  BaseQueryMeta,
} from './baseQueryTypes'
import type {
  HasRequiredProps,
  MaybePromise,
  OmitFromUnion,
  CastAny,
  NonUndefined,
  UnwrapPromise,
} from './tsHelpers'
import type { NEVER } from './fakeBaseQuery'
import type { Api } from '@reduxjs/toolkit/query'

const resultType = /* @__PURE__ */ Symbol()
const baseQuery = /* @__PURE__ */ Symbol()

interface EndpointDefinitionWithQuery<
  QueryArg,
  BaseQuery extends BaseQueryFn,
  ResultType,
> {
  /**
   * `query` 可以是一个返回 `string` 或传递给你的 `baseQuery` 的 `object` 的函数。如果你使用 [fetchBaseQuery](./fetchBaseQuery)，这可以返回一个 `string` 或 `FetchArgs` 属性的 `object`。如果你使用自定义的 [`baseQuery`](../../rtk-query/usage/customizing-queries)，你可以根据自己的喜好定制这个行为。
   *
   * @example
   *
   * ```ts
   * // 代码块元数据 标题="query 示例"
   *
   * import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
   * interface Post {
   *   id: number
   *   name: string
   * }
   * type PostsResponse = Post[]
   *
   * const api = createApi({
   *   baseQuery: fetchBaseQuery({ baseUrl: '/' }),
   *   tagTypes: ['Post'],
   *   endpoints: (build) => ({
   *     getPosts: build.query<PostsResponse, void>({
   *       // 高亮开始
   *       query: () => 'posts',
   *       // 高亮结束
   *     }),
   *     addPost: build.mutation<Post, Partial<Post>>({
   *      // 高亮开始
   *      query: (body) => ({
   *        url: `posts`,
   *        method: 'POST',
   *        body,
   *      }),
   *      // 高亮结束
   *      invalidatesTags: [{ type: 'Post', id: 'LIST' }],
   *    }),
   *   })
   * })
   * ```
   */
  query(arg: QueryArg): BaseQueryArg<BaseQuery>
  queryFn?: never
  /**
   * 用于操作查询或突变返回的数据的函数。
   */
  transformResponse?(
    baseQueryReturnValue: BaseQueryResult<BaseQuery>,
    meta: BaseQueryMeta<BaseQuery>,
    arg: QueryArg,
  ): ResultType | Promise<ResultType>
  /**
   * 用于操作失败的查询或突变返回的数据的函数。
   */
  transformErrorResponse?(
    baseQueryReturnValue: BaseQueryError<BaseQuery>,
    meta: BaseQueryMeta<BaseQuery>,
    arg: QueryArg,
  ): unknown
  /**
   * 默认为 `true`。
   *
   * 大多数应用应该保持此设置。只有当API返回极大量的数据（例如，每个请求10000行）并且你无法对其进行分页时，它才可能成为性能问题。
   *
   * 有关其工作方式的详细信息，请参见下面的链接。当它设置为 `false` 时，即使数据没有改变，每个请求也会导致订阅的组件重新渲染。
   *
   * @see https://redux-toolkit.js.org/api/other-exports#copywithstructuralsharing
   */
  structuralSharing?: boolean
}

interface EndpointDefinitionWithQueryFn<
  QueryArg,
  BaseQuery extends BaseQueryFn,
  ResultType,
> {
  /**
   * 可以用于替代 `query` 作为一个内联函数，该函数完全绕过了端点的 `baseQuery`。
   *
   * @example
   * ```ts
   * // 代码块元数据 标题="基础 queryFn 示例"
   *
   * import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
   * interface Post {
   *   id: number
   *   name: string
   * }
   * type PostsResponse = Post[]
   *
   * const api = createApi({
   *   baseQuery: fetchBaseQuery({ baseUrl: '/' }),
   *   endpoints: (build) => ({
   *     getPosts: build.query<PostsResponse, void>({
   *       query: () => 'posts',
   *     }),
   *     flipCoin: build.query<'heads' | 'tails', void>({
   *       // 高亮开始
   *       queryFn(arg, queryApi, extraOptions, baseQuery) {
   *         const randomVal = Math.random()
   *         if (randomVal < 0.45) {
   *           return { data: 'heads' }
   *         }
   *         if (randomVal < 0.9) {
   *           return { data: 'tails' }
   *         }
   *         return { error: { status: 500, statusText: 'Internal Server Error', data: "Coin landed on it's edge!" } }
   *       }
   *       // 高亮结束
   *     })
   *   })
   * })
   * ```
   */
  queryFn(
    arg: QueryArg,
    api: BaseQueryApi,
    extraOptions: BaseQueryExtraOptions<BaseQuery>,
    baseQuery: (arg: Parameters<BaseQuery>[0]) => ReturnType<BaseQuery>,
  ): MaybePromise<
    QueryReturnValue<
      ResultType,
      BaseQueryError<BaseQuery>,
      BaseQueryMeta<BaseQuery>
    >
  >
  query?: never
  transformResponse?: never
  transformErrorResponse?: never
  /**
   * Defaults to `true`.
   *
   * Most apps should leave this setting on. The only time it can be a performance issue
   * is if an API returns extremely large amounts of data (e.g. 10,000 rows per request) and
   * you're unable to paginate it.
   *
   * For details of how this works, please see the below. When it is set to `false`,
   * every request will cause subscribed components to rerender, even when the data has not changed.
   *
   * @see https://redux-toolkit.js.org/api/other-exports#copywithstructuralsharing
   */
  structuralSharing?: boolean
}

export interface BaseEndpointTypes<
  QueryArg,
  BaseQuery extends BaseQueryFn,
  ResultType,
> {
  QueryArg: QueryArg
  BaseQuery: BaseQuery
  ResultType: ResultType
}

export type BaseEndpointDefinition<
  QueryArg,
  BaseQuery extends BaseQueryFn,
  ResultType,
> = (
  | ([CastAny<BaseQueryResult<BaseQuery>, {}>] extends [NEVER]
      ? never
      : EndpointDefinitionWithQuery<QueryArg, BaseQuery, ResultType>)
  | EndpointDefinitionWithQueryFn<QueryArg, BaseQuery, ResultType>
) & {
  /* phantom type */
  [resultType]?: ResultType
  /* phantom type */
  [baseQuery]?: BaseQuery
} & HasRequiredProps<
    BaseQueryExtraOptions<BaseQuery>,
    { extraOptions: BaseQueryExtraOptions<BaseQuery> },
    { extraOptions?: BaseQueryExtraOptions<BaseQuery> }
  >

export enum DefinitionType {
  query = 'query',
  mutation = 'mutation',
}

export type GetResultDescriptionFn<
  TagTypes extends string,
  ResultType,
  QueryArg,
  ErrorType,
  MetaType,
> = (
  result: ResultType | undefined,
  error: ErrorType | undefined,
  arg: QueryArg,
  meta: MetaType,
) => ReadonlyArray<TagDescription<TagTypes>>

export type FullTagDescription<TagType> = {
  type: TagType
  id?: number | string
}
export type TagDescription<TagType> = TagType | FullTagDescription<TagType>
export type ResultDescription<
  TagTypes extends string,
  ResultType,
  QueryArg,
  ErrorType,
  MetaType,
> =
  | ReadonlyArray<TagDescription<TagTypes>>
  | GetResultDescriptionFn<TagTypes, ResultType, QueryArg, ErrorType, MetaType>

export interface QueryTypes<
  QueryArg,
  BaseQuery extends BaseQueryFn,
  TagTypes extends string,
  ResultType,
  ReducerPath extends string = string,
> extends BaseEndpointTypes<QueryArg, BaseQuery, ResultType> {
  /**
   * The endpoint definition type. To be used with some internal generic types.
   * @example
   * ```ts
   * const useMyWrappedHook: UseQuery<typeof api.endpoints.query.Types.QueryDefinition> = ...
   * ```
   */
  QueryDefinition: QueryDefinition<
    QueryArg,
    BaseQuery,
    TagTypes,
    ResultType,
    ReducerPath
  >
  TagTypes: TagTypes
  ReducerPath: ReducerPath
}

export interface QueryExtraOptions<
  TagTypes extends string,
  ResultType,
  QueryArg,
  BaseQuery extends BaseQueryFn,
  ReducerPath extends string = string,
> {
  type: DefinitionType.query
  /**
   * 由 `query` 端点使用。确定哪个 'tag' 附加到查询返回的缓存数据上。
   * 期望一个标签类型字符串的数组，一个带有 id 的标签类型对象的数组，或者一个返回这样的数组的函数。
   * 1.  `['Post']` - 等同于 `2`
   * 2.  `[{ type: 'Post' }]` - 等同于 `1`
   * 3.  `[{ type: 'Post', id: 1 }]`
   * 4.  `(result, error, arg) => ['Post']` - 等同于 `5`
   * 5.  `(result, error, arg) => [{ type: 'Post' }]` - 等同于 `4`
   * 6.  `(result, error, arg) => [{ type: 'Post', id: 1 }]`
   *
   * @example
   *
   * ```ts
   * // 代码块元数据 标题="providesTags 示例"
   *
   * import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
   * interface Post {
   *   id: number
   *   name: string
   * }
   * type PostsResponse = Post[]
   *
   * const api = createApi({
   *   baseQuery: fetchBaseQuery({ baseUrl: '/' }),
   *   tagTypes: ['Posts'],
   *   endpoints: (build) => ({
   *     getPosts: build.query<PostsResponse, void>({
   *       query: () => 'posts',
   *       // 高亮开始
   *       providesTags: (result) =>
   *         result
   *           ? [
   *               ...result.map(({ id }) => ({ type: 'Posts' as const, id })),
   *               { type: 'Posts', id: 'LIST' },
   *             ]
   *           : [{ type: 'Posts', id: 'LIST' }],
   *       // 高亮结束
   *     })
   *   })
   * })
   * ```
   */
  providesTags?: ResultDescription<
    TagTypes,
    ResultType,
    QueryArg,
    BaseQueryError<BaseQuery>,
    BaseQueryMeta<BaseQuery>
  >
  /**
   * 不要使用。查询不应使缓存中的标签无效。
   */
  invalidatesTags?: never

  /**
   * 可以提供一个自定义的缓存键值，基于查询参数。
   *
   * 这主要是为了处理非序列化值作为查询参数对象的一部分传递，并且应该从缓存键中排除的情况。它也可以用于一个端点应该只有一个缓存条目的情况，比如无限加载/分页实现。
   *
   * 与只能返回字符串的 `createApi` 版本不同，这个每个端点的选项也可以返回一个对象、数字或布尔值。如果它返回一个字符串，那么这个值将直接用作缓存键。如果它返回一个对象/数字/布尔值，那么这个值将被传递给内置的 `defaultSerializeQueryArgs`。这简化了剔除你不希望包含在缓存键中的参数的用例。
   *
   *
   * @example
   *
   * ```ts
   * // 代码块元数据 标题="serializeQueryArgs : 排除值"
   *
   * import { createApi, fetchBaseQuery, defaultSerializeQueryArgs } from '@reduxjs/toolkit/query/react'
   * interface Post {
   *   id: number
   *   name: string
   * }
   *
   * interface MyApiClient {
   *   fetchPost: (id: string) => Promise<Post>
   * }
   *
   * createApi({
   *  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
   *  endpoints: (build) => ({
   *    // 示例：一个端点，API 客户端作为参数传入，
   *    // 但只有项目 ID 应该被用作缓存键
   *    getPost: build.query<Post, { id: string; client: MyApiClient }>({
   *      queryFn: async ({ id, client }) => {
   *        const post = await client.fetchPost(id)
   *        return { data: post }
   *      },
   *      // 高亮开始
   *      serializeQueryArgs: ({ queryArgs, endpointDefinition, endpointName }) => {
   *        const { id } = queryArgs
   *        // 这可以返回一个字符串、一个对象、一个数字或一个布尔值。
   *        // 如果它返回一个对象、数字或布尔值，那个值
   *        // 将通过 `defaultSerializeQueryArgs` 自动序列化
   *        return { id } // 从缓存键中省略 `client`
   *
   *        // 或者，你可以自己使用 `defaultSerializeQueryArgs`：
   *        // return defaultSerializeQueryArgs({
   *        //   endpointName,
   *        //   queryArgs: { id },
   *        //   endpointDefinition
   *        // })
   *        // 或者创建并返回一个字符串：
   *        // return `getPost(${id})`
   *      },
   *      // 高亮结束
   *    }),
   *  }),
   *})
   * ```
   */
  serializeQueryArgs?: SerializeQueryArgs<
    QueryArg,
    string | number | boolean | Record<any, any>
  >

  /**
   * 可以提供一个将传入的响应值合并到当前缓存数据的方法。
   * 如果提供了，将不会应用自动的结构共享 - 你需要适当地更新缓存。
   *
   * 由于 RTKQ 通常用新的响应替换缓存条目，你通常
   * 需要与 `serializeQueryArgs` 或 `forceRefetch` 选项一起使用这个，
   * 以保持现有的缓存条目，以便它可以被更新。
   *
   * 由于这是用 Immer 包装的，你可以直接修改 `currentCacheValue`，
   * 或者返回一个新的值，但不能同时做两者。
   *
   * 只有当现有的 `currentCacheData` 不是 `undefined` 时才会被调用 - 在第一次响应时，
   * 缓存条目将直接保存响应数据。
   *
   * 如果你不希望新的请求完全覆盖当前的缓存值，
   * 可能是因为你已经从另一个源手动更新了它，不希望这些
   * 更新丢失，这将非常有用。
   *
   *
   * @example
   *
   * ```ts
   * // 代码块元数据 标题="merge: 分页"
   *
   * import { createApi, fetchBaseQuery, defaultSerializeQueryArgs } from '@reduxjs/toolkit/query/react'
   * interface Post {
   *   id: number
   *   name: string
   * }
   *
   * createApi({
   *  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
   *  endpoints: (build) => ({
   *    listItems: build.query<string[], number>({
   *      query: (pageNumber) => `/listItems?page=${pageNumber}`,
   *     // 因为参数总是映射到一个字符串，所以只有一个缓存条目
   *     serializeQueryArgs: ({ endpointName }) => {
   *       return endpointName
   *      },
   *      // 总是将传入的数据合并到缓存条目
   *      merge: (currentCache, newItems) => {
   *        currentCache.push(...newItems)
   *      },
   *      // 当页面参数改变时重新获取
   *      forceRefetch({ currentArg, previousArg }) {
   *        return currentArg !== previousArg
   *      },
   *    }),
   *  }),
   *})
   * ```
   */
  merge?(
    currentCacheData: ResultType,
    responseData: ResultType,
    otherArgs: {
      arg: QueryArg
      baseQueryMeta: BaseQueryMeta<BaseQuery>
      requestId: string
      fulfilledTimeStamp: number
    },
  ): ResultType | void

  /**
   * 检查在通常情况下不会强制刷新的情况下，端点是否应该强制刷新。
   * 这主要用于 "无限滚动" / 分页的情况，其中
   * RTKQ 保持一个随着时间增加的单一缓存条目，结合
   * `serializeQueryArgs` 返回一个固定的缓存键和一个 `merge` 回调
   * 每次都将传入的数据添加到缓存条目中。
   *
   * @example
   *
   * ```ts
   * // 代码块元数据 标题="forceRefresh: 分页"
   *
   * import { createApi, fetchBaseQuery, defaultSerializeQueryArgs } from '@reduxjs/toolkit/query/react'
   * interface Post {
   *   id: number
   *   name: string
   * }
   *
   * createApi({
   *  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
   *  endpoints: (build) => ({
   *    listItems: build.query<string[], number>({
   *      query: (pageNumber) => `/listItems?page=${pageNumber}`,
   *     // 因为参数总是映射到一个字符串，所以只有一个缓存条目
   *     serializeQueryArgs: ({ endpointName }) => {
   *       return endpointName
   *      },
   *      // 总是将传入的数据合并到缓存条目
   *      merge: (currentCache, newItems) => {
   *        currentCache.push(...newItems)
   *      },
   *      // 当页面参数改变时重新获取
   *      forceRefetch({ currentArg, previousArg }) {
   *        return currentArg !== previousArg
   *      },
   *    }),
   *  }),
   *})
   * ```
   */
  forceRefetch?(params: {
    currentArg: QueryArg | undefined
    previousArg: QueryArg | undefined
    state: RootState<any, any, string>
    endpointState?: QuerySubState<any>
  }): boolean

  /**
   * All of these are `undefined` at runtime, purely to be used in TypeScript declarations!
   */
  Types?: QueryTypes<QueryArg, BaseQuery, TagTypes, ResultType, ReducerPath>
}

export type QueryDefinition<
  QueryArg,
  BaseQuery extends BaseQueryFn,
  TagTypes extends string,
  ResultType,
  ReducerPath extends string = string,
> = BaseEndpointDefinition<QueryArg, BaseQuery, ResultType> &
  QueryExtraOptions<TagTypes, ResultType, QueryArg, BaseQuery, ReducerPath>

export interface MutationTypes<
  QueryArg,
  BaseQuery extends BaseQueryFn,
  TagTypes extends string,
  ResultType,
  ReducerPath extends string = string,
> extends BaseEndpointTypes<QueryArg, BaseQuery, ResultType> {
  /**
   * 端点定义类型。用于一些内部泛型类型。
   * @example
   * ```ts
   * const useMyWrappedHook: UseMutation<typeof api.endpoints.query.Types.MutationDefinition> = ...
   * ```
   */
  MutationDefinition: MutationDefinition<
    QueryArg,
    BaseQuery,
    TagTypes,
    ResultType,
    ReducerPath
  >
  TagTypes: TagTypes
  ReducerPath: ReducerPath
}

export interface MutationExtraOptions<
  TagTypes extends string,
  ResultType,
  QueryArg,
  BaseQuery extends BaseQueryFn,
  ReducerPath extends string = string,
> {
  type: DefinitionType.mutation
  /**
   * 用于 `mutation` 端点。确定应该重新获取哪些缓存数据，或者从缓存中删除哪些数据。
   * 期望与 `providesTags` 相同的形状。
   *
   * @example
   *
   * ```ts
   * // 代码块元数据 标题="invalidatesTags 示例"
   * import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
   * interface Post {
   *   id: number
   *   name: string
   * }
   * type PostsResponse = Post[]
   *
   * const api = createApi({
   *   baseQuery: fetchBaseQuery({ baseUrl: '/' }),
   *   tagTypes: ['Posts'],
   *   endpoints: (build) => ({
   *     getPosts: build.query<PostsResponse, void>({
   *       query: () => 'posts',
   *       providesTags: (result) =>
   *         result
   *           ? [
   *               ...result.map(({ id }) => ({ type: 'Posts' as const, id })),
   *               { type: 'Posts', id: 'LIST' },
   *             ]
   *           : [{ type: 'Posts', id: 'LIST' }],
   *     }),
   *     addPost: build.mutation<Post, Partial<Post>>({
   *       query(body) {
   *         return {
   *           url: `posts`,
   *           method: 'POST',
   *           body,
   *         }
   *       },
   *       // 高亮开始
   *       invalidatesTags: [{ type: 'Posts', id: 'LIST' }],
   *       // 高亮结束
   *     }),
   *   })
   * })
   * ```
   */
  invalidatesTags?: ResultDescription<
    TagTypes,
    ResultType,
    QueryArg,
    BaseQueryError<BaseQuery>,
    BaseQueryMeta<BaseQuery>
  >
  /**
   * Not to be used. A mutation should not provide tags to the cache.
   */
  providesTags?: never

  /**
   * All of these are `undefined` at runtime, purely to be used in TypeScript declarations!
   */
  Types?: MutationTypes<QueryArg, BaseQuery, TagTypes, ResultType, ReducerPath>
}

export type MutationDefinition<
  QueryArg,
  BaseQuery extends BaseQueryFn,
  TagTypes extends string,
  ResultType,
  ReducerPath extends string = string,
> = BaseEndpointDefinition<QueryArg, BaseQuery, ResultType> &
  MutationExtraOptions<TagTypes, ResultType, QueryArg, BaseQuery, ReducerPath>

export type EndpointDefinition<
  QueryArg,
  BaseQuery extends BaseQueryFn,
  TagTypes extends string,
  ResultType,
  ReducerPath extends string = string,
> =
  | QueryDefinition<QueryArg, BaseQuery, TagTypes, ResultType, ReducerPath>
  | MutationDefinition<QueryArg, BaseQuery, TagTypes, ResultType, ReducerPath>

export type EndpointDefinitions = Record<
  string,
  EndpointDefinition<any, any, any, any>
>

export function isQueryDefinition(
  e: EndpointDefinition<any, any, any, any>,
): e is QueryDefinition<any, any, any, any> {
  return e.type === DefinitionType.query
}

export function isMutationDefinition(
  e: EndpointDefinition<any, any, any, any>,
): e is MutationDefinition<any, any, any, any> {
  return e.type === DefinitionType.mutation
}

export type EndpointBuilder<
  BaseQuery extends BaseQueryFn,
  TagTypes extends string,
  ReducerPath extends string,
> = {
  /**
   * 一个获取数据的端点定义，并可能向缓存提供标签。
   *
   * @example
   * ```js
   * // 代码块元数据 标题="查询端点选项的所有示例"
   * const api = createApi({
   *  baseQuery,
   *  endpoints: (build) => ({
   *    getPost: build.query({
   *      query: (id) => ({ url: `post/${id}` }),
   *      // 提取数据并防止在钩子或选择器中嵌套属性
   *      transformResponse: (response) => response.data,
   *      // 提取错误并防止在钩子或选择器中嵌套属性
   *      transformErrorResponse: (response) => response.error,
   *      // `result` 是服务器响应
   *      providesTags: (result, error, id) => [{ type: 'Post', id }],
   *      // 触发副作用或乐观更新
   *      onQueryStarted(id, { dispatch, getState, extra, requestId, queryFulfilled, getCacheEntry, updateCachedData }) {},
   *      // 处理订阅等
   *      onCacheEntryAdded(id, { dispatch, getState, extra, requestId, cacheEntryRemoved, cacheDataLoaded, getCacheEntry, updateCachedData }) {},
   *    }),
   *  }),
   *});
   *```
   */
  query<ResultType, QueryArg>(
    definition: OmitFromUnion<
      QueryDefinition<QueryArg, BaseQuery, TagTypes, ResultType, ReducerPath>,
      'type'
    >,
  ): QueryDefinition<QueryArg, BaseQuery, TagTypes, ResultType, ReducerPath>
  /**
   * 一个改变服务器上数据或可能使缓存失效的端点定义。
   *
   * @example
   * ```js
   * // 代码块元数据 标题="所有变异端点选项的示例"
   * const api = createApi({
   *   baseQuery,
   *   endpoints: (build) => ({
   *     updatePost: build.mutation({
   *       query: ({ id, ...patch }) => ({ url: `post/${id}`, method: 'PATCH', body: patch }),
   *       // 提取数据并防止在钩子或选择器中嵌套属性
   *       transformResponse: (response) => response.data,
   *       // 提取错误并防止在钩子或选择器中嵌套属性
   *       transformErrorResponse: (response) => response.error,
   *       // `result` 是服务器响应
   *       invalidatesTags: (result, error, id) => [{ type: 'Post', id }],
   *       // 触发副作用或乐观更新
   *       onQueryStarted(id, { dispatch, getState, extra, requestId, queryFulfilled, getCacheEntry }) {},
   *       // 处理订阅等
   *       onCacheEntryAdded(id, { dispatch, getState, extra, requestId, cacheEntryRemoved, cacheDataLoaded, getCacheEntry }) {},
   *     }),
   *   }),
   * });
   * ```
   */
  mutation<ResultType, QueryArg>(
    definition: OmitFromUnion<
      MutationDefinition<
        QueryArg,
        BaseQuery,
        TagTypes,
        ResultType,
        ReducerPath
      >,
      'type'
    >,
  ): MutationDefinition<QueryArg, BaseQuery, TagTypes, ResultType, ReducerPath>
}

export type AssertTagTypes = <T extends FullTagDescription<string>>(t: T) => T

export function calculateProvidedBy<ResultType, QueryArg, ErrorType, MetaType>(
  description:
    | ResultDescription<string, ResultType, QueryArg, ErrorType, MetaType>
    | undefined,
  result: ResultType | undefined,
  error: ErrorType | undefined,
  queryArg: QueryArg,
  meta: MetaType | undefined,
  assertTagTypes: AssertTagTypes,
): readonly FullTagDescription<string>[] {
  if (isFunction(description)) {
    return description(
      result as ResultType,
      error as undefined,
      queryArg,
      meta as MetaType,
    )
      .map(expandTagDescription)
      .map(assertTagTypes)
  }
  if (Array.isArray(description)) {
    return description.map(expandTagDescription).map(assertTagTypes)
  }
  return []
}

function isFunction<T>(t: T): t is Extract<T, Function> {
  return typeof t === 'function'
}

export function expandTagDescription(
  description: TagDescription<string>,
): FullTagDescription<string> {
  return typeof description === 'string' ? { type: description } : description
}

export type QueryArgFrom<D extends BaseEndpointDefinition<any, any, any>> =
  D extends BaseEndpointDefinition<infer QA, any, any> ? QA : unknown
export type ResultTypeFrom<D extends BaseEndpointDefinition<any, any, any>> =
  D extends BaseEndpointDefinition<any, any, infer RT> ? RT : unknown

export type ReducerPathFrom<
  D extends EndpointDefinition<any, any, any, any, any>,
> = D extends EndpointDefinition<any, any, any, any, infer RP> ? RP : unknown

export type TagTypesFrom<D extends EndpointDefinition<any, any, any, any>> =
  D extends EndpointDefinition<any, any, infer RP, any> ? RP : unknown

export type TagTypesFromApi<T> =
  T extends Api<any, any, any, infer TagTypes> ? TagTypes : never

export type DefinitionsFromApi<T> =
  T extends Api<any, infer Definitions, any, any> ? Definitions : never

export type TransformedResponse<
  NewDefinitions extends EndpointDefinitions,
  K,
  ResultType,
> = K extends keyof NewDefinitions
  ? NewDefinitions[K]['transformResponse'] extends undefined
    ? ResultType
    : UnwrapPromise<
        ReturnType<NonUndefined<NewDefinitions[K]['transformResponse']>>
      >
  : ResultType

export type OverrideResultType<Definition, NewResultType> =
  Definition extends QueryDefinition<
    infer QueryArg,
    infer BaseQuery,
    infer TagTypes,
    any,
    infer ReducerPath
  >
    ? QueryDefinition<QueryArg, BaseQuery, TagTypes, NewResultType, ReducerPath>
    : Definition extends MutationDefinition<
          infer QueryArg,
          infer BaseQuery,
          infer TagTypes,
          any,
          infer ReducerPath
        >
      ? MutationDefinition<
          QueryArg,
          BaseQuery,
          TagTypes,
          NewResultType,
          ReducerPath
        >
      : never

export type UpdateDefinitions<
  Definitions extends EndpointDefinitions,
  NewTagTypes extends string,
  NewDefinitions extends EndpointDefinitions,
> = {
  [K in keyof Definitions]: Definitions[K] extends QueryDefinition<
    infer QueryArg,
    infer BaseQuery,
    any,
    infer ResultType,
    infer ReducerPath
  >
    ? QueryDefinition<
        QueryArg,
        BaseQuery,
        NewTagTypes,
        TransformedResponse<NewDefinitions, K, ResultType>,
        ReducerPath
      >
    : Definitions[K] extends MutationDefinition<
          infer QueryArg,
          infer BaseQuery,
          any,
          infer ResultType,
          infer ReducerPath
        >
      ? MutationDefinition<
          QueryArg,
          BaseQuery,
          NewTagTypes,
          TransformedResponse<NewDefinitions, K, ResultType>,
          ReducerPath
        >
      : never
}
