import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  Modal,
  ModalClose,
  ModalProvider,
  createModalStore,
  useModal,
  useModalContext,
} from '../lib/index.ts'

/* A store created outside React, so plain code can open modals too. */
const store = createModalStore()

interface Product {
  id: number
  name: string
  price: string
}

const PRODUCTS: Product[] = [
  { id: 1, name: 'Linen Shirt', price: '$39.00' },
  { id: 2, name: 'Canvas Tote Bag', price: '$24.00' },
  { id: 3, name: 'Ceramic Mug', price: '$14.00' },
]

export function App() {
  return (
    <ModalProvider store={store}>
      <Page />
      <SignInModal />
      <StackedModal />
      <ConfirmDeleteModal />
      <FiltersSheet />
      <CartDrawer />
      <PromoModal />
    </ModalProvider>
  )
}

function Page() {
  const { openModals } = useModalContext()
  return (
    <>
      <header className="hero">
        <div className="hero__top">
          <span className="badge">React 18+ · TypeScript · 0 dependencies</span>
          <ThemeToggle />
        </div>
        <h1>react-modal-context</h1>
        <p className="lead">
          Modals by id. Call <code>useModal('login')</code> anywhere in the tree. The native <code>&lt;dialog&gt;</code> handles
          focus, Escape, the backdrop and the top layer. Optional CSS adds enter and exit animations, sheets and drawers.
        </p>
        <div className="hero__actions">
          <code className="install">npm i github:oleharch/react-modal-context</code>
          <a className="link" href="https://github.com/oleharch/react-modal-context">GitHub</a>
        </div>
        <p className="status" aria-live="polite">
          Open now: {openModals.length ? openModals.join(' → ') : 'none'}
        </p>
      </header>

      <main className="grid">
        <Example
          title="Dialog"
          text="A form with autofocus. Escape, the backdrop or the × close it. Modals stack: open a second one on top."
          action={<OpenButton id="sign-in">Sign in</OpenButton>}
          code={`const signIn = useModal('sign-in')
<button onClick={() => signIn.open()}>Sign in</button>

<Modal id="sign-in" labelledBy="title" size="sm">
  <ModalClose />
  <h2 id="title">Sign in</h2>
  <input type="email" autoFocus />
</Modal>`}
        />
        <Example title="Confirm with data" text="Pass data to open(). The modal reads it in a render function." action={<ProductList />} code={`const confirm = useModal<Product>('confirm')
confirm.open(product)

<Modal<Product> id="confirm" closeOnBackdrop={false}>
  {({ data, close }) => <h2>Delete {data?.name}?</h2>}
</Modal>`} />
        <Example
          title="Bottom sheet"
          text="placement=&quot;bottom&quot;. keepMounted keeps the checkboxes when the sheet closes."
          action={<OpenButton id="filters">Filters</OpenButton>}
          code={`<Modal id="filters" labelledBy="title"
  placement="bottom" keepMounted>`}
        />
        <Example
          title="Drawer"
          text="placement=&quot;right&quot;. Slides in from the side, full height."
          action={<OpenButton id="cart">Open cart</OpenButton>}
          code={`<Modal id="cart" labelledBy="title"
  placement="right">`}
        />
        <Example
          title="Outside React"
          text="createModalStore() and store.open() work in any callback: a timer, a fetch, a WebSocket message."
          action={
            <button className="button" onClick={() => setTimeout(() => store.open('promo'), 800)}>
              Open in 0.8 s
            </button>
          }
          code={`const store = createModalStore()
<ModalProvider store={store}>...</ModalProvider>

setTimeout(() => store.open('promo'), 800)`}
        />
      </main>

      <footer className="footer">
        MIT · <a href="https://github.com/oleharch">Oleh Molchanov</a>
      </footer>
    </>
  )
}

function Example({ title, text, action, code }: { title: string; text: string; action: ReactNode; code: string }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <p>{text}</p>
      <div className="card__action">{action}</div>
      <pre>
        <code>{code}</code>
      </pre>
    </section>
  )
}

function OpenButton({ id, children }: { id: string; children: ReactNode }) {
  const modal = useModal(id)
  return (
    <button className="button" onClick={() => modal.open()}>
      {children}
    </button>
  )
}

function ProductList() {
  const confirm = useModal<Product>('confirm-delete')
  const [products, setProducts] = useState(PRODUCTS)
  useEffect(() => {
    const onDelete = (event: Event) => {
      const id = (event as CustomEvent<number>).detail
      setProducts((list) => list.filter((product) => product.id !== id))
    }
    window.addEventListener('demo:delete', onDelete)
    return () => window.removeEventListener('demo:delete', onDelete)
  }, [])

  if (products.length === 0) {
    return (
      <button className="button button--ghost" onClick={() => setProducts(PRODUCTS)}>
        Restore products
      </button>
    )
  }
  return (
    <ul className="products">
      {products.map((product) => (
        <li key={product.id}>
          <span>{product.name}</span>
          <span className="muted">{product.price}</span>
          <button className="button button--small button--danger" onClick={() => confirm.open(product)}>
            Delete
          </button>
        </li>
      ))}
    </ul>
  )
}

function SignInModal() {
  const signIn = useModal('sign-in')
  const stacked = useModal('stacked')
  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    signIn.close()
  }
  return (
    <Modal id="sign-in" labelledBy="sign-in-title" describedBy="sign-in-text" size="sm">
      <ModalClose />
      <h2 id="sign-in-title" className="modal-title">Sign in</h2>
      <p id="sign-in-text" className="muted">We will send you a magic link.</p>
      <form className="form" onSubmit={onSubmit}>
        <label>
          Email
          <input type="email" name="email" placeholder="you@example.com" autoFocus required />
        </label>
        <div className="actions">
          <button type="button" className="button button--ghost" onClick={() => stacked.open()}>
            Open another on top
          </button>
          <button type="submit" className="button">Send link</button>
        </div>
      </form>
    </Modal>
  )
}

function StackedModal() {
  const { closeAll } = useModalContext()
  return (
    <Modal id="stacked" labelledBy="stacked-title" size="sm" placement="top">
      <ModalClose />
      <h2 id="stacked-title" className="modal-title">Stacked</h2>
      <p className="muted">Escape closes the top modal only. This button closes them all.</p>
      <div className="actions">
        <button className="button" onClick={closeAll}>Close all</button>
      </div>
    </Modal>
  )
}

function ConfirmDeleteModal() {
  return (
    <Modal<Product> id="confirm-delete" labelledBy="confirm-title" size="sm" closeOnBackdrop={false} role="alertdialog">
      {({ data, close }) => (
        <>
          <h2 id="confirm-title" className="modal-title">Delete {data?.name}?</h2>
          <p className="muted">It disappears from the list. The backdrop does not close this one: choose a button.</p>
          <div className="actions">
            <button className="button button--ghost" onClick={close} autoFocus>
              Cancel
            </button>
            <button
              className="button button--danger"
              onClick={() => {
                if (data) window.dispatchEvent(new CustomEvent('demo:delete', { detail: data.id }))
                close()
              }}
            >
              Delete
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}

function FiltersSheet() {
  const filters = useModal('filters')
  return (
    <Modal id="filters" labelledBy="filters-title" placement="bottom" keepMounted>
      <ModalClose />
      <h2 id="filters-title" className="modal-title">Filters</h2>
      <fieldset className="checks">
        <legend className="muted">Category</legend>
        {['Shirts', 'Bags', 'Kitchen', 'Accessories'].map((name) => (
          <label key={name}>
            <input type="checkbox" name="category" value={name} /> {name}
          </label>
        ))}
      </fieldset>
      <div className="actions">
        <button className="button" onClick={filters.close}>Show results</button>
      </div>
    </Modal>
  )
}

function CartDrawer() {
  return (
    <Modal id="cart" labelledBy="cart-title" placement="right">
      <ModalClose />
      <h2 id="cart-title" className="modal-title">Your cart</h2>
      <ul className="products products--plain">
        {PRODUCTS.slice(0, 2).map((product) => (
          <li key={product.id}>
            <span>{product.name}</span>
            <span className="muted">{product.price}</span>
          </li>
        ))}
      </ul>
      <div className="drawer-total">
        <span>Subtotal</span>
        <strong>$63.00</strong>
      </div>
      <button className="button button--block">Check out</button>
    </Modal>
  )
}

function PromoModal() {
  return (
    <Modal id="promo" labelledBy="promo-title" size="sm">
      <ModalClose />
      <h2 id="promo-title" className="modal-title">Opened from a timer</h2>
      <p className="muted">
        <code>store.open('promo')</code> ran in a <code>setTimeout</code>, outside any component.
      </p>
    </Modal>
  )
}

type Theme = 'light' | 'dark' | 'system'

function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem('rmc-theme') as Theme) || 'system'
    } catch {
      return 'system'
    }
  })
  useEffect(() => {
    document.documentElement.style.colorScheme = theme === 'system' ? '' : theme
    try {
      localStorage.setItem('rmc-theme', theme)
    } catch {
      /* storage blocked */
    }
  }, [theme])
  return (
    <div className="theme" role="radiogroup" aria-label="Theme">
      {(['light', 'system', 'dark'] as const).map((value) => (
        <button key={value} role="radio" aria-checked={theme === value} onClick={() => setTheme(value)}>
          {value}
        </button>
      ))}
    </div>
  )
}
