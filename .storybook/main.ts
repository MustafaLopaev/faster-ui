import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.stories.tsx'],
  addons: ['@storybook/addon-a11y'],
  viteFinal: async (viteConfig) => {
    // The root vite config carries the library build (lib mode + dts);
    // Storybook builds an app from the same config, so drop those pieces.
    if (viteConfig.build) viteConfig.build.lib = false
    viteConfig.plugins = (viteConfig.plugins ?? [])
      .flat()
      .filter((p) => !(p && typeof p === 'object' && 'name' in p && p.name === 'vite:dts'))
    return viteConfig
  },
}

export default config
