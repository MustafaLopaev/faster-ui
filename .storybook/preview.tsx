import type { Preview } from '@storybook/react-vite'
import '../src/tokens/tokens.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
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
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    (Story, context) => {
      // The whole mode contract: `dark` class on the document root, nothing else.
      document.documentElement.classList.toggle('dark', context.globals.theme === 'dark')
      return (
        <div className="fui:bg-surface-page fui:font-sans fui:p-6">
          <Story />
        </div>
      )
    },
  ],
}

export default preview
