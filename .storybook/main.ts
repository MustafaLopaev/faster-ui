import type { StorybookConfig } from '@storybook/react-vite'

/**
 * The shape of `typescript.reactDocgenTypescriptOptions`, spelled out locally.
 *
 * `@storybook/react-vite` declares it as
 * `Parameters<typeof docgenTypescriptPlugin>[0]`, and under `module: nodenext`
 * TypeScript does not see that plugin's default export as callable — so the
 * whole type collapses to `undefined` and ANY value assigned to it is a type
 * error. The option is fully supported at runtime; only its declared type is
 * broken upstream, so the config type is patched here rather than silenced
 * with a cast.
 */
type ReactDocgenTypescriptOptions = {
  tsconfigPath?: string
  shouldExtractLiteralValuesFromEnum?: boolean
  shouldRemoveUndefinedFromOptional?: boolean
  propFilter?: (prop: { parent?: { fileName: string } }) => boolean
}

type Config = Omit<StorybookConfig, 'typescript'> & {
  typescript?: Omit<NonNullable<StorybookConfig['typescript']>, 'reactDocgenTypescriptOptions'> & {
    reactDocgenTypescriptOptions?: ReactDocgenTypescriptOptions
  }
}

const config: Config = {
  framework: '@storybook/react-vite',
  // The adversarial-content stories live under `visual/` because they are
  // visual-regression fixtures rather than API documentation — a reader
  // learning what Button does should not meet a 200-character label first.
  // They are still reviewable in the workbench like anything else.
  stories: ['../src/**/*.stories.tsx', '../visual/**/*.stories.tsx'],
  // addon-docs generates the autodocs pages the `autodocs` tag in
  // preview.tsx asks for; addon-a11y runs axe against every story.
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  // Props are extracted with react-docgen-TYPESCRIPT, not the react-vite
  // default (`react-docgen`). The default is a Babel-level reader: it sees the
  // prop NAME but resolves no imported type, so `size?: InputSize` arrives as
  // the opaque string "InputSize". Storybook's `inferControl` has no case for
  // an unresolved type and falls through to an OBJECT control — a JSON editor
  // wrapped around a string, which is why every union and every `ReactNode`
  // prop looked configurable in the Controls panel and changed nothing.
  // react-docgen-typescript runs the real compiler, so the const-object unions
  // (Principle: no `enum`) resolve to their literal members and become
  // radio/select controls. It is also the only reader that finds Button's
  // props at all — the discriminated union defeats the Babel reader entirely.
  //
  // Native element props (`placeholder`, `disabled`, `type`, …) are still NOT
  // extracted: `propFilter` drops everything declared in node_modules, because
  // expanding `ComponentPropsWithoutRef<'input'>` would put ~250 DOM
  // attributes in the props table. The handful worth driving is declared by
  // hand in each component's `meta.argTypes`.
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      tsconfigPath: './tsconfig.lib.json',
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: (prop) => !prop.parent || !/node_modules/.test(prop.parent.fileName),
    },
  },
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
