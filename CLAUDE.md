# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development Workflow
```bash
npm run dev              # Start development server on localhost:3000
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint
```

### Database Operations
```bash
npm run db:generate      # Generate Prisma Client after schema changes
npm run db:push          # Push schema changes to database (dev only)
npm run db:migrate       # Create and apply migrations (production-safe)
npm run db:studio        # Open Prisma Studio GUI
```

**Important**: Always run `npm run db:generate` after modifying `prisma/schema.prisma` before using the Prisma Client in code.

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router (React Server Components)
- **Styling**: Tailwind CSS with custom utility functions
- **Database**: PostgreSQL (Neon Serverless) via Prisma ORM
- **Language**: TypeScript (strict mode enabled)
- **Authentication**: Cookie-based sessions (no external libraries)

**Database Documentation**: See `DATABASE.md` for complete database schema, query examples, and maintenance procedures.

### Authentication System

**Session Management**: Cookie-based sessions using Next.js cookies API
- Session data stored in HttpOnly cookies
- 7-day expiration
- No external auth libraries (NextAuth, etc.)

**User Roles**:
- `0` = Administrator (full access)
- `2` = Standard User (limited access)

**Auth Functions** (`src/lib/auth.ts`):
- `getSession()`: Get current user session
- `requireAuth()`: Protect routes (any authenticated user)
- `requireRole([roles])`: Protect routes by role
- `createSession(user)`: Create session cookie
- `deleteSession()`: Remove session cookie

**Server Actions** (`src/app/actions/auth.ts`):
- `login(formData)`: Authenticate user and create session
- `logout()`: End session and redirect to login

**Protected Routes**: Use `requireAuth()` or `requireRole()` at the top of page components:
```typescript
export default async function MyPage() {
  await requireRole([0]); // Admin only
  // ... page code
}
```

### Data Model

**Current Schema** (users, customers, carnets):

```
User (N) ──→ (0..1) Customer
```

**User**: System users with authentication
- `usr_id`: Auto-increment primary key
- `usr_role`: 0 (admin) or 2 (user)
- `usr_cust_id`: Optional foreign key to customer
- **Password**: Plain text (⚠️ use bcrypt in production)

**Customer**: Clients
- `cust_id`: Auto-increment primary key
- Address information (name, address, city, state, country)

**Carnet**: Service packages
- `carn_id`: Auto-increment primary key
- `carn_um`: Unit of measure (G=Days, H=Hours, T=Tickets)
- `carn_price`: Decimal price

**Note**: Tickets table/model not yet implemented, awaiting specifications.

### Application Structure

**Route Organization**:
- `/login` - Login page (public)
- `/` - Home (redirects to appropriate dashboard)
- `/dashboard/admin/*` - Admin-only routes (usr_role = 0)
- `/dashboard/user/*` - User routes (usr_role = 2)

**Admin Dashboard Sections**:
- `/dashboard/admin/users` - User management
- `/dashboard/admin/customers` - Customer management
- `/dashboard/admin/carnets` - Carnet management
- `/dashboard/admin/tickets` - Ticket management (placeholder)

**User Dashboard Sections**:
- `/dashboard/user/tickets` - View own tickets (placeholder)
- `/dashboard/user/tickets/new` - Create new ticket (placeholder)

### Key Files and Conventions

**Authentication**:
- `src/lib/auth.ts` - Auth utilities and session management
- `src/app/actions/auth.ts` - Server Actions for login/logout
- All auth uses Next.js native `cookies()` API

**Database**:
- `prisma/schema.prisma` - Database schema with users, customers, carnets
- `src/lib/prisma.ts` - Singleton Prisma Client

**Components**:
- `src/components/dashboard-layout.tsx` - Dashboard wrapper with header and logout

**Utilities**: `src/lib/utils.ts` - Contains `cn()` for className merging and date formatting

### Development Patterns

**Server Components by Default**: All pages are React Server Components that can directly:
- Query database with Prisma
- Call auth functions
- Access cookies

**Server Actions**: For mutations (login, logout, forms):
- Mark with `'use server'` directive
- Place in `src/app/actions/` directory
- Use `formData` for form handling

**Role-Based Access**:
```typescript
// Any authenticated user
await requireAuth();

// Specific roles only
await requireRole([0]); // Admin only
await requireRole([2]); // Users only
await requireRole([0, 2]); // Both
```

**Redirects**: Use Next.js `redirect()` from `next/navigation` in Server Components/Actions

### Environment Variables

Required in `.env`:
- `DATABASE_URL`: PostgreSQL connection string (Neon serverless database)

The project uses a **Neon PostgreSQL** serverless database with SSL requirement. Connection details are in `.env` (never commit this file). The database uses connection pooling automatically.

### Security Notes

⚠️ **Current Implementation**:
- Passwords stored in **plain text** (development only)
- Sessions in HttpOnly cookies
- No CSRF protection

**For Production**:
- Hash passwords with bcrypt/argon2
- Add CSRF tokens
- Consider rate limiting on login
- Add session refresh mechanism

### UI Patterns

**Tables**: Standard Tailwind table styling with hover effects
**Forms**: Server Actions with formData
**Styling**: Use `cn()` from `@/lib/utils` for conditional classes
**Icons**: lucide-react for all icons

## Development Notes

**Adding Protected Pages**:
1. Create page in appropriate dashboard directory
2. Add `requireRole()` or `requireAuth()` at top
3. Wrap in `<DashboardLayout>`

**Adding New Database Models**:
1. Update `prisma/schema.prisma`
2. Run `npm run db:generate`
3. Run `npm run db:push` (dev) or `npm run db:migrate` (production)

**Test Credentials**:
- Admin: guidetti@softintime.com / Guido2025!
- User: esempio@softintime.com / Esempio2025!

**Tickets Feature**: Awaiting specifications. Placeholder pages exist at:
- `/dashboard/admin/tickets`
- `/dashboard/user/tickets`
- `/dashboard/user/tickets/new`
