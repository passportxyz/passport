# Figma to React Component Pattern

## Overview
Pattern for converting Figma designs to production React components using Figma MCP and theme integration.

## Conversion Process

### 1. Initial Code Generation
- Figma MCP generates raw code with inline styles and absolute image URLs
- Output includes static representations of all design states

### 2. Style Transformation
- **Convert inline styles** → Tailwind classes using theme tokens
  - Background colors → `bg-background`, `bg-background-2`, etc.
  - Text colors → `text-color-1`, `text-color-2`, etc.
- **Replace absolute URLs** → Relative paths or imported assets

### 3. Interactive State Handling
- **Remove static highlighted states** from Figma
- **Add proper hover states** using Tailwind modifiers
- Use `hover:brightness-90` for subtle variations not in theme palette
- Convert Figma's "active" states to interactive CSS states

### 4. Component Extraction
- **Icons**: Extract as separate React components in `Icons.tsx`
- **Repeated elements**: Create reusable sub-components
- **Complex layouts**: Break down into logical component hierarchy

### 5. Navigation Adaptation
- Convert static `href` attributes to id-based routing
- SPA pattern: `/#/<id>/dashboard`
- Pass ids through mock data for Storybook testing

### 6. Layout Optimization
- **Flexwrap** often better than grid for variable item counts (e.g., partner logos)
- Maintain responsive behavior from design
- Preserve spacing using theme spacing tokens

## Common Transformations

### Before (Figma Generated)
```jsx
<div style={{ backgroundColor: '#F5F5F5', color: '#FFFFFF' }}>
  <a href="/dashboard" style={{ backgroundColor: '#4A47D3' }}>
    <img src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/icon.png" />
  </a>
</div>
```

### After (Production Ready)
```jsx
<div className="bg-background text-color-1">
  <a href={`/#/${item.id}/dashboard`} className="bg-background-3 hover:brightness-90">
    <IconComponent />
  </a>
</div>
```

## Key Principles
1. Always use theme tokens over hardcoded colors
2. Interactive states > static representations
3. Component composition > monolithic components
4. Theme consistency > pixel-perfect color matching

## Related Files
- `app/components/TopNav/components/FeatureCard.tsx` - Example implementation
- `app/utils/theme/themes.tsx` - Theme color definitions

## Related Workflows
- See workflows/storybook_component_development.md for development workflow