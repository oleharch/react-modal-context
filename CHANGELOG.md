# Changelog

## 2.0.1

- `open` passed straight to `onClick` (`onClick={modal.open}`, the 1.x style) no longer stores the click event as modal data.

## 2.0.0

### Added
- Pass data to a modal: `open(data)`, `useModal<T>().data`, render-function children `({ data, close }) => …`.
- `createModalStore()` and the `store` prop: open and close modals from outside React.
- `ModalClose` button and `useCurrentModal()`.
- Optional stylesheet `react-modal-context/styles.css`: enter and exit animations with `@starting-style`, blurred backdrop,
  bottom sheet and side drawers (`placement`), sizes (`size`), light and dark themes through `light-dark()`,
  custom properties, `@layer rmc`, reduced motion.
- `closeOnEscape`, `keepMounted`, `describedBy`, `onOpen`, `portal`, and every `<dialog>` attribute.
- Native light dismiss through `closedby` where supported.
- Published as a real package: compiled ESM, type definitions, `exports` map, `'use client'`, installable from GitHub.
- CI: typecheck, tests and build on every push.

### Fixed
- Page scroll unlocked when two modals were open and the first one closed.
- A click on the dialog padding, or a text selection released outside, closed the modal.
- `autoFocus` inside a modal did not work: content now mounts into the already open dialog.
- Close animations were cut off: content now stays mounted until the exit transition ends.
- Every consumer re-rendered when any modal changed: `useModal(id)` now subscribes to its own entry only.

### Changed
- `<Modal>` requires `label` or `labelledBy`.
- Modals render in place (the top layer makes a portal unnecessary). Use `portal` for the old behaviour.
- Scroll lock lives in the provider and uses `<html>` with `scrollbar-gutter: stable`.
- Dependencies: React 19.3, TypeScript 7, Vite 8, Vitest 5, jsdom 30.

## 1.0.0

First release: `ModalProvider`, `useModal`, `<Modal>` on the native `<dialog>`, demo and tests.
