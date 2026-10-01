import { Modal, ModalProvider, useModal, useModalContext } from '../lib'

function LoginButton() {
  const login = useModal('login')
  return (
    <button type="button" onClick={login.open}>
      Open login {login.isOpen ? '(open)' : ''}
    </button>
  )
}

function LoginModal() {
  const login = useModal('login')
  const confirm = useModal('confirm')
  return (
    <Modal id="login" labelledBy="login-title" className="modal">
      <h2 id="login-title">Sign in</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          login.close()
        }}
      >
        <label>
          Email
          <input type="email" name="email" autoFocus required />
        </label>
        <div className="actions">
          <button type="submit">Sign in</button>
          <button type="button" onClick={confirm.open}>
            Open a second modal on top
          </button>
          <button type="button" onClick={login.close}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  )
}

function ConfirmModal() {
  const { closeAll } = useModalContext()
  const confirm = useModal('confirm')
  return (
    <Modal id="confirm" label="Confirm" className="modal modal--small">
      <p>Modals stack. Escape closes the top one, this button closes all.</p>
      <div className="actions">
        <button type="button" onClick={closeAll}>
          Close all
        </button>
        <button type="button" onClick={confirm.close}>
          Back
        </button>
      </div>
    </Modal>
  )
}

export function App() {
  return (
    <ModalProvider>
      <main>
        <h1>react-modal-context</h1>
        <p>
          Modals by id. <code>useModal('login')</code> anywhere in the tree, a native <code>&lt;dialog&gt;</code> for
          focus, Escape and the backdrop.
        </p>
        <LoginButton />
      </main>
      <LoginModal />
      <ConfirmModal />
    </ModalProvider>
  )
}
