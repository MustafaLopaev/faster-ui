import '@testing-library/jest-dom'

// R-10 shim: jsdom 26.x ships HTMLDialogElement without show/showModal/close
// (verified in T005). This is the minimal method fill so Jest can exercise the
// controlled contract (onClose call counts, focus restore, ARIA wiring); real
// modal behavior — top layer, inert background, focus trap — is asserted in
// Cypress on a real browser.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.show = function (this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    if (!this.open) return
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
}
