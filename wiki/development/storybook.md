# Storybook & Design-to-Code

Isolated component development for the app package.

## Setup

- `@storybook/nextjs`, run with `yarn storybook` (port 6006) from `app/`
- Config: `app/.storybook/main.js`, `app/.storybook/preview.tsx`
- Component layout (see `app/components/TopNav/`): component + `*.stories.tsx` co-located in `components/`, mock data in `mocks/`

## Converting Figma Designs

- Replace inline styles with theme tokens (`bg-background-*`, `text-color-*` — palette documented in CLAUDE.md, defined in `app/utils/theme/themes.tsx`); never hardcode hex
- Hover states not in the palette: `hover:brightness-90` instead of inventing colors
- Replace Figma's static "active/highlighted" frames with real interactive CSS states
- Replace absolute Figma asset URLs; extract SVG icons as React components in an `Icons.tsx`
- Static `href`s → SPA id-based routing (`/#/{id}/dashboard`); pass ids through mock data so stories exercise routing
- Flex-wrap usually beats grid for variable item counts (e.g. partner logos)
