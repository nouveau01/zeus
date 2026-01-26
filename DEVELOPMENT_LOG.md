# ZEUS Field Service Management - Development Log

This log tracks all development changes, sessions, and modifications made to the ZEUS FSM system.

---

## Session: January 21, 2026

### Overview
Continued development of ZEUS FSM, replicating the "Total Service" legacy Windows application. Focus on filtered navigation from Account detail and building the Job Results module.

---

### 10:00 AM - Filtered Navigation from Account Detail

**Task:** Implement filtered views when clicking links from Account detail screen

**Changes Made:**

1. **Jobs Link** (`/job-maintenance?premisesId=xxx`)
   - Updated `AccountDetail.tsx` - Added onClick handler for Jobs link to open filtered view
   - Updated `TabContent.tsx` - Added routing for `/job-maintenance?premisesId=xxx`
   - Updated `JobMaintenancePage` - Added `premisesId` prop
   - Updated `/api/jobs/route.ts` - Added premisesId filtering to query

2. **Invoices Link** (`/invoices?premisesId=xxx`)
   - Updated `AccountDetail.tsx` - Added onClick handler for Invoices link
   - Updated `TabContent.tsx` - Added routing for `/invoices?premisesId=xxx`
   - Updated `InvoicesPage` - Added `premisesId` prop
   - Updated `/api/invoices/route.ts` - Added premisesId filtering

3. **Completed Tickets Link** (`/completed-tickets?premisesId=xxx`)
   - Updated `AccountDetail.tsx` - Added onClick handler for Completed Tickets link
   - Updated `TabContent.tsx` - Added routing for `/completed-tickets?premisesId=xxx`
   - Updated `CompletedTicketsPage` - Added `premisesId` prop
   - Updated `/api/tickets/route.ts` - Added premisesId filtering

4. **Job Results Link** (`/job-results?premisesId=xxx`)
   - Updated `AccountDetail.tsx` - Added onClick handler for Job Results link
   - Updated `TabContent.tsx` - Added routing for `/job-results?premisesId=xxx`

**Files Modified:**
- `src/app/accounts/[id]/AccountDetail.tsx`
- `src/components/TabContent.tsx`
- `src/app/job-maintenance/page.tsx`
- `src/app/invoices/page.tsx`
- `src/app/completed-tickets/page.tsx`
- `src/app/api/jobs/route.ts`
- `src/app/api/invoices/route.ts`
- `src/app/api/tickets/route.ts`

**Commits:**
- `0177735` - Add filtered Job Maintenance view from Account detail
- `bc5f5aa` - Add filtered Invoices view from Account detail
- `0994d98` - Add filtered Completed Tickets view from Account detail

---

### 11:30 AM - Job Results List Page

**Task:** Create Job Results page from Job Cost module in Total Service

**Features Implemented:**
- Range dropdown (Cumulative, This Month, Last Month, etc.)
- Financial columns: Revenue Billed, Materials, Labor, Committed, Total Cost, Profit, Ratio, Budget, To Be Billed, Billed %
- Profit column with red text for negative values (parentheses format)
- Totals button in toolbar that highlights yellow when active
- Totals row at bottom of table showing sum of all columns
- Job count displayed in status bar
- Double-click to open Job Result Detail

**Files Created:**
- `src/app/job-results/page.tsx`

**Commit:**
- `566ca89` - Add Job Results page with financial columns and totals

---

### 12:30 PM - Job Results Detail Screen

**Task:** Create separate detail screen for Job Results (different from Job Maintenance detail)

**Key Difference:** Clicking a job from Job Results opens a DIFFERENT detail screen than Job Maintenance. The Job Results detail has financial/costing focus.

**Header Section:**
- Job #, Type, Account (clickable link), Desc, Tag, Customer, Status, Unit
- "Job Maint" link in top right to open the same job in Job Maintenance detail

**Files Created:**
- `src/app/job-results/[id]/JobResultDetail.tsx`

**Commit:**
- `dd3dfec` - Add Job Result Detail screen separate from Job Maintenance

---

### 1:00 PM - Tab 1: Summary & Hours Worked

**Features:**
- Hours section (left side): Regular, Overtime, 1.7 Time, DoubleTime, Travel, Total, Budgeted, Difference
- Financial summary table (right side): Columns for Desc, Revenues, Costs, Profits, Percent
  - Rows: Actual, Committed, Total, Budget, Difference, % Over/Under
  - Red text for negative profit values
- Hourly Yield fieldset: Average Income/Cost/Profit per hour

---

### 1:30 PM - Tab 2: Job Costing Detail

**Features:**
- "Show Expense Details" checkbox in top right
- Table with columns: Description, Code, Actual, Committed, Total, Budget, Difference, Ratio
- Sections: REVENUES, JOB COSTS (Labor, Materials), TOTAL COST, NET PROFIT
- Red text for negative values in Difference and Ratio columns

---

### 2:00 PM - Tab 3: Job Costing Items

**Features:**
- Filter row with Item Scope dropdown (All, Labor, Materials, Other)
- Type dropdown (Actual, Committed, Budget)
- Table with columns: Date, Source, Ref, Desc, Revenues, Expenses, Phase
- Sample data rows showing Ticket and AP Item entries

---

### 2:30 PM - Tab 4: Custom/Remarks

**Features:**
- 4-column grid of custom fields:
  - Column 1: Supervisor, City #, Rep Reques, MR Reques, Req Date
  - Column 2: Date, W/F/Misu, Guzman, Status, Comp. Date
  - Column 3: Schedule, Billing Terms, Material, Paperless, Fldr Loc
  - Column 4: Due Date, Fine Fault, Job Type, Priority Level, Project Mgr, PO #
- Large remarks text area at bottom for job notes

**File Modified:**
- `src/app/job-results/[id]/JobResultDetail.tsx`

---

### 3:00 PM - Final Commit for Session

**Status:** All 4 tabs complete for Job Result Detail screen

**Pending Items for Future Sessions:**
- Open Tickets link from Account detail (user said to come back to later)
- Connect Job Result Detail fields to actual database data
- Add edit functionality to Job Result Detail fields

---

## Technical Notes

### Server Issues & Fixes
During this session, the sidebar occasionally stopped responding to clicks. Fixed by:
```bash
lsof -ti:3000,3001 | xargs kill -9 2>/dev/null
rm -rf .next
npm run dev
```

### Code Pattern for Filtered Views
When implementing filtered navigation from parent to child records:
1. Parent component: Pass query parameter in onClick handler
2. TabContent: Parse query parameter from route and pass as prop
3. Page component: Accept prop and pass to API call
4. API route: Add where clause filter for the parameter

### Styling Guidelines (Total Service Replication)
- White form backgrounds with gray (#f5f5f5) container backgrounds
- Yellow (#ffffcc) header sections
- 12px font size for form fields
- Blue (#0066cc) for clickable links
- Red text for negative financial values
- Parentheses format for negative currency: ($123.45)

---

## Commit History (This Session)

| Commit | Description |
|--------|-------------|
| `dd3dfec` | Add Job Result Detail screen separate from Job Maintenance |
| `566ca89` | Add Job Results page with financial columns and totals |
| `0994d98` | Add filtered Completed Tickets view from Account detail |
| `bc5f5aa` | Add filtered Invoices view from Account detail |
| `0177735` | Add filtered Job Maintenance view from Account detail |

---

## End of Session: January 21, 2026

---

## Session: January 26, 2026

### Overview
Comprehensive CRUD functionality implementation across all detail pages and connecting list pages to real APIs. All backend API routes verified and tested.

---

### CRUD Implementation - API Routes Created

**New API Routes:**

1. **Contacts API** (`/api/contacts`)
   - `GET /api/contacts?customerId=xxx` - List contacts for a customer
   - `POST /api/contacts` - Create new contact
   - `GET /api/contacts/[id]` - Get single contact
   - `PUT /api/contacts/[id]` - Update contact
   - `DELETE /api/contacts/[id]` - Delete contact

2. **Vendors API** (`/api/vendors`)
   - `GET /api/vendors` - List all vendors with search/filter
   - `POST /api/vendors` - Create new vendor
   - `GET /api/vendors/[id]` - Get single vendor
   - `PUT /api/vendors/[id]` - Update vendor
   - `DELETE /api/vendors/[id]` - Delete vendor

3. **Purchase Orders API** (`/api/purchase-orders`)
   - `GET /api/purchase-orders` - List POs with filtering
   - `POST /api/purchase-orders` - Create new PO (auto-increment PO number)
   - `GET /api/purchase-orders/[id]` - Get single PO
   - `PUT /api/purchase-orders/[id]` - Update PO
   - `DELETE /api/purchase-orders/[id]` - Delete PO

4. **Units API** (`/api/units`)
   - `GET /api/units?premisesId=xxx` - List units (optionally by premises)
   - `POST /api/units` - Create new unit (requires premisesId)
   - `GET /api/units/[id]` - Get single unit
   - `PUT /api/units/[id]` - Update unit
   - `DELETE /api/units/[id]` - Delete unit

---

### CRUD Implementation - Bug Fixes

**Invoice API Field Mapping Fixes:**
- Fixed `priceLevel` → `pricing` (Prisma schema field)
- Fixed `date` → `fDate` and `postingDate` → `iDate`
- Fixed `description` → `fDesc`
- Fixed `poNumber` → `po`
- Added proper response mapping to frontend-friendly names

**AccountDetail.tsx Fix:**
- Fixed `setHasChanges(true)` → `markDirty()` in PM Contract handlers
- The component uses `useUnsavedChanges` hook which provides `markDirty()` function

---

### CRUD Implementation - Detail Pages

1. **AccountDetail.tsx** - Contacts CRUD
   - Add Contact dialog with form fields
   - Edit Contact functionality
   - Delete Contact with confirmation
   - State management for contacts list

2. **AccountDetail.tsx** - PM Contracts CRUD
   - Add Contract dialog with form fields
   - Edit Contract functionality
   - Delete Contract with confirmation
   - State management for contracts list

3. **UnitDetail.tsx** - Tests CRUD
   - Edit Test button and functionality
   - Delete Test with confirmation
   - State management for tests list

4. **InvoiceDetail.tsx** - Line Items CRUD
   - Add Line Item dialog with form fields
   - Edit Line Item functionality
   - Delete Line Item with confirmation
   - Automatic subtotal/tax/total recalculation

---

### CRUD Implementation - List Pages Connected to APIs

1. **Units Page** (`/units`)
   - Changed from mock data to fetching from `/api/units`
   - Create unit calls POST API
   - Delete unit calls DELETE API

2. **Vendors Page** (`/vendors`)
   - Changed from mock data to fetching from `/api/vendors`
   - Create vendor calls POST API
   - Delete vendor calls DELETE API

3. **Invoices Page** (`/invoices`)
   - Wired up "New" button to navigate to `/invoices/new`
   - Wired up "Delete" button to call DELETE API

---

### Files Created

| File | Description |
|------|-------------|
| `src/app/api/contacts/route.ts` | Contacts list/create API |
| `src/app/api/contacts/[id]/route.ts` | Contacts GET/PUT/DELETE API |
| `src/app/api/vendors/route.ts` | Vendors list/create API |
| `src/app/api/vendors/[id]/route.ts` | Vendors GET/PUT/DELETE API |
| `src/app/api/purchase-orders/route.ts` | PO list/create API |
| `src/app/api/purchase-orders/[id]/route.ts` | PO GET/PUT/DELETE API |
| `src/app/api/units/route.ts` | Units list/create API |
| `src/app/api/units/[id]/route.ts` | Units GET/PUT/DELETE API |

---

### Files Modified

| File | Changes |
|------|---------|
| `src/app/accounts/[id]/AccountDetail.tsx` | +821 lines - Contacts & PM Contracts CRUD |
| `src/app/api/invoices/route.ts` | Fixed field mappings |
| `src/app/api/invoices/[id]/route.ts` | Fixed field mappings |
| `src/app/invoices/InvoicesView.tsx` | Wired New/Delete buttons |
| `src/app/invoices/[id]/InvoiceDetail.tsx` | +251 lines - Line Items CRUD |
| `src/app/units/[id]/UnitDetail.tsx` | +336 lines - Tests Edit/Delete |
| `src/app/units/page.tsx` | Connected to API |
| `src/app/vendors/[id]/VendorDetail.tsx` | Connected to API |
| `src/app/vendors/page.tsx` | Connected to API |

---

### Testing Performed

All CRUD operations verified via curl:

| Entity | GET | CREATE | UPDATE | DELETE |
|--------|-----|--------|--------|--------|
| Units | ✓ | ✓ (requires premisesId) | ✓ | ✓ |
| Vendors | ✓ | ✓ | ✓ | ✓ |
| Contacts | ✓ | ✓ | ✓ | ✓ |
| Invoices | ✓ | ✓ | ✓ | ✓ |
| Purchase Orders | ✓ | ✓ | ✓ | ✓ |

---

### Technical Notes

**Database:** PostgreSQL via Docker (`nouveau-postgres` container)
- Connection: `postgresql://postgres:nouveau123@localhost:5432/nouveau_elevator`
- NOT SQLite - using PostgreSQL for production-like environment

**Unit CREATE Constraint:**
- `premises_id` is NOT NULL in database
- Units must be created with a valid `premisesId` (belongs to an account)

**CSS Cache Issue:**
- Dev server CSS wasn't loading properly
- Fixed by clearing `.next` cache: `rm -rf .next && npm run dev`

---

### Commit

| Commit | Description |
|--------|-------------|
| `ea6174a` | Add CRUD functionality across all detail pages and connect list pages to APIs |

---

## End of Session: January 26, 2026
