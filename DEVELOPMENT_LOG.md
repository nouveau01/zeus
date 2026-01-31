# Z.E.U.S. Development Log

## Project Overview
Z.E.U.S. (Field Service Management) is a Next.js application that replicates and modernizes "Total Service" - a legacy Windows elevator service management application.

---

## 2026-01-31: Data Layer Architecture Implementation

### Goal
Replace all direct API endpoint fetches (`/api/sqlserver/*`) with Server Actions that:
1. Fetch data from SQL Server (Total Service legacy database)
2. Automatically mirror/cache data to PostgreSQL (ZEUS database)
3. Fall back to PostgreSQL when SQL Server is unavailable
4. Eventually phase out SQL Server dependency

### Architecture Pattern
```
Component → Server Action → Data Layer → SQL Server
                                      ↓
                              PostgreSQL (mirror)
```

### Files Created

#### Data Layer (`/src/lib/data/`)
| File | Purpose |
|------|---------|
| `tickets.ts` | Fetch tickets from TicketO/TicketD tables, mirror to PostgreSQL |
| `customers.ts` | Fetch customers from Owner/Rol tables, mirror to PostgreSQL |
| `accounts.ts` | Fetch accounts/premises from Loc/Rol tables, mirror to PostgreSQL |
| `units.ts` | Fetch units from Elev table, mirror to PostgreSQL |
| `jobs.ts` | Fetch jobs from Job/JobType tables, mirror to PostgreSQL |
| `job-templates.ts` | Fetch job templates and job types |
| `invoices.ts` | Fetch invoices for ledger display |

#### Server Actions (`/src/lib/actions/`)
| File | Exported Functions |
|------|-------------------|
| `tickets.ts` | `getTickets()`, `getTicketById()`, `getCallHistory()` |
| `customers.ts` | `getCustomers()`, `getCustomerById()` |
| `accounts.ts` | `getAccounts()`, `getAccountById()` |
| `units.ts` | `getUnits()`, `getUnitById()` |
| `jobs.ts` | `getJobs()`, `getJobById()` |
| `job-templates.ts` | `getJobTemplates()`, `getJobTypes()` |
| `invoices.ts` | `getInvoices()` |

### Pages Updated

| Page | Changes |
|------|---------|
| `/dispatch/page.tsx` | Uses `getTickets()`, `getCallHistory()`, `getInvoices()` |
| `/customers/page.tsx` | Uses `getCustomers()` |
| `/customers/[id]/CustomerDetail.tsx` | Uses `getCustomerById()` |
| `/accounts/page.tsx` | Uses `getAccounts()` |
| `/accounts/[id]/AccountDetail.tsx` | Uses `getAccountById()` |
| `/units/page.tsx` | Uses `getUnits()` |
| `/units/[id]/UnitDetail.tsx` | Uses `getUnitById()` |
| `/job-maintenance/JobMaintenanceView.tsx` | Uses `getJobs()` |
| `/job-maintenance/[id]/JobDetail.tsx` | Uses `getJobById()` |
| `/jobs/[id]/page.tsx` | Uses `getJobById()` |
| `/job-results/JobResultsView.tsx` | Uses `getJobs()` |
| `/job-results/[id]/JobResultDetail.tsx` | Uses `getJobById()` |
| `/completed-tickets/CompletedTicketsView.tsx` | Uses `getTickets()` |
| `/completed-tickets/[id]/CompletedTicketDetail.tsx` | Uses `getTicketById()` |
| `/job-templates/page.tsx` | Uses `getJobTemplates()`, `getJobTypes()` |
| `/job-types/page.tsx` | Uses `getJobTypes()` |

### Benefits of Server Actions over API Routes
- No network round-trip (runs on server during same request)
- No CORS/fetch configuration issues
- Better type safety
- Simpler error handling
- No separate API route files to maintain

### Current State
- All SQL Server read operations go through Server Actions
- Write operations (POST/PUT/DELETE) still use API routes to PostgreSQL (this is correct)
- Data automatically mirrors to PostgreSQL when fetched from SQL Server
- Falls back to PostgreSQL if SQL Server connection fails

### Git Commits
```
5333f68 Replace all SQL Server API fetches with Server Actions
aa32e1c Update detail pages and data layer fetch by ID functions
2dd40ea Continue refactoring pages to use data layer
3a22763 Add data layer with SQL Server mirroring to PostgreSQL
```

---

## Previous Work (Before 2026-01-31)

### Dispatch Screen Fix
- Fixed hardcoded date filter that was stuck on "1/22/2026"
- Implemented date mode buttons (Day, Week, Month, Quarter, Year, All)
- Default is now "All" mode showing all tickets

### SQL Server Integration
- Set up Prisma client for SQL Server connection (`/src/lib/sqlserver.ts`)
- Created API endpoints for direct SQL Server queries
- Mapped Total Service table structures to ZEUS data models

### UI/Design
- Replicated Total Service Windows XP-style interface
- Implemented tabbed navigation system
- Created detail views for all major entities

---

## Database Schema Mapping

### Total Service (SQL Server) → ZEUS (PostgreSQL)
| SQL Server Table | PostgreSQL Model | Notes |
|-----------------|------------------|-------|
| Owner | Customer | Customer/owner records |
| Loc | Premises | Account/location records |
| Elev | Unit | Elevator unit records |
| Job | Job | Job/work order records |
| JobType | JobType | Job type classifications |
| JobTemp | JobTemplate | Job templates |
| TicketO | Ticket | Open tickets |
| TicketD | Ticket | Completed tickets |
| InvO | Invoice | Invoice records |
| Rol | (mapped to types) | Role/type lookups |

---

## Next Steps / Future Work
- [ ] Add mirroring for write operations (create/update records in both databases)
- [ ] Implement full sync for historical data migration
- [ ] Add real-time sync status indicator in UI
- [ ] Complete phase-out plan for SQL Server dependency
