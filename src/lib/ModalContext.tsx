import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export interface ModalContextValue {
  /** Ids of the modals that are open, in the order they were opened. */
  openModals: readonly string[]
  openModal: (id: string) => void
  closeModal: (id?: string) => void
  closeAll: () => void
  isOpen: (id: string) => boolean
}

const ModalContext = createContext<ModalContextValue | null>(null)

export function ModalProvider({ children }: { children: ReactNode }) {
  const [openModals, setOpenModals] = useState<string[]>([])

  const openModal = useCallback((id: string) => {
    setOpenModals((ids) => (ids.includes(id) ? ids : [...ids, id]))
  }, [])

  /** Without an id, closes the modal opened last. */
  const closeModal = useCallback((id?: string) => {
    setOpenModals((ids) => (id === undefined ? ids.slice(0, -1) : ids.filter((x) => x !== id)))
  }, [])

  const closeAll = useCallback(() => setOpenModals([]), [])

  const isOpen = useCallback((id: string) => openModals.includes(id), [openModals])

  const value = useMemo(
    () => ({ openModals, openModal, closeModal, closeAll, isOpen }),
    [openModals, openModal, closeModal, closeAll, isOpen],
  )

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
}

export function useModalContext(): ModalContextValue {
  const context = useContext(ModalContext)
  if (!context) throw new Error('useModal must be used inside <ModalProvider>')
  return context
}

/** Bind the hook to one modal id: `const { open, close, isOpen } = useModal('login')`. */
export function useModal(id: string) {
  const { openModal, closeModal, isOpen } = useModalContext()
  return useMemo(
    () => ({
      open: () => openModal(id),
      close: () => closeModal(id),
      isOpen: isOpen(id),
    }),
    [id, openModal, closeModal, isOpen],
  )
}
