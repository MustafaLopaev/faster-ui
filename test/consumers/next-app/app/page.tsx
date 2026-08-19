// SECOND CONSUMER STEP: the package ships no `'use client'` directive, so its
// components cannot be imported into a Server Component. The consumer marks
// their own module instead. Without this line `next build` fails with
// "You're importing a component that needs `useState`". Recorded in
// specs/004-quality-automation/findings.md#f-5.
'use client'

import { useState } from 'react'
import { Button, Dialog, Input } from '@mlopaev/faster-ui'

export default function Page() {
  const [open, setOpen] = useState(false)
  return (
    <main>
      <h1>faster-ui consumer</h1>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Button variant="outline" danger>
        Delete
      </Button>
      <Button iconOnly aria-label="Add">
        +
      </Button>
      <Input label="Email" placeholder="you@example.com" clearable />
      <Input label="Quantity" type="number" defaultValue={2} />
      <Input label="Broken" error="Enter a valid address" />
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Server-rendered, then hydrated"
        dividers
        footer={<Button onClick={() => setOpen(false)}>Close</Button>}
      >
        If hydration disagreed with the server pass, the console would say so and
        the smoke check would fail.
      </Dialog>
    </main>
  )
}
