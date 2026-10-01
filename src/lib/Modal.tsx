'use client'

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentPropsWithoutRef,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type SyntheticEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { useModalEntry, useModalStore } from './context.js'

type DialogAttributes = Omit<
  ComponentPropsWithoutRef<'dialog'>,
  'children' | 'open' | 'onClose' | 'onCancel' | 'aria-label' | 'aria-labelledby' | 'aria-describedby'
>

/** Every dialog needs an accessible name: a visible heading (preferred) or a label. */
type AccessibleName = { labelledBy: string; label?: undefined } | { label: string; labelledBy?: undefined }

export interface CurrentModal<T = unknown> {
  id: string
  data: T | undefined
  close: () => void
}

export type ModalProps<T = unknown> = DialogAttributes &
  AccessibleName & {
    id: string
    /** Content, or a function that receives the data passed to `open(data)`. */
    children: ReactNode | ((modal: CurrentModal<T>) => ReactNode)
    describedBy?: string
    /** Close when the backdrop is clicked. Default: true. */
    closeOnBackdrop?: boolean
    /** Close on Escape (and Android back). Default: true. */
    closeOnEscape?: boolean
    /** Keep children mounted while closed (keeps form state). Default: false. */
    keepMounted?: boolean
    /**
     * A modal <dialog> is shown in the browser's top layer, so it does not need a portal.
     * Pass `true` (document.body) or an element only if you need the DOM elsewhere.
     */
    portal?: boolean | Element
    /** Hooks for the optional stylesheet: `data-placement` and `data-size`. */
    placement?: 'center' | 'top' | 'bottom' | 'left' | 'right'
    size?: 'sm' | 'md' | 'lg' | 'full'
    onOpen?: () => void
    /** Called after the dialog closes for any reason. */
    onClose?: () => void
  }

const CurrentModalContext = createContext<CurrentModal | null>(null)

/** The modal this component is rendered in: `{ id, data, close }`. */
export function useCurrentModal<T = unknown>(): CurrentModal<T> {
  const modal = useContext(CurrentModalContext)
  if (!modal) throw new Error('useCurrentModal must be used inside <Modal>')
  return modal as CurrentModal<T>
}

const subscribeNothing = () => () => {}
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export function Modal<T = unknown>(props: ModalProps<T>) {
  const {
    id,
    children,
    label,
    labelledBy,
    describedBy,
    closeOnBackdrop = true,
    closeOnEscape = true,
    keepMounted = false,
    portal = false,
    placement,
    size,
    onOpen,
    onClose,
    onClick,
    onPointerDown,
    ...dialogProps
  } = props

  const store = useModalStore()
  const entry = useModalEntry<T>(id)
  const isOpen = entry !== undefined
  const dialogRef = useRef<HTMLDialogElement>(null)
  const pointerDownOnBackdrop = useRef(false)
  const isClient = useSyncExternalStore(subscribeNothing, () => true, () => false)

  // Children mount after the dialog is open (so `autoFocus` works) and stay mounted
  // until the close animation has finished, keeping the last data.
  const [mounted, setMounted] = useState(false)
  const [lastData, setLastData] = useState(entry?.data)
  if (entry && entry.data !== lastData) setLastData(entry.data)

  const callbacks = useRef({ onOpen, onClose })
  useEffect(() => {
    callbacks.current = { onOpen, onClose }
  })

  /* Layout effect: open the dialog and mount its content before the browser paints,
     so there is no empty frame. With no focusable content yet, the browser focuses the
     dialog itself; an `autoFocus` element inside then takes focus when it mounts. */
  useIsomorphicLayoutEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal()
        callbacks.current.onOpen?.()
      }
      setMounted(true)
      return
    }

    if (dialog.open) dialog.close()
    if (keepMounted) return
    // getAnimations() flushes styles, so CSS exit transitions have started by now.
    const running = typeof dialog.getAnimations === 'function' ? dialog.getAnimations({ subtree: true }) : []
    if (running.length === 0) {
      setMounted(false)
      return
    }
    let cancelled = false
    Promise.allSettled(running.map((animation) => animation.finished)).then(() => {
      if (!cancelled) setMounted(false)
    })
    return () => {
      cancelled = true
    }
  }, [isOpen, keepMounted])

  const close = useMemo(() => () => store.close(id), [store, id])
  const current = useMemo<CurrentModal<T>>(() => ({ id, data: lastData, close }), [id, lastData, close])

  /* Escape: the browser fires `cancel`, then `close`. */
  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    if (!closeOnEscape) event.preventDefault()
  }

  /* Fires for close(), Escape, light dismiss and <form method="dialog">: keep the store in sync. */
  const handleClose = () => {
    if (store.getSnapshot().some((item) => item.id === id)) store.close(id)
    callbacks.current.onClose?.()
  }

  /* A click is on the backdrop only if it lands outside the dialog box (padding counts as inside)
     and the pointer also went down there, so selecting text and releasing outside does not close. */
  const isOnBackdrop = (event: { target: EventTarget; clientX: number; clientY: number }) => {
    const dialog = dialogRef.current
    if (!dialog || event.target !== dialog) return false
    const box = dialog.getBoundingClientRect()
    return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom
  }

  const handlePointerDown = (event: PointerEvent<HTMLDialogElement>) => {
    pointerDownOnBackdrop.current = isOnBackdrop(event)
    onPointerDown?.(event)
  }

  const handleClick = (event: MouseEvent<HTMLDialogElement>) => {
    onClick?.(event)
    if (closeOnBackdrop && pointerDownOnBackdrop.current && isOnBackdrop(event)) close()
    pointerDownOnBackdrop.current = false
  }

  /* Native light dismiss where supported (Chrome 134+); the handlers above cover other browsers. */
  const closedby = closeOnEscape ? (closeOnBackdrop ? 'any' : 'closerequest') : 'none'

  const content = mounted || keepMounted ? (typeof children === 'function' ? children(current) : children) : null

  const dialog = (
    <dialog
      {...dialogProps}
      {...({ closedby } as Record<string, string>)}
      ref={dialogRef}
      aria-label={label}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      data-rmc-modal=""
      data-placement={placement}
      data-size={size}
      onCancel={handleCancel}
      onClose={handleClose}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
    >
      <CurrentModalContext.Provider value={current as CurrentModal}>{content}</CurrentModalContext.Provider>
    </dialog>
  )

  if (!portal) return dialog
  if (!isClient) return null
  return createPortal(dialog, portal === true ? document.body : portal)
}

export type ModalCloseProps = ComponentPropsWithoutRef<'button'>

/** A close button for the modal it is rendered in. Without children it renders an × icon labelled "Close". */
export function ModalClose({ children, onClick, 'aria-label': ariaLabel, ...props }: ModalCloseProps) {
  const modal = useCurrentModal()
  return (
    <button
      type="button"
      data-rmc-close=""
      aria-label={ariaLabel ?? (children ? undefined : 'Close')}
      {...props}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) modal.close()
      }}
    >
      {children ?? (
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      )}
    </button>
  )
}
