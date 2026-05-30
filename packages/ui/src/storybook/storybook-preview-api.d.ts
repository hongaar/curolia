declare module "storybook/preview-api" {
  export function useArgs<
    T extends Record<string, unknown> = Record<string, unknown>,
  >(): [T, (newArgs: Partial<T>) => void];
}
