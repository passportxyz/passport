# Storybook Component Development Workflow

## Overview
Isolated component development workflow using Storybook with Next.js integration.

## Setup and Configuration
- **Storybook Package**: @storybook/nextjs for Next.js compatibility
- **Port**: 6006 (default)
- **Command**: `yarn storybook`
- **Hot Reload**: Automatic on file changes

## Component Structure
Standard structure for components with Storybook:
```
/app/components/ComponentName/
├── components/     # React component files
├── mocks/         # Mock data for stories
└── stories/       # Storybook story files
```

## Development Workflow

### 1. Visual Testing with Playwright
- Install browser first: Use `browser_install` from Playwright MCP
- Navigate to localhost:6006 for visual testing
- Take screenshots of component states

### 2. Design Extraction with Figma
- Use `get_design_context` from Figma MCP on current selection
- Extract design tokens and specifications
- Convert to React components

### 3. Theme Integration
- Access theme colors via Tailwind classes:
  - Background: `bg-background`, `bg-background-2`, etc.
  - Text: `text-color-1`, `text-color-2`, etc.
- Colors defined in `utils/theme/themes.tsx`
- Use brightness filters for hover states when exact colors aren't in theme: `hover:brightness-90`

### 4. Component Best Practices
- Mock data should use 'id' field for routing (e.g., `/#/<id>/dashboard` pattern)
- Extract SVG icons as React components in separate `Icons.tsx` file
- Component files in `/components/` subfolder
- Story files in `/stories/` subfolder with `.stories.tsx` extension

## Key Files
- `app/.storybook/main.js` - Storybook configuration
- `app/.storybook/preview.tsx` - Global decorators and parameters
- `app/components/TopNav/` - Example component structure

## Related Patterns
- See patterns/figma_to_react_conversion.md for design-to-code patterns