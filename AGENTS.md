# figma-make-app

React + Vite + Tailwind CSS project running inside Figma Make.

## Development Server

A Vite development server is **already running** on `$PORT` (default 8443). You don't need to start it manually.

- Preview URL: The user can access the running app through the preview panel
- Hot reload: Changes to source files are reflected immediately

## Project Structure

This is the canonical project structure. Start with task-relevant files below. Only follow imports or inspect other files when required, when a documented path is missing, or when the repository contradicts this guide.

- `src/main.tsx` - React entrypoint; imports `src/index.css` and mounts `src/App.tsx` into the `#root` element
- `src/App.tsx` - Primary application component and the usual starting point for UI work
- `src/index.css` - Global CSS entrypoint and Tailwind CSS v4 import
- `index.html` - Vite HTML shell containing the `#root` element and loading `src/main.tsx`
- `package.json` - Project dependencies and the Vite build, development, preview, and formatting scripts
- `vite.config.ts` - Vite configuration with React, Tailwind CSS v4, and Figma Make plugins plus the `@` alias for `src`
- `.mise.toml` - Toolchain versions for Node.js and pnpm

## Dependencies

- Runtime: React 19 and React DOM 19
- Styling: Tailwind CSS v4 with the `@tailwindcss/vite` plugin
- Build tooling: Vite 8, TypeScript 5.7, and `@vitejs/plugin-react`
- Formatting: oxfmt

## Styling

This project uses **Tailwind CSS v4** through the `@tailwindcss/vite` plugin configured in `vite.config.ts`. `src/index.css` imports Tailwind with `@import 'tailwindcss';`. Use Tailwind utility classes directly in JSX and put global CSS or Tailwind v4 theme customization in `src/index.css`. This scaffold does not need a Tailwind config file or PostCSS config.

`src/main.tsx` imports `src/index.css`, so global font wiring belongs in `src/index.css`. Keep CSS `@import` statements first, then add any `@font-face` rules and font-family defaults there.

### No arbitrary values — ever

**Never** write arbitrary-value Tailwind classes such as `text-[14px]`, `p-[15px]`, `rounded-[8px]`, `bg-[#0d5c4b]`, `shadow-[...]`, `w-[340px]`, or any `name-[value]` form.

Always use the Tailwind scale or a named token from `src/index.css`:

| Need | Use instead of arbitrary |
|------|--------------------------|
| Font size 12px | `text-xs` |
| Font size 14px | `text-sm` |
| Font size 16px | `text-base` |
| Font size 18px | `text-lg` |
| Font size 20px | `text-xl` |
| Font size 24px | `text-2xl` |
| Other sizes (10, 11, 13, 15, 17, 22, 26px) | `text-10` … `text-26` (defined in `src/index.css`) |
| Spacing/padding/margin N px | `p-{N/4}` — e.g. 16px → `p-4`, 20px → `p-5`, 14px → `p-3.5` |
| Width/height N px | `w-{N/4}` — e.g. 40px → `w-10`, 18px → `w-4.5` |
| Border radius ≤5px | `rounded-sm` |
| Border radius 6–7px | `rounded-md` |
| Border radius 8–9px | `rounded-lg` |
| Border radius 10–11px | `rounded-xl` (12px) — use nearest |
| Border radius 12–13px | `rounded-xl` |
| Border radius 14–15px | `rounded-2xl` (16px) — use nearest |
| Border radius 16–23px | `rounded-2xl` |
| Border radius 24px+ | `rounded-3xl` |
| Brand green | `primary-700` (main), `primary-800` (hover); full scale `primary-50…900` |
| Brand yellow | `secondary-500` / `secondary-600`; full scale `secondary-50…900` |
| AI violet | `ai-600`, `ai-800`, `ai-900` |
| Named shadows | `shadow-card`, `shadow-panel`, `shadow-primary-button`, etc. (defined in `src/index.css`) |

**Radius and spacing rules:**
- For border radius: always round to the nearest standard Tailwind class (`rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-full`). Never use `rounded-10`, `rounded-14`, or any custom radius token.
- For spacing/padding/margin/width/height: always use the standard Tailwind numeric scale (`p-3`, `p-3.5`, `p-4`, `w-10`, etc.). The scale steps by 0.5 (every 2px), so any pixel value maps to the nearest step. Never use arbitrary values.
- For font sizes: custom tokens `text-10`, `text-11`, `text-13`, `text-15`, `text-17`, `text-22`, `text-26` are allowed when no standard size fits.

If a value truly cannot be expressed with the above, add a named `@utility` to `src/index.css` — do not write an arbitrary `name-[value]` class.

## Code quality

- Use double quotes for strings containing apostrophes (`"We're here to help"`), or escape them in single-quoted strings. An unescaped apostrophe in a single-quoted string breaks the build.
- Ensure JSX tags are closed and braces are balanced.
- Export components as default exports.
