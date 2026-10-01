import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef } from 'react'
import {
  Modal,
  ModalClose,
  ModalProvider,
  createModalStore,
  useModal,
  useModalContext,
  type ModalStore,
} from '../src/lib/index.ts'

function Opener({ id, data }: { id: string; data?: unknown }) {
  const modal = useModal(id)
  return <button onClick={() => modal.open(data)}>open {id}</button>
}

function Stack() {
  const { openModals } = useModalContext()
  return <output>{openModals.join(',')}</output>
}

function setup(store: ModalStore = createModalStore()) {
  render(
    <ModalProvider store={store}>
      <Opener id="a" />
      <Opener id="b" />
      <Stack />
      <Modal id="a" label="A">
        <p>modal a</p>
        <ModalClose />
      </Modal>
      <Modal id="b" label="B" closeOnEscape={false}>
        <p>modal b</p>
      </Modal>
    </ModalProvider>,
  )
  return store
}

/* A closed <dialog> has no accessible name in jsdom, so look it up by its label attribute. */
const dialog = (name: string) => document.querySelector<HTMLDialogElement>(`dialog[aria-label="${name}"]`)!

describe('opening and closing', () => {
  it('renders children only while open and opens the native dialog', async () => {
    setup()
    expect(screen.queryByText('modal a')).not.toBeInTheDocument()
    await userEvent.click(screen.getByText('open a'))
    expect(screen.getByText('modal a')).toBeInTheDocument()
    expect(dialog('A')).toHaveAttribute('open')
    expect(screen.getByRole('dialog', { name: 'A' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByText('modal a')).not.toBeInTheDocument()
    expect(dialog('A')).not.toHaveAttribute('open')
  })

  it('stacks modals and closes the top one when no id is given', async () => {
    const store = setup()
    await userEvent.click(screen.getByText('open a'))
    await userEvent.click(screen.getByText('open b'))
    expect(screen.getByRole('status')).toHaveTextContent('a,b')
    act(() => store.close())
    expect(screen.getByRole('status')).toHaveTextContent('a')
  })

  it('does not open the same id twice', async () => {
    setup()
    await userEvent.click(screen.getByText('open a'))
    await userEvent.click(screen.getByText('open a'))
    expect(screen.getByRole('status')).toHaveTextContent(/^a$/)
  })

  it('opens from outside React through the store', () => {
    const store = setup()
    act(() => store.open('a'))
    expect(screen.getByText('modal a')).toBeInTheDocument()
  })

  it('throws outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Opener id="x" />)).toThrow('useModal must be used inside <ModalProvider>')
    spy.mockRestore()
  })
})

describe('focus', () => {
  it('mounts content into the open dialog, so autoFocus lands inside it', () => {
    const store = createModalStore()
    render(
      <ModalProvider store={store}>
        <Modal id="f" label="F">
          <input aria-label="email" autoFocus />
        </Modal>
      </ModalProvider>,
    )
    act(() => store.open('f'))
    expect(dialog('F')).toHaveAttribute('open')
    expect(screen.getByLabelText('email')).toHaveFocus()
  })
})

describe('native events stay in sync', () => {
  it('closing the dialog natively (Escape, form method=dialog) updates the store', async () => {
    setup()
    await userEvent.click(screen.getByText('open a'))
    act(() => dialog('A').close())
    expect(screen.getByRole('status')).toHaveTextContent('')
    expect(screen.queryByText('modal a')).not.toBeInTheDocument()
  })

  it('closeOnEscape={false} cancels the cancel event', async () => {
    setup()
    await userEvent.click(screen.getByText('open b'))
    const cancel = new Event('cancel', { cancelable: true })
    act(() => {
      dialog('B').dispatchEvent(cancel)
    })
    expect(cancel.defaultPrevented).toBe(true)
    expect(dialog('B')).toHaveAttribute('closedby', 'none')
  })

  it('lets the browser light-dismiss where supported', () => {
    setup()
    expect(dialog('A')).toHaveAttribute('closedby', 'any')
  })
})

describe('backdrop', () => {
  // jsdom boxes are 0x0 at (0,0), so any point with a positive coordinate is outside the dialog.
  const outside = { clientX: 400, clientY: 300 }
  const inside = { clientX: 0, clientY: 0 }

  it('closes on a click outside the dialog box', async () => {
    setup()
    await userEvent.click(screen.getByText('open a'))
    fireEvent.pointerDown(dialog('A'), outside)
    fireEvent.click(dialog('A'), outside)
    expect(screen.queryByText('modal a')).not.toBeInTheDocument()
  })

  it('does not close on a click on the dialog padding or content', async () => {
    setup()
    await userEvent.click(screen.getByText('open a'))
    fireEvent.pointerDown(dialog('A'), inside)
    fireEvent.click(dialog('A'), inside)
    fireEvent.click(screen.getByText('modal a'))
    expect(screen.getByText('modal a')).toBeInTheDocument()
  })

  it('does not close when a text selection starts inside and ends outside', async () => {
    setup()
    await userEvent.click(screen.getByText('open a'))
    fireEvent.pointerDown(screen.getByText('modal a'))
    fireEvent.click(dialog('A'), outside)
    expect(screen.getByText('modal a')).toBeInTheDocument()
  })
})

describe('data', () => {
  it('passes data from open(data) to the render function and to useModal', async () => {
    function Name() {
      const modal = useModal<{ name: string }>('confirm')
      return <span data-testid="hook">{modal.data?.name}</span>
    }
    render(
      <ModalProvider>
        <Opener id="confirm" data={{ name: 'Linen Shirt' }} />
        <Name />
        <Modal<{ name: string }> id="confirm" label="Confirm">
          {({ data }) => <p>Delete {data?.name}?</p>}
        </Modal>
      </ModalProvider>,
    )
    await userEvent.click(screen.getByText('open confirm'))
    expect(screen.getByText('Delete Linen Shirt?')).toBeInTheDocument()
    expect(screen.getByTestId('hook')).toHaveTextContent('Linen Shirt')
  })
  it('ignores the click event when open is passed straight to onClick', async () => {
    function Direct() {
      const modal = useModal('direct')
      return <button onClick={modal.open}>direct</button>
    }
    function Data() {
      const modal = useModal('direct')
      return <span data-testid="data">{String(modal.data)}</span>
    }
    render(
      <ModalProvider>
        <Direct />
        <Data />
      </ModalProvider>,
    )
    await userEvent.click(screen.getByText('direct'))
    expect(screen.getByTestId('data')).toHaveTextContent('undefined')
  })
})

describe('rendering', () => {
  it('re-renders a useModal consumer only when its own modal changes', async () => {
    const renders = { b: 0 }
    function WatchB() {
      useModal('b')
      renders.b += 1
      return null
    }
    const store = createModalStore()
    render(
      <ModalProvider store={store}>
        <WatchB />
      </ModalProvider>,
    )
    const before = renders.b
    act(() => store.open('a'))
    act(() => store.close('a'))
    expect(renders.b).toBe(before)
    act(() => store.open('b'))
    expect(renders.b).toBe(before + 1)
  })

  it('keepMounted keeps children (and their state) while closed', async () => {
    function Field() {
      const ref = useRef<HTMLInputElement>(null)
      return <input aria-label="field" ref={ref} />
    }
    const store = createModalStore()
    render(
      <ModalProvider store={store}>
        <Modal id="k" label="K" keepMounted>
          <Field />
        </Modal>
      </ModalProvider>,
    )
    act(() => store.open('k'))
    await userEvent.type(screen.getByLabelText('field'), 'hello')
    act(() => store.close('k'))
    expect(screen.getByLabelText('field')).toHaveValue('hello')
  })
})

describe('scroll lock', () => {
  const html = () => document.documentElement.style

  it('locks while any modal is open, also when they close out of order', () => {
    const store = setup()
    act(() => store.open('a'))
    act(() => store.open('b'))
    expect(html().overflow).toBe('hidden')
    act(() => store.close('a'))
    expect(html().overflow).toBe('hidden')
    act(() => store.close('b'))
    expect(html().overflow).toBe('')
  })
})
