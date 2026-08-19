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
      .filter(
        (p) =>
          !(
            p &&
            typeof p === 'object' &&
            'name' in p &&
            // 'vite:dts' through vite-plugin-dts v4; 'unplugin-dts' from v5
            (p.name === 'vite:dts' || p.name === 'unplugin-dts')
          ),
      )
    return viteConfig
  },
}

export default config
