# CLAUDE.md - Agent Guidelines

## Commands
- **Build/Deploy**: `wrangler deploy` (production) or `wrangler dev` (development)
- **Dev**: `npm run dev` or `npm start`
- **Test**: `npm test` or `vitest`
- **Single Test**: `vitest run path/to/test.spec.ts`
- **Watch Tests**: `vitest watch`
- **Type Generation**: `npm run cf-typegen`
- **Lint**: Not configured yet, consider adding ESLint

## Code Style
- **TypeScript**: Strict mode enabled, target ES2021
- **Imports**: Use ES modules (import/export)
- **Formatting**: Use tabs, printWidth 140, semi: true (see .prettierrc)
- **Types**: Define explicit return types for functions; use interfaces for complex types
- **Naming**: camelCase for variables/functions, PascalCase for classes/interfaces
- **Error Handling**: Use try/catch with proper error typing; use Error instances with messages
- **JSX**: React-JSX syntax is enabled
- **SQL**: Use SQL template literals for database operations
- **Comments**: Document complex logic, public APIs, and non-obvious decisions

## Project Structure
- `/src` - Source code (Cloudflare Workers with Hono framework)
- `/test` - Test files (using Vitest)
- `/public` - Static assets served by the worker
- Cloudflare Workers project with Durable Objects for state persistence