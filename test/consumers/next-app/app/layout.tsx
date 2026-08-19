import type { ReactNode } from 'react'
// CONSUMER STEP, NOT A SIDE EFFECT: `dist/index.js` contains no CSS import
// (asserted in src/ssr-node.test.ts), so a consumer imports the stylesheet
// explicitly. Removing this line builds fine and renders unstyled — which is
// exactly what quickstart Scenario 2's second half checks.
import '@mlopaev/faster-ui/styles.css'

export const metadata = { title: 'faster-ui consumer — Next.js App Router' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
