import type { Api, ApiContext, Module, ModuleName } from './apiTypes'
import type { CombinedState } from './core/apiState'
import type { BaseQueryArg, BaseQueryFn } from './baseQueryTypes'
import type { SerializeQueryArgs } from './defaultSerializeQueryArgs'
import { defaultSerializeQueryArgs } from './defaultSerializeQueryArgs'
import type {
  EndpointBuilder,
  EndpointDefinitions,
} from './endpointDefinitions'
import { DefinitionType, isQueryDefinition } from './endpointDefinitions'
import { nanoid } from './core/rtkImports'
import type { UnknownAction } from '@reduxjs/toolkit'
import type { NoInfer } from './tsHelpers'
import { weakMapMemoize } from 'reselect'

export interface CreateApiOptions<
  BaseQuery extends BaseQueryFn,
  Definitions extends EndpointDefinitions,
  ReducerPath extends string = 'api',
  TagTypes extends string = never,
> {
  /**
   * 如果没有指定 `queryFn` 选项，每个端点使用的基础查询。RTK Query 导出了一个名为 [fetchBaseQuery](./fetchBaseQuery) 的实用程序，作为 `fetch` 的轻量级包装，用于常见的用例。如果 `fetchBaseQuery` 无法满足你的需求，请参阅 [自定义查询](../../rtk-query/usage/customizing-queries)。
   *
   * @example
   *
   * ```ts
   * import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query'
   *
   * const api = createApi({
   *   // highlight-start
   *   baseQuery: fetchBaseQuery({ baseUrl: '/' }),
   *   // highlight-end
   *   endpoints: (build) => ({
   *     // ...端点
   *   }),
   * })
   * ```
   */
  baseQuery: BaseQuery
  /**
   * 字符串标签类型名称的数组。指定标签类型是可选的，但你应该定义它们，以便它们可以用于缓存和失效。定义标签类型时，你可以在配置 [endpoints](#endpoints) 时使用 `providesTags` [提供](../../rtk-query/usage/automated-refetching#providing-tags) 它们，并使用 `invalidatesTags` [使其失效](../../rtk-query/usage/automated-refetching#invalidating-tags)。
   *
   * @example
   *
   * ```ts
   * import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query'
   *
   * const api = createApi({
   *   baseQuery: fetchBaseQuery({ baseUrl: '/' }),
   *   // highlight-start
   *   tagTypes: ['Post', 'User'],
   *   // highlight-end
   *   endpoints: (build) => ({
   *     // ...endpoints
   *   }),
   * })
   * ```
   */
  tagTypes?: readonly TagTypes[]
  /**
   * `reducerPath` 是你的服务在存储中挂载的 _唯一_ 键。如果你在应用程序中多次调用 `createApi`，每次都需要提供一个唯一的值。默认为 `'api'`。
   *
   * @example
   *
   * ```ts
   * // 代码块元数据 标题="apis.js"
   * import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query';
   *
   * const apiOne = createApi({
   *   // highlight-start
   *   reducerPath: 'apiOne',
   *   // highlight-end
   *   baseQuery: fetchBaseQuery({ baseUrl: '/' }),
   *   endpoints: (builder) => ({
   *     // ...endpoints
   *   }),
   * });
   *
   * const apiTwo = createApi({
   *   // highlight-start
   *   reducerPath: 'apiTwo',
   *   // highlight-end
   *   baseQuery: fetchBaseQuery({ baseUrl: '/' }),
   *   endpoints: (builder) => ({
   *     // ...endpoints
   *   }),
   * });
   * ```
   */
  reducerPath?: ReducerPath
  /**
   * 如果你需要出于任何原因更改缓存键的创建，可以接受一个自定义函数。
   */
  serializeQueryArgs?: SerializeQueryArgs<BaseQueryArg<BaseQuery>>
  /**
   * 端点只是你想对服务器执行的一组操作。你使用构建器语法将它们定义为一个对象。有两种基本的端点类型：[`query`](../../rtk-query/usage/queries) 和 [`mutation`](../../rtk-query/usage/mutations)。
   */
  endpoints(
    build: EndpointBuilder<BaseQuery, TagTypes, ReducerPath>,
  ): Definitions
  /**
   * 默认为 `60` _(此值以秒为单位)_。这是 RTK Query 在最后一个组件取消订阅 **之后** 保留你的数据缓存的时间。例如，如果你查询一个端点，然后卸载组件，然后在给定的时间框架内挂载另一个发出相同请求的组件，最近的值将从缓存中提供。
   *
   * ```ts
   * // 代码块元数据 标题="keepUnusedDataFor 示例"
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
   *       // highlight-start
   *       keepUnusedDataFor: 5
   *       // highlight-end
   *     })
   *   })
   * })
   * ```
   */
  keepUnusedDataFor?: number
  /**
   * 默认为 `false`。此设置允许你控制如果已经有缓存结果可用，RTK Query 是否只提供缓存结果，或者如果设置为 `true` 或者自上次成功查询结果以来已经过去了足够的时间，它应该 `refetch`。
   * - `false` - 不会导致执行查询，_除非_ 它还不存在。
   * - `true` - 当添加一个新的查询订阅者时，总是会重新获取。行为与调用 `refetch` 回调或在动作创建器中传递 `forceRefetch: true` 相同。
   * - `number` - **值以秒为单位**。如果提供了一个数字并且缓存中存在一个现有的查询，它将比较当前时间与最后一次满足的时间戳，并且只有在过去了足够的时间后才会重新获取。
   *
   * 如果你在 `skip: true` 旁边指定了此选项，这个选项在 `skip` 为 false 之前**不会被评估**。
   */
  refetchOnMountOrArgChange?: boolean | number
  /**
   * 默认为 `false`。此设置允许你控制当应用程序窗口重新获得焦点后，RTK Query 是否会尝试重新获取所有订阅的查询。
   *
   * 如果你在 `skip: true` 旁边指定了此选项，这个选项在 `skip` 为 false 之前**不会被评估**。
   *
   * 注意：需要调用 [`setupListeners`](./setupListeners)。
   */
  refetchOnFocus?: boolean
  /**
   * 默认为 `false`。此设置允许你控制当重新获得网络连接后，RTK Query 是否会尝试重新获取所有订阅的查询。
   *
   * 如果你在 `skip: true` 旁边指定了此选项，这个选项在 `skip` 为 false 之前**不会被评估**。
   *
   * 注意：需要调用 [`setupListeners`](./setupListeners)。
   */
  refetchOnReconnect?: boolean
  /**
   * 默认为 `'immediately'`。此设置允许你控制在突变后何时使标签无效。
   *
   * - `'immediately'`：突变完成后，查询立即失效，即使它们正在运行。
   *   如果查询提供了在运行时失效的标签，它将不会被重新获取。
   * - `'delayed'`：只有在所有查询和突变都解决后，才会发生失效。
   *   这确保了查询总是正确地失效，并自动地“批处理”并发突变的失效。
   *   注意，如果你不断地运行一些查询（或突变），这可能会无限期地延迟标签失效。
   */
  invalidationBehavior?: 'delayed' | 'immediately'
  /**
   * 传递每个调度动作的函数。如果这返回了除 `undefined` 以外的东西，
   * 那么返回值将用于重新填充已完成和错误的查询。
   *
   * @example
   *
   * ```ts
   * // 代码块元数据 标题="next-redux-wrapper 重新填充示例"
   * import type { Action, PayloadAction } from '@reduxjs/toolkit'
   * import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
   * import { HYDRATE } from 'next-redux-wrapper'
   *
   * type RootState = any; // 通常从状态推断
   *
   * function isHydrateAction(action: Action): action is PayloadAction<RootState> {
   *   return action.type === HYDRATE
   * }
   *
   * export const api = createApi({
   *   baseQuery: fetchBaseQuery({ baseUrl: '/' }),
   *   // highlight-start
   *   extractRehydrationInfo(action, { reducerPath }): any {
   *     if (isHydrateAction(action)) {
   *       return action.payload[reducerPath]
   *     }
   *   },
   *   // highlight-end
   *   endpoints: (build) => ({
   *     // 省略
   *   }),
   * })
   * ```
   */
  extractRehydrationInfo?: (
    action: UnknownAction,
    {
      reducerPath,
    }: {
      reducerPath: ReducerPath
    },
  ) =>
    | undefined
    | CombinedState<
        NoInfer<Definitions>,
        NoInfer<TagTypes>,
        NoInfer<ReducerPath>
      >
}

export type CreateApi<Modules extends ModuleName> = {
  /**
   * 在你的应用程序中创建一个服务。只包含基本的 redux 逻辑（核心模块）。
   *
   * @link https://rtk-query-docs.netlify.app/api/createApi
   */
  <
    BaseQuery extends BaseQueryFn,
    Definitions extends EndpointDefinitions,
    ReducerPath extends string = 'api',
    TagTypes extends string = never,
  >(
    options: CreateApiOptions<BaseQuery, Definitions, ReducerPath, TagTypes>,
  ): Api<BaseQuery, Definitions, ReducerPath, TagTypes, Modules>
}

/**
 * 基于提供的 `modules` 构建一个 `createApi` 方法。
 *
 * @link https://rtk-query-docs.netlify.app/concepts/customizing-create-api
 *
 * @example
 * ```ts
 * const MyContext = React.createContext<ReactReduxContextValue>(null as any);
 * const customCreateApi = buildCreateApi(
 *   coreModule(),
 *   reactHooksModule({
 *     hooks: {
 *       useDispatch: createDispatchHook(MyContext),
 *       useSelector: createSelectorHook(MyContext),
 *       useStore: createStoreHook(MyContext)
 *     }
 *   })
 * );
 * ```
 *
 * @param modules - 自定义 `createApi` 方法如何处理端点的一系列模块
 * @returns 使用提供的 `modules` 的 `createApi` 方法。
 */
export function buildCreateApi<Modules extends [Module<any>, ...Module<any>[]]>(
  ...modules: Modules
): CreateApi<Modules[number]['name']> {
  return function baseCreateApi(options) {
    const extractRehydrationInfo = weakMapMemoize((action: UnknownAction) =>
      options.extractRehydrationInfo?.(action, {
        reducerPath: (options.reducerPath ?? 'api') as any,
      }),
    )

    const optionsWithDefaults: CreateApiOptions<any, any, any, any> = {
      reducerPath: 'api',
      keepUnusedDataFor: 60,
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
      invalidationBehavior: 'delayed',
      ...options,
      extractRehydrationInfo,
      serializeQueryArgs(queryArgsApi) {
        let finalSerializeQueryArgs = defaultSerializeQueryArgs
        if ('serializeQueryArgs' in queryArgsApi.endpointDefinition) {
          const endpointSQA =
            queryArgsApi.endpointDefinition.serializeQueryArgs!
          finalSerializeQueryArgs = (queryArgsApi) => {
            const initialResult = endpointSQA(queryArgsApi)
            if (typeof initialResult === 'string') {
              // If the user function returned a string, use it as-is
              return initialResult
            } else {
              // Assume they returned an object (such as a subset of the original
              // query args) or a primitive, and serialize it ourselves
              return defaultSerializeQueryArgs({
                ...queryArgsApi,
                queryArgs: initialResult,
              })
            }
          }
        } else if (options.serializeQueryArgs) {
          finalSerializeQueryArgs = options.serializeQueryArgs
        }

        return finalSerializeQueryArgs(queryArgsApi)
      },
      tagTypes: [...(options.tagTypes || [])],
    }

    const context: ApiContext<EndpointDefinitions> = {
      endpointDefinitions: {},
      batch(fn) {
        // placeholder "batch" method to be overridden by plugins, for example with React.unstable_batchedUpdate
        fn()
      },
      apiUid: nanoid(),
      extractRehydrationInfo,
      hasRehydrationInfo: weakMapMemoize(
        (action) => extractRehydrationInfo(action) != null,
      ),
    }

    const api = {
      injectEndpoints,
      enhanceEndpoints({ addTagTypes, endpoints }) {
        if (addTagTypes) {
          for (const eT of addTagTypes) {
            if (!optionsWithDefaults.tagTypes!.includes(eT as any)) {
              ;(optionsWithDefaults.tagTypes as any[]).push(eT)
            }
          }
        }
        if (endpoints) {
          for (const [endpointName, partialDefinition] of Object.entries(
            endpoints,
          )) {
            if (typeof partialDefinition === 'function') {
              partialDefinition(context.endpointDefinitions[endpointName])
            } else {
              Object.assign(
                context.endpointDefinitions[endpointName] || {},
                partialDefinition,
              )
            }
          }
        }
        return api
      },
    } as Api<BaseQueryFn, {}, string, string, Modules[number]['name']>

    const initializedModules = modules.map((m) =>
      m.init(api as any, optionsWithDefaults as any, context),
    )

    function injectEndpoints(
      inject: Parameters<typeof api.injectEndpoints>[0],
    ) {
      const evaluatedEndpoints = inject.endpoints({
        query: (x) => ({ ...x, type: DefinitionType.query }) as any,
        mutation: (x) => ({ ...x, type: DefinitionType.mutation }) as any,
      })

      for (const [endpointName, definition] of Object.entries(
        evaluatedEndpoints,
      )) {
        if (
          inject.overrideExisting !== true &&
          endpointName in context.endpointDefinitions
        ) {
          if (inject.overrideExisting === 'throw') {
            throw new Error(
              `called \`injectEndpoints\` to override already-existing endpointName ${endpointName} without specifying \`overrideExisting: true\``,
            )
          } else if (
            typeof process !== 'undefined' &&
            process.env.NODE_ENV === 'development'
          ) {
            console.error(
              `called \`injectEndpoints\` to override already-existing endpointName ${endpointName} without specifying \`overrideExisting: true\``,
            )
          }

          continue
        }

        context.endpointDefinitions[endpointName] = definition
        for (const m of initializedModules) {
          m.injectEndpoint(endpointName, definition)
        }
      }

      return api as any
    }

    return api.injectEndpoints({ endpoints: options.endpoints as any })
  }
}
