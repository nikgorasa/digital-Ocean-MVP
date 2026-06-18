# GoRASA — CockroachDB Architecture Reference

This repository contains architectural documentation and implementation examples for CockroachDB-powered GoRASA deployments.

## Related Projects

### CCKR (CockroachDB Key Recovery)

[Live Demo](https://cckr.vercel.app) | [GitHub](https://github.com/Gorasa-In-2026/CCKR)

CCKR is a scalable, multi-tenant application built with:
- **CockroachDB** - Distributed SQL database
- **Better Auth** - Modern authentication
- **Next.js** - React framework
- **Prisma** - TypeScript ORM

**Key Features:**
- Multi-tenant architecture with CockroachDB's isolation
- Role-based access control (ADMIN, SUPER_ADMIN, etc.)
- Travel booking system with real-time booking management
- Loyalty and rewards system
- Corporate pricing and packages
- Demo mode for testing

**Tech Stack:**
```
CockroachDB → Better Auth → Prisma → Next.js → Vercel
```

**Use Case:** Enterprise travel booking platform with CockroachDB for high availability and global distribution.

### CCKR2 (CockroachDB Enhanced)

[Live Demo](https://project-yidb6.vercel.app) | [GitHub](https://github.com/Gorasa-In-2026/CCKR2)

CCKR2 is an enhanced version with additional features:
- **CockroachDB** - Distributed SQL with powerful SQL features
- **Better Auth** - Advanced session management
- **Next.js 16** - Latest React framework
- **Prisma** - TypeScript ORM with CockroachDB integration

**New Features:**
- Advanced role-based permissions system
- Comprehensive audit logging
- Enhanced corporate travel management
- Real-time dashboard with analytics
- Improved demo/testing capabilities

**Tech Stack:**
```
CockroachDB (Enhanced) → Better Auth (Advanced) → Prisma → Next.js 16 → Vercel
```

**Use Case:** Advanced enterprise travel platform with CockroachDB's multi-region capabilities and complex permission models.

## Architecture Comparison

| Feature | CCKR | CCKR2 |
|---------|------|-------|
| **Database Version** | CockroachDB | CockroachDB (Enhanced) |
| **Auth** | Basic Better Auth | Advanced Better Auth with RBAC |
| **Features** | Core travel booking | Enterprise-grade with advanced features |
| **Deployment** | Vercel | Vercel |
| **Target** | SMB travel | Enterprise travel |

## Database Architecture

Both CCKR and CCKR2 use CockroachDB as their distributed SQL database:

### Schema Overview
- **32+ Tables** - Users, Bookings, Leads, Tickets, Packages, etc.
- **Multi-tenant Ready** - Separate schemas per tenant
- **Global Distribution** - Multi-region deployment
- **High Availability** - Zero downtime operations

### Key Tables
- `users` - User management with roles and permissions
- `bookings` - Travel booking records
- `leads` - Potential customer management
- `packages` - Travel packages with dynamic pricing
- `loyalty_points` - Customer loyalty tracking
- `corporate_rates` - Enterprise pricing rules

### Migration from Supabase
Initial migration from Supabase (isubgeemvhvhnhikxbjb) included:
- 7 users
- 17 bookings
- 15 leads
- 6 tickets
- 238 total rows

## Authentication & Authorization

Both projects use Better Auth with different configurations:

### CCKR Auth
- Email/password + Google OAuth
- Basic role-based access (ADMIN, CUSTOMER, etc.)
- Session management with cookies

### CCKR2 Auth (Enhanced)
- Advanced RBAC with granular permissions
- Multi-role hierarchy (SUPER_ADMIN, ADMIN, CUSTOMER_SUPPORT, etc.)
- Audit logging for all auth events
- Corporate customer management

## Deployment

Both projects are deployed on Vercel with CockroachDB:

### Database Configuration
- **CockroachDB Cluster:** `losing-cyclops-27787.j77.aws-ap-south-1.cockroachlabs.cloud`
- **Connection:** Managed CockroachDB for serverless workloads
- **Compliance:** Meets enterprise security requirements

### Deployment Process
1. Code changes → GitHub PR
2. Vercel CI/CD → Build and deploy
3. Database updates via Prisma migrations
4. Automatic scaling with Vercel

## Development Setup

### CCKR
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with CockroachDB credentials

# Generate Prisma client
npx prisma generate

# Run development server
npm run dev
```

### CCKR2
Similar setup with additional environment variables for enhanced features.

## Security

Both projects implement enterprise-grade security:
- **Secrets Management:** All credentials in `.env.local` (gitignored)
- **Database Security:** CockroachDB's built-in encryption and authentication
- **Auth Security:** Better Auth with session protection
- **Network Security:** HTTPS with Vercel's CDN

## Next Steps

### For CCKR Users
1. Configure CockroachDB connection in `.env.local`
2. Set up Better Auth Google OAuth credentials
3. Customize travel packages and pricing
4. Configure corporate customer rules

### For CCKR2 Users
1. Set up advanced RBAC rules
2. Configure audit logging endpoints
3. Customize enterprise features
4. Set up multi-region deployment

## Contact & Support

For questions about CockroachDB deployment in GoRASA:
- GitHub: [Gorasa-In-2026](https://github.com/Gorasa-In-2026)
- Live Demos: CCKR and CCKR2
- Documentation: This README

Both CCKR and CCKR2 are production-ready solutions for travel platforms using CockroachDB for scalability and reliability.
