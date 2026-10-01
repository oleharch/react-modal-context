import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useModalContext } from './ModalContext'

export interface ModalProps {
  id: string
  children: ReactNode
  /** Accessible name of the dialog. Use `aria-labelledby` via `labelledBy` instead when there is a visible heading. */
  label?: string
  labelledBy?: string
  className?: string
  /** Close when the backdrop is clicked. Default: true. */
  closeOnBackdrop?: boolean
  /** Called after the dialog closes for any reason (button, Escape, backdrop, closeModal()). */
  onClose?: () => void
}

/**
 * Renders a native <dialog> through a portal and keeps it in sync with the context.
 * The browser handles focus trapping, Escape, inert background and the top layer.
 */
export function Modal({ id, children, label, labelledBy, className, closeOnBackdrop = true, onClose }: ModalProps) {
  const { isOpen, closeModal } = useModalContext()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const open = isOpen(id)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    if (!open) return
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
    }
  }, [open])

  /* `close` fires for Escape and for dialog.close(); keep the context in sync. */
  const handleClose = () => {
    if (isOpen(id)) closeModal(id)
    onClose?.()
  }

  const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (closeOnBackdrop && event.target === dialogRef.current) closeModal(id)
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <dialog
      ref={dialogRef}
      className={className}
      aria-label={label}
      aria-labelledby={labelledBy}
      data-modal-id={id}
      onClose={handleClose}
      onClick={handleBackdropClick}
    >
      {open ? children : null}
    </dialog>,
    document.body,
  )
}
