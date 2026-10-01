import '@testing-library/jest-dom/vitest'

/* jsdom does not implement the modal methods of <dialog>; a minimal stand-in. */
const proto = HTMLDialogElement.prototype
if (typeof proto.showModal !== 'function') {
  proto.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
}
if (typeof proto.close !== 'function') {
  proto.close = function (this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}
