import { configureStore } from '@reduxjs/toolkit'
import type { Context } from 'react'
import { useContext } from 'react'
import { useEffect } from 'react'
import React from 'react'
import type { ReactReduxContextValue } from 'react-redux'
import { Provider, ReactReduxContext } from 'react-redux'
import { setupListeners } from '@reduxjs/toolkit/query'
import type { Api } from '@reduxjs/toolkit/query'

/**
 * 如果你**还没有 Redux store**，可以将此用作 `Provider`。
 *
 * @example
 * ```tsx
 * // 代码块元数据 不转译 标题="基本用法 - 用 ApiProvider 包裹你的 App"
 * import * as React from 'react';
 * import { ApiProvider } from '@reduxjs/toolkit/query/react';
 * import { Pokemon } from './features/Pokemon';
 *
 * function App() {
 *   return (
 *     <ApiProvider api={api}>
 *       <Pokemon />
 *     </ApiProvider>
 *   );
 * }
 * ```
 *
 * @remarks
 * 如果将此与现有的 redux store 一起使用，两者会
 * 彼此冲突 - 在这种情况下，请使用传统的 redux 设置。
 */
export function ApiProvider(props: {
  children: any
  api: Api<any, {}, any, any>
  setupListeners?: Parameters<typeof setupListeners>[1] | false
  context?: Context<ReactReduxContextValue | null>
}) {
  const context = props.context || ReactReduxContext
  const existingContext = useContext(context)
  if (existingContext) {
    throw new Error(
      'Existing Redux context detected. If you already have a store set up, please use the traditional Redux setup.',
    )
  }
  const [store] = React.useState(() =>
    configureStore({
      reducer: {
        [props.api.reducerPath]: props.api.reducer,
      },
      middleware: (gDM) => gDM().concat(props.api.middleware),
    }),
  )
  // Adds the event listeners for online/offline/focus/etc
  useEffect(
    (): undefined | (() => void) =>
      props.setupListeners === false
        ? undefined
        : setupListeners(store.dispatch, props.setupListeners),
    [props.setupListeners, store.dispatch],
  )

  return (
    <Provider store={store} context={context}>
      {props.children}
    </Provider>
  )
}
