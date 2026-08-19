import type { Preview } from '@storybook/react-vite'
import './preview.css'

const preview: Preview = {
  // Autodocs for every component: a generated Docs page per story file, built
  // from the JSDoc on each public prop (Constitution Principle V).
  tags: ['autodocs'],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // The a11y addon is a gate, not decoration: violations surface as errors in
    // the panel (and fail @storybook/test-runner if one is wired up later).
    a11y: { test: 'error' },
    docs: { toc: true },
  },
  globalTypes: {
    theme: {
      description: 'Color mode (token layer only — components never see it)',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
    palette: {
      description: 'Token layer: the Figma-faithful default, or the opt-in AA overlay',
      toolbar: {
        title: 'Palette',
        icon: 'accessibility',
        items: [
          { value: 'figma', title: 'Figma-faithful' },
          { value: 'aa', title: 'WCAG AA (a11y.css)' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light', palette: 'figma' },
  decorators: [
    (Story, context) => {
      // The whole mode contract: `dark` class on the document root, nothing else.
      document.documentElement.classList.toggle('dark', context.globals.theme === 'dark')
      // The a11y overlay is a stylesheet a consumer opts into; the toolbar
      // toggles the same thing by attaching/detaching it.
      const AA_ID = 'fui-a11y-overlay'
      const want = context.globals.palette === 'aa'
      const existing = document.getElementById(AA_ID)
      if (want && !existing) {
        const link = document.createElement('link')
        link.id = AA_ID
        link.rel = 'stylesheet'
        link.href = new URL('../src/tokens/a11y.css', import.meta.url).href
        document.head.append(link)
      } else if (!want && existing) {
        existing.remove()
      }
      return (
        <div className="fui:bg-surface-page fui:font-sans fui:p-6">
          <Story />
        </div>
      )
    },
  ],
}

export default preview
