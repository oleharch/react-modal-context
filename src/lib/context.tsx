'use client'

import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { createModalStore, type ModalEntry, type ModalStore } from './store.js'

const StoreContext = createContext<ModalStore | null>(null)

export interface ModalProviderProps {
  children: ReactNode
  /** Pass your own store to open modals from outside React. One is created otherwise. */
  store?: ModalStore
  /** Lock page scroll while any modal is open. Default: true. */
  lockScroll?: boolean
}

export function ModalProvider({ children, store, lockScroll = true }: ModalProviderProps) {
  const [ownStore] = useState(() => store ?? createModalStore())
  const active = store ?? ownStore
  const anyOpen = useSyncExternalStore(
    active.subscribe,
    () => active.getSnapshot().length > 0,
    () => false,
  )
  useScrollLock(lockScroll && anyOpen)
  return <StoreContext.Provider value={active}>{children}</StoreContext.Provider>
}

/** The store of the nearest provider. */
export function useModalStore(): ModalStore {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useModal must be used inside <ModalProvider>')
  return store
}

/** The entry of one modal, or undefined when it is closed. Re-renders only when that entry changes. */
export function useModalEntry<T = unknown>(id: string): ModalEntry<T> | undefined {
  const store = useModalStore()
  return useSyncExternalStore(
    store.subscribe,
    () => store.getSnapshot().find((entry) => entry.id === id) as ModalEntry<T> | undefined,
    () => undefined,
  )
}

export interface UseModalResult<T> {
  isOpen: boolean
  data: T | undefined
  open: (data?: T) => void
  close: () => void
}

/* `onClick={modal.open}` passes the click event; never treat a React event as modal data. */
const isReactEvent = (value: unknown) =>
  typeof value === 'object' && value !== null && 'nativeEvent' in value && 'currentTarget' in value

/** `const login = useModal('login')` then `login.open()`, `login.close()`, `login.isOpen`. */
export function useModal<T = unknown>(id: string): UseModalResult<T> {
  const store = useModalStore()
  const entry = useModalEntry<T>(id)
  return useMemo(
    () => ({
      isOpen: entry !== undefined,
      data: entry?.data,
      open: (data?: T) => store.open(id, isReactEvent(data) ? undefined : data),
      close: () => store.close(id),
    }),
    [store, id, entry],
  )
}

export interface ModalContextValue {
  openModals: readonly string[]
  openModal: (id: string, data?: unknown) => void
  closeModal: (id?: string) => void
  closeAll: () => void
  isOpen: (id: string) => boolean
}

/** The whole stack. Re-renders on every change; prefer `useModal(id)` in components. */
export function useModalContext(): ModalContextValue {
  const store = useModalStore()
  const entries = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  return useMemo(() => {
    const openModals = entries.map((entry) => entry.id)
    return {
      openModals,
      openModal: store.open,
      closeModal: store.close,
      closeAll: store.closeAll,
      isOpen: (id: string) => openModals.includes(id),
    }
  }, [store, entries])
}

/**
 * `overflow: hidden` on <html> plus `scrollbar-gutter: stable`, so the page does not
 * jump sideways when the scrollbar disappears.
 */
function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const { style } = document.documentElement
    const previous = { overflow: style.overflow, scrollbarGutter: style.scrollbarGutter }
    style.overflow = 'hidden'
    style.scrollbarGutter = 'stable'
    return () => {
      style.overflow = previous.overflow
      style.scrollbarGutter = previous.scrollbarGutter
    }
  }, [locked])
}
