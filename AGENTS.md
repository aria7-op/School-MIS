# AGENTS.md - Codebase Guidelines

## Build, Lint, and Test Commands

### School Backend (Express.js + Prisma)
- **Start dev**: `npm run dev` (nodemon)
- **Start prod**: `npm start` (node with 512MB heap)
- **Build**: `npm run build` (esbuild bundle to dist/)
- **Optimized start**: `npm run start:memory-optimized` (256MB heap)

## Architecture

**School Backend**: Express.js monolith with routes, services, models for students, attendance, grades, finance, notifications. Uses Prisma ORM and MySQL. Multi-tenant with school isolation.

**Directory Structure**:
- `/routes`: Express route handlers
- `/services`: Business logic
- `/models`: Data models
- `/middleware`: Auth, CSRF, rate-limiting, file security
- `/controllers`: Request handlers
- `/utils`: Helpers (encryption, validation, logging)
- `/config`: Configuration (uploads, logging)
- `/scripts`: Utilities and seed scripts

**Database**: MySQL with Prisma ORM. Includes audit logging, file uploads, CQRS patterns.

## Code Style & Conventions

- **Language**: JavaScript (ESM modules, `import/export`)
- **Types**: Zod schemas for validation
- **Naming**: camelCase functions/variables, PascalCase classes
- **Error handling**: Try-catch with Zod validation; HTTP errors with proper status codes
- **Formatting**: Prettier + ESLint; 2-space indentation
- **Middleware**: JWT auth, CORS, helmet, rate-limiting, CSRF protection, file security
- **Encryption**: CryptoJS for data encryption
- **Performance**: Memory limits (256-512MB), compression, Redis caching
- **API**: RESTful with Socket.io for real-time updates

## Notes
- Cursor rule: Complete all tasks without interruption (`.cursor/rules/break.mdc`)
- Uses bcryptjs for password hashing
- Supports file uploads with security scanning
- Multi-role access control (ABAC)
