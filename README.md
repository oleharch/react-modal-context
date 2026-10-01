# react-modal-context

Modals by id for React. One provider, a `useModal('login')` hook you can call anywhere in the tree,
and a `<Modal>` on the native `<dialog>`, so the browser does the hard parts: the top layer, focus,
the inert page behind it and Escape.

- **Zero dependencies**, about 3 kB gzipped (plus 1.4 kB for the optional CSS). React 18 and 19.
- **Pass data** to a modal: `confirm.open(product)`.
- **Open from anywhere**: components, event handlers, timers, outside React through the store.
- **Re-renders only what changed**: built on `useSyncExternalStore`.
- **Optional CSS** with enter and exit animations, bottom sheets, side drawers, sizes, light and dark themes.
- **Accessible by default**: an accessible name is required by the types, `autoFocus` works, focus returns on close.
- Works with Next.js App Router (`'use client'` included) and server rendering.

**Demo:** [react-modal-context.vercel.app](https://react-modal-context.vercel.app)

## Install

```bash
npm i github:oleharch/react-modal-context
```

The package builds itself on install (`prepare`), so you get compiled JavaScript and type definitions.

## Usage

```tsx
import { Modal, ModalClose, ModalProvider, useModal } from 'react-modal-context'
import 'react-modal-context/styles.css' // optional

export function App() {
  return (
    <ModalProvider>
      <Header />
      <SignInModal />
    </ModalProvider>
  )
}

function Header() {
  const signIn = useModal('sign-in')
  return <button onClick={() => signIn.open()}>Sign in</button>
}

function SignInModal() {
  return (
    <Modal id="sign-in" labelledBy="sign-in-title" size="sm">
      <ModalClose />
      <h2 id="sign-in-title">Sign in</h2>
      <input type="email" autoFocus />
    </Modal>
  )
}
```

### Pass data

```tsx
type Product = { id: number; name: string }

const confirm = useModal<Product>('confirm-delete')
confirm.open(product)

<Modal<Product> id="confirm-delete" labelledBy="confirm-title" closeOnBackdrop={false} role="alertdialog">
  {({ data, close }) => (
    <>
      <h2 id="confirm-title">Delete {data?.name}?</h2>
      <button onClick={close}>Cancel</button>
    </>
  )}
</Modal>
```

The last data stays available while the close animation runs, so the text does not blink.

### Open from outside React

```tsx
import { createModalStore, ModalProvider } from 'react-modal-context'

export const modals = createModalStore()

<ModalProvider store={modals}>...</ModalProvider>

// anywhere: a fetch callback, a WebSocket message, a router guard
modals.open('session-expired')
```

### Sheets and drawers

```tsx
<Modal id="filters" labelledBy="filters-title" placement="bottom" keepMounted>…</Modal>
<Modal id="cart" labelledBy="cart-title" placement="right">…</Modal>
```

`placement` and `size` only set `data-placement` and `data-size`. They take effect with the optional stylesheet
or with your own CSS.

## API

### `<ModalProvider>`

| Prop | Type | Default | |
|---|---|---|---|
| `store` | `ModalStore` | a new store | Pass one to open modals from outside React |
| `lockScroll` | `boolean` | `true` | Lock page scroll while any modal is open (`overflow: hidden` + `scrollbar-gutter: stable`, no layout shift) |

### `useModal<T>(id)`

Returns `{ isOpen, data, open(data?), close() }` for one modal. The component re-renders only when that modal opens,
closes or gets new data.

### `<Modal<T>>`

Accepts every `<dialog>` attribute (`className`, `style`, `role`, `data-*`…) plus:

| Prop | Type | Default | |
|---|---|---|---|
| `id` | `string` | | Required |
| `labelledBy` or `label` | `string` | | One is required: the id of the visible title, or a text label |
| `describedBy` | `string` | | `aria-describedby` |
| `children` | `ReactNode \| ({ id, data, close }) => ReactNode` | | Content, or a render function that gets the data |
| `closeOnBackdrop` | `boolean` | `true` | A click outside the dialog box closes it. Clicks on the padding and text selections that end outside do not |
| `closeOnEscape` | `boolean` | `true` | Escape and the Android back gesture |
| `keepMounted` | `boolean` | `false` | Keep children (and their state) while closed |
| `placement` | `'center' \| 'top' \| 'bottom' \| 'left' \| 'right'` | `center` | For the stylesheet |
| `size` | `'sm' \| 'md' \| 'lg' \| 'full'` | `md` | For the stylesheet |
| `portal` | `boolean \| Element` | `false` | Not needed: a modal dialog renders in the top layer. Use only if the DOM must live elsewhere |
| `onOpen`, `onClose` | `() => void` | | `onClose` runs for every way of closing |

### `<ModalClose>`

A button that closes the modal it is in. Without children it renders an × icon labelled "Close". Takes every `<button>` attribute.

### Other exports

| Export | |
|---|---|
| `createModalStore()` | `{ open(id, data?), close(id?), closeAll(), getSnapshot(), subscribe() }`. `close()` without an id closes the top modal |
| `useCurrentModal()` | `{ id, data, close }` of the modal the component is rendered in |
| `useModalContext()` | The whole stack: `openModals`, `openModal`, `closeModal`, `closeAll`, `isOpen`. Re-renders on every change |
| `useModalStore()`, `useModalEntry(id)` | Low-level access |

## Styling

The stylesheet is optional and lives in `@layer rmc`, so any style of yours wins without `!important`.
Change the look with custom properties:

```css
[data-rmc-modal] {
  --rmc-bg: #fff;
  --rmc-fg: #16181d;
  --rmc-radius: 20px;
  --rmc-padding: 28px;
  --rmc-width: 36rem;
  --rmc-backdrop: rgb(0 0 0 / 0.5);
  --rmc-backdrop-blur: 8px;
  --rmc-duration: 250ms;
}
```

Defaults use `light-dark()`, so both themes follow `color-scheme`. Animations use `@starting-style` and
`transition-behavior: allow-discrete` for the dialog and its `::backdrop`, and respect `prefers-reduced-motion`.
The component waits for the exit transition (`getAnimations()`) before it unmounts the content, so your own CSS
animations get the same treatment.

## Browser support

The native `<dialog>` works in every current browser. Enter and exit animations need `@starting-style`
(Chrome 117, Safari 17.5, Firefox 129); older browsers open and close instantly. Light dismiss uses the
`closedby` attribute where it exists (Chrome 134) and a JavaScript fallback elsewhere.

## Testing your app

jsdom does not implement `showModal()`. Add this to your test setup:

```ts
HTMLDialogElement.prototype.showModal ??= function () { this.setAttribute('open', '') }
HTMLDialogElement.prototype.close ??= function () {
  this.removeAttribute('open')
  this.dispatchEvent(new Event('close'))
}
```

## Migrating from 1.x

- `<Modal>` needs `label` or `labelledBy` (a TypeScript error otherwise).
- Modals render in place instead of a portal into `document.body`. Pass `portal` to keep the old behaviour.
- `openModal(id, data)` with an id that is already open now updates its data.
- Scroll lock moved to the provider and sets `overflow` on `<html>` instead of `<body>`.

## Development

```bash
npm install
npm run dev        # demo on http://localhost:5173
npm test           # Vitest + Testing Library
npm run typecheck
npm run build      # library to dist/, demo to demo-dist/
```

## License

MIT, [Oleh Molchanov](https://oleh-molchanov.vercel.app).
