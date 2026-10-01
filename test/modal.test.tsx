import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal, ModalProvider, useModal, useModalContext } from '../src/lib'

function Opener({ id }: { id: string }) {
  const modal = useModal(id)
  return (
    <button type="button" onClick={modal.open}>
      open {id}
    </button>
  )
}

function Closer({ id }: { id: string }) {
  const modal = useModal(id)
  return (
    <button type="button" onClick={modal.close}>
      close {id}
    </button>
  )
}

function Status() {
  const { openModals } = useModalContext()
  return <output>{openModals.join(',')}</output>
}

function renderApp() {
  return render(
    <ModalProvider>
      <Opener id="a" />
      <Opener id="b" />
      <Status />
      <Modal id="a" label="A">
        <p>modal a</p>
        <Closer id="a" />
      </Modal>
      <Modal id="b" label="B">
        <p>modal b</p>
      </Modal>
    </ModalProvider>,
  )
}

describe('react-modal-context', () => {
  it('renders children only while open', async () => {
    renderApp()
    expect(screen.queryByText('modal a')).not.toBeInTheDocument()
    await userEvent.click(screen.getByText('open a'))
    expect(screen.getByText('modal a')).toBeVisible()
    await userEvent.click(screen.getByText('close a'))
    expect(screen.queryByText('modal a')).not.toBeInTheDocument()
  })

  it('opens the native dialog as modal', async () => {
    renderApp()
    await userEvent.click(screen.getByText('open a'))
    expect(screen.getByRole('dialog', { name: 'A' })).toHaveAttribute('open')
  })

  it('stacks modals and closes the last one without an id', async () => {
    renderApp()
    await userEvent.click(screen.getByText('open a'))
    await userEvent.click(screen.getByText('open b'))
    expect(screen.getByRole('status')).toHaveTextContent('a,b')
  })

  it('keeps the context in sync when the dialog closes by itself (Escape)', async () => {
    renderApp()
    await userEvent.click(screen.getByText('open a'))
    const dialog = screen.getByRole('dialog', { name: 'A' }) as HTMLDialogElement
    act(() => dialog.close())
    expect(screen.getByRole('status')).toHaveTextContent('')
    expect(screen.queryByText('modal a')).not.toBeInTheDocument()
  })

  it('does not open the same id twice', async () => {
    renderApp()
    await userEvent.click(screen.getByText('open a'))
    await userEvent.click(screen.getByText('open a'))
    expect(screen.getByRole('status')).toHaveTextContent('a')
  })

  it('throws outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Opener id="x" />)).toThrow('useModal must be used inside <ModalProvider>')
    spy.mockRestore()
  })
})
