// A consumer application, consuming the package exactly as its README says to.
// Both imports below resolve through `exports`; a broken map fails the build.
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Button, Dialog, Input } from '@mlopaev/faster-ui'
import type { ButtonProps, DialogProps, InputProps } from '@mlopaev/faster-ui'
// The stylesheet is a SEPARATE entry point — `dist/index.js` imports no CSS.
import '@mlopaev/faster-ui/styles.css'

// Naming the prop types is part of the surface a consumer relies on: if one
// stopped being exported, this fixture stops compiling.
const buttonProps: ButtonProps = { variant: 'outline', size: 'lg' }
const inputProps: InputProps = { label: 'Email', clearable: true }

function App() {
  const [open, setOpen] = useState(false)
  const dialog: Pick<DialogProps, 'size' | 'dividers'> = { size: 'md', dividers: true }
  return (
    <main>
      <Button {...buttonProps} onClick={() => setOpen(true)}>
        Open
      </Button>
      <Button iconOnly aria-label="Add">
        +
      </Button>
      <Input {...inputProps} defaultValue="you@example.com" />
      <Dialog
        {...dialog}
        open={open}
        onClose={() => setOpen(false)}
        title="Consumer dialog"
        footer={<Button onClick={() => setOpen(false)}>Close</Button>}
      >
        Rendered from the packed tarball.
      </Dialog>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
