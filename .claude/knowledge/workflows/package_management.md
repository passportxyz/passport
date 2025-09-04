# Package Management Workflow

## Yarn Package Manager (Required)

This project uses **Yarn** as its package manager. **Do not use npm** - it will fail or cause issues.

### Common Commands

#### Installing Dependencies
```bash
yarn install          # Install all dependencies
yarn add [package]    # Add a new dependency
```

#### Building
```bash
yarn build           # Build all packages
yarn clean           # Clean build artifacts
```

#### Running Scripts
```bash
yarn [script-name]   # Run a script from package.json
yarn start           # Start development servers
yarn test            # Run tests
```

#### Workspace Commands
```bash
yarn workspace @gitcoin/passport-app [command]
yarn workspace @gitcoin/passport-iam [command]
yarn workspace @gitcoin/passport-embed [command]
```

## Monorepo Structure

The project uses Lerna with Yarn workspaces for monorepo management:
- Configuration: `lerna.json`
- Root package.json defines workspaces
- Each package has its own package.json with specific scripts

## Key Files
- `package.json` - Root configuration
- `lerna.json` - Lerna monorepo configuration
- `yarn.lock` - Dependency lock file (do not edit manually)