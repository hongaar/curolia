# Agent notes (Curolia monorepo)

## Monorepo scripts (root `package.json`)

- The **root** `package.json` should only expose **`turbo run …`** for build/lint/typecheck/test/dev (plus **`prettier`** **`format`** / **`format:check`**, since Prettier is a direct root devDependency). Do **not** add thin wrappers that chain **`npm run -w`** or other workspaces from root (e.g. avoid **`codegen && turbo build`**).
- **CI/CD** and **developers** orchestrate codegen and checks via **Turbo** (e.g. `npx turbo run lint typecheck test build`). Prefer Turbo **`codegen`**: **`@curolia/brand`** (`generate:web`) then **`@curolia/web`** (`plugins:sync`), wired with package-scoped task dependencies in the root **`turbo.json`**. Do **not** add root **`package.json`** chains of **`npm run -w …`**. Underlying scripts stay on each workspace **`package.json`**; each participating package exposes its own local script for Turbo to run.
- Keep task orchestration in the root **`turbo.json`**. Avoid per-package **`turbo.json`** files unless a package has a genuinely local, package-specific graph that cannot be expressed clearly from the root.
- Root **`devDependency`** **`typescript`** plus **`package.json`** **`overrides.@vercel.node.typescript5`** → **`$typescript`** prevents **`@vercel/node`**’s **`typescript5`** alias from winning **`node_modules/.bin/tsc`** (which broke **`ignoreDeprecations`: `"6.0"`** when it pointed at TS 5.9). **`apps/web`** can keep plain **`tsc`** in **`build`** / **`typecheck`**.

## Database TypeScript types

- **Do not hand-edit** `apps/web/src/lib/database.types.ts`. It is generated from the Supabase schema. Do **not** paste or invent table definitions here to “fix” TypeScript when codegen has not run yet—doing so drifts from the real DB, duplicates partial edits (other tables/columns change too), and violates this repo’s single source of truth.
- After adding or changing migrations, apply them to the **local** database, then regenerate types. Prefer migrating without wiping data:

  ```bash
  npm run db:migrate -w @curolia/supabase
  npm run db:types -w @curolia/supabase
  ```

  (`db:types` runs `supabase gen types typescript --local > apps/web/src/lib/database.types.ts` from the `@curolia/supabase` package and requires local Supabase to be running with migrations applied.)

- Use `npm run db:reset -w @curolia/supabase` only when you intentionally want a full local reset, not as the default after routine schema changes.

## Plugin packages

- Implementations live under **`packages/plugins/<plugin-id>/`** (e.g. `@curolia/plugin-ical`). The root `package.json` **workspaces** list must include **`packages/plugins/*`** so nested plugin packages participate in the monorepo install.
- Inter-package deps use **`file:`** specifiers (e.g. `@curolia/web` → `packages/plugin-contract`) so installs work on npm versions that do not support the `workspace:` protocol.
- Shared **manifest / contribution types** live in **`@curolia/plugin-contract`** (`packages/plugin-contract`). Use that for declaring global settings, per-map settings, app hooks, and Edge Function metadata.
- **`@curolia/brand`** and **plugin registry** (`apps/web/scripts/generate-plugin-registry.mjs`, **`npm run plugins:sync -w @curolia/web`**) must not run from **`apps/web` lifecycle hooks**. Run them via Turbo **`codegen`** (or the two workspace commands directly) before builds/typechecks in **CI**, before **`vercel build`** in the deploy workflow, or locally—never from chained root **`package.json`** scripts.

- **Supabase Edge Functions** for a plugin live under `packages/plugins/<id>/supabase/functions/<slug>/`. After changing plugin-owned function sources, copy them into the Supabase CLI project with:

  ```bash
  npx turbo run functions:sync
  ```

  before `npm run functions:start -w @curolia/supabase` / remote `supabase functions deploy`.

  **`functions:sync`** copies each plugin’s `supabase/functions/<slug>/` into `packages/supabase/supabase/functions/` (those copies are gitignored). It also runs **`packages/supabase/scripts/extract-plugin-oauth-registry.ts`** (via **`tsx`**) so **`scopes-registry.gen.ts`** is built from each plugin’s **`src/oauth-registry.ts`** (preferred; no React/CSS) or **`pluginManifest.contributions.oauth`** in **`src/index.ts`**. Companion scopes merged at authorize time (e.g. Google OIDC `openid` / `email` / `profile`) live in **`@curolia/plugin-oauth`** (**`oauth-companion-scopes.ts`**); the extractor’s strip step must match that module. Shared Edge helpers belong in each function’s own **`lib/`** (not a cross-function **`_shared/`** folder).

- **Web UI** may stay in `apps/web` initially; packages should still export **manifest + config parsers** so behavior and declarations stay with the plugin. Prefer moving React panels into the plugin package when they stabilize (with `react` as a `peerDependency`).

## Static pages (`@curolia/site`)

- Marketing and legal **pages** (`LandingPage`, `ContactPageContent`, `PrivacyPolicyPageContent`, `TermsPageContent`, `OpenSourceLicensesPageContent`) and embeddable **content** live in **`packages/site`**. Import via `@curolia/site/pages` and `@curolia/site/content`.
- **`apps/web`** wires routes in `App.tsx` and composes the product **About** dialog (`apps/web/src/components/about/about-dialog.tsx`) from `@curolia/ui/about-dialog` primitives and `@curolia/site/content`. **`@curolia/ui` must not** import other `@curolia/*` packages.
- **Storybook** for site: `npm run dev -w @curolia/site` (port 6007). Config is aligned with `@curolia/ui` but **duplicated** under `packages/site/.storybook` and `packages/site/src/storybook` so packages can diverge independently.
- Landing images live in `packages/site/public/landing/` (bundled via imports in `src/pages/landing-images.ts`).

## Web styling (`@curolia/ui`)

- **Design tokens and global CSS** live in **`packages/ui/src/styles/`** (import **`@curolia/ui/styles`** from `apps/web` `main.tsx`). Do not add Tailwind or app-local component CSS in **`apps/web`** or **`packages/plugins`**.
- **Primitives** (`Button`, `Dialog`, …) use **CSS modules** + **Base UI** under **`packages/ui/src/components/<slug>/`** (one directory per component: **`<slug>.tsx`**, optional **`<slug>.module.css`**, **`index.ts`**, optional **`<slug>.stories.tsx`**).
- **`package.json` `exports`** use one entry per slug: **`./<slug>`** → **`./src/components/<slug>/index.ts`** (no aliases—e.g. `@curolia/ui/main-toolbar`, not `main-toolbar-panel`). Add a matching export when you add a component directory.
- **Storybook** (`npm run dev -w @curolia/ui`): colocate **`*.stories.tsx`** in the component directory; use a **literal** flat `title: "…"` (no `Components/` prefix) plus **`componentStoryMeta(summary, usage)`** from **`src/storybook/docs.ts`** (CSF cannot index dynamic meta factories). Per-story notes use **`storyDocs("…")`**. Prop tables come from **react-docgen-typescript**, not a central registry. Docs **Show code** is post-processed by **`src/storybook/transform-story-source.ts`**. After UI changes run **`npx turbo run typecheck`** / Storybook build as usual.
  - **Args** ([Storybook args](https://storybook.js.org/docs/writing-stories/args)): set `component` on meta and drive demos with story **`args`** so the default render passes props through. Put shared defaults on **`meta.args`**. Use **`satisfies Meta<typeof Component>`** and **`type Story = StoryObj<typeof meta>`** for typed controls.
  - **Interactive props** (checkbox, switch, pickers, lightbox `open`, etc.): `render: function Render()` plus **`useStoryArgs`** from **`src/storybook/args.ts`** (re-exports `storybook/preview-api`). Read with `const [{ prop }, updateArgs] = useStoryArgs<…>()` and call **`updateArgs({ prop: next })`** in handlers—do **not** use React **`useState`** in story `render` (composite layout demos like App Shell / Map may still use local state inside helper components).
  - Omit custom **`render`** when **`args`** alone is enough; use **`render: (args) => …`** / **`render: function Render(args) { … }`** only for composition (labels, portals, multi-instance rows).
- **`apps/web`** and **`packages/plugins`** compose UI via **`@curolia/ui` props and named components only**—no inline `className` utility strings (ESLint enforces this in `apps/web`) and no CSS module class imports from `@curolia/ui`.
- **Share styling through components and props, not exported class names.** When two surfaces need the same look (e.g. sidebar dropdown vs popover picker rows), add a focused component in **`@curolia/ui`** that owns the CSS module and accepts props such as **`icon`**, **`label`**, **`active`**. Do **not** export helpers like **`fooClassName()`**, raw **`styles`** objects, or other class-string factories for cross-file reuse—those leak module internals and drift quickly. Keep class names private to the component directory; expose behavior via named components and typed props instead.
- After changing plugin-owned UI, no `functions:sync` change is needed; run **`npx turbo run typecheck`** / **`build`** as usual.

## Git commits

- Use **[Conventional Commits](https://www.conventionalcommits.org/)**: `type(scope): short imperative summary` (e.g. `feat(web): add profile-scoped map URLs`, `fix(supabase): …`, `refactor(ui): …`).
- Common types: **`feat`**, **`fix`**, **`refactor`**, **`chore`**, **`docs`**, **`test`**, **`ci`**, **`build`**. Pick the type that best matches the change; optional **`scope`** is usually the workspace or area (`web`, `ui`, `supabase`, `routing`, …).
- Keep the subject line concise; add a body only when the “why” is not obvious from the subject.
