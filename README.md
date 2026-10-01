# react-modal-context

Modals by id for React. One provider, a `useModal('login')` hook you can call anywhere in the tree,
and a `<Modal>` built on the native `<dialog>` element, so the browser does the hard parts:
focus trapping, Escape, inert background and the top layer.

TypeScript, zero dependencies, about 120 lines. Copy the two files or install from the repo.

**Demo:** [react-modal-context.vercel.app](https://react-modal-context.vercel.app)

## Why

Most modal state ends up as `const [open, setOpen] = useState(false)` lifted three components up,
with props drilled down to a button. With an id-based context the button that opens the modal and
the modal itself can live anywhere, and nothing in between needs to know.

## Usage

```tsx
import { Modal, ModalProvider, useModal } from 'react-modal-context'

function App() {
  return (
    <ModalProvider>
      <Header />
      <LoginModal />
    </ModalProvider>
  )
}

function Header() {
  const login = useModal('login')
  return <button onClick={login.open}>Sign in</button>
}

function LoginModal() {
  const login = useModal('login')
  return (
    <Modal id="login" labelledBy="login-title">
      <h2 id="login-title">Sign in</h2>
      <button onClick={login.close}>Close</button>
    </Modal>
  )
}
```

## API

### `<ModalProvider>`

Holds the list of open modal ids. Put it once near the root.

### `useModal(id)`

Returns `{ open, close, isOpen }` bound to that id. Stable between renders.

### `useModalContext()`

The raw context: `openModals`, `openModal(id)`, `closeModal(id?)` (without an id closes the one opened last),
`closeAll()`, `isOpen(id)`. Throws outside the provider.

### `<Modal>`

| Prop | Type | Default | What it does |
|---|---|---|---|
| `id` | `string` | | Id used by `useModal` |
| `label` | `string` | | `aria-label` of the dialog |
| `labelledBy` | `string` | | `aria-labelledby`, prefer this when there is a visible heading |
| `className` | `string` | | Class on the `<dialog>`; style `::backdrop` from CSS |
| `closeOnBackdrop` | `boolean` | `true` | Close when the backdrop is clicked |
| `onClose` | `() => void` | | Called after the dialog closes for any reason |

Children are rendered only while the modal is open, so forms reset and effects clean up on close.
Modals stack: Escape closes the top one, `closeAll()` closes everything.

## How it works

- The provider keeps `string[]` of open ids. Opening the same id twice is a no-op.
- `<Modal>` renders a `<dialog>` into `document.body` through a portal and calls `showModal()` / `close()`
  whenever the context changes.
- The dialog's `close` event (Escape, `dialog.close()`) writes back to the context, so the two never drift.
- Body scroll is locked while a modal is open.

## Development

```bash
npm install
npm run dev        # demo on http://localhost:5173
npm test           # vitest + Testing Library
npm run typecheck
```

## License

MIT, [Oleh Molchanov](https://oleh-molchanov.vercel.app).
