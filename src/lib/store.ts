export interface ModalEntry<T = unknown> {
  readonly id: string
  readonly data: T | undefined
}

export interface ModalStore {
  /** Open modals, oldest first. A new array on every change, the same array otherwise. */
  getSnapshot(): readonly ModalEntry[]
  subscribe(listener: () => void): () => void
  /** Opens the modal on top of the stack. Opening an open id updates its data and keeps its place. */
  open<T>(id: string, data?: T): void
  /** Closes one modal; without an id closes the one on top. */
  close(id?: string): void
  closeAll(): void
}

/**
 * A tiny external store, so modals can be opened from anywhere:
 * React components, event handlers, a fetch callback or a test.
 */
export function createModalStore(): ModalStore {
  let entries: readonly ModalEntry[] = []
  const listeners = new Set<() => void>()

  const set = (next: readonly ModalEntry[]) => {
    if (next === entries) return
    entries = next
    listeners.forEach((listener) => listener())
  }

  return {
    getSnapshot: () => entries,
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    open(id, data) {
      const index = entries.findIndex((entry) => entry.id === id)
      if (index === -1) {
        set([...entries, { id, data }])
      } else if (data !== undefined && entries[index].data !== data) {
        set(entries.map((entry, i) => (i === index ? { id, data } : entry)))
      }
    },
    close(id) {
      if (entries.length === 0) return
      if (id === undefined) {
        set(entries.slice(0, -1))
      } else if (entries.some((entry) => entry.id === id)) {
        set(entries.filter((entry) => entry.id !== id))
      }
    },
    closeAll() {
      if (entries.length > 0) set([])
    },
  }
}
