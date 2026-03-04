# ZEUS Report Builder - AI Context & Memory

This file is read by the AI Report Builder to understand the business, database, and user preferences.
Edit this file to teach the AI new things or correct its behavior.

---

## Business Overview

ZEUS is the management system for Nouveau Elevator, a field service / elevator maintenance company.
The system manages customers, their premises (building locations with elevators), service tickets,
jobs, invoicing, payroll, inventory, and more.

**Key terminology:**
- "Accounts" or "Premises" = building locations we service (found under 1-AR > Accounts). NOT GL accounts.
- "Customers" or "Owners" = the companies/people who own the buildings we service
- "Units" or "Elevators" = individual elevator units at a premises
- "Tickets" = service calls / work orders dispatched to technicians
- "Mechanics" or "Crews" = our field technicians who do the work
- "Jobs" = larger projects (installs, modernizations) tracked for cost

---

## Database Schema

The database indicator (`DB_TYPE`) tells you which syntax to use. You will be told either "postgresql" or "sqlserver".

### PostgreSQL Tables (primary for dev/laptop)

#### `customers` (SQL Server: Owner + Rol)
- `id` (text PK, cuid), `name`, `address`, `city`, `state`, `zip_code`, `country`
- `contact`, `phone`, `fax`, `cellular`, `email`, `website`
- `remarks`, `sales_remarks`, `position`, `category`
- `status` (int), `locs` (int, premise count), `elevs` (int, unit count)
- `balance` (decimal), `type` (text, e.g. "General", "Commercial")
- `billing` (int), `internet` (int, portal access), `custom1`, `custom2`
- `is_active` (bool), `account_number`, `rol_id`
- `created_at`, `updated_at`

#### `premises` (SQL Server: Loc + Rol) — THIS IS WHAT USERS CALL "ACCOUNTS"
- `id` (text PK, cuid), `loc_id` (display ID like "195BROAD"), `tag`
- `name`, `address`, `city`, `state`, `zip_code`, `country`
- `contact`, `phone`, `fax`, `cellular`, `email`, `website`
- `elevs` (int, unit count), `status` (int), `balance` (decimal), `type` (text)
- `billing` (int), `route` (int), `zone` (int), `terr` (int, territory)
- `price_l` (int, price level), `maint` (int)
- `markup1`-`markup5` (float), `longitude`, `latitude`
- `remarks`, `col_remarks`, `sales_remarks`
- `custom1`-`custom15`
- `customer_id` (FK to customers.id)
- `is_active` (bool), `premises_id`, `created_at`, `updated_at`

#### `units` (SQL Server: Elev)
- `id` (text PK, cuid), `unit_number` (text, display number), `state` (text, state registration number)
- `building` (text), `category` (text), `unit_type` (text), `manufacturer` (text), `serial` (text), `description` (text)
- `status` (text, "Active"/"Inactive"), `price` (decimal)
- `install_date`, `since_date`, `last_date`
- `remarks` (text)
- `custom1`-`custom20`
- `premises_id` (FK to premises.id)
- `is_active` (bool), `created_at`, `updated_at`
- NOTE: The column is `unit_number` NOT `unit_name`. The type column is `unit_type` NOT `type`. There is NO `car` column.

#### `tickets` (SQL Server: TicketO for open, TicketD for completed)
- `id` (text PK, cuid), `ticket_number` (int, unique — the display ticket number)
- `work_order_number` (int, nullable)
- `date` (timestamp, creation date), `scheduled_date` (timestamp, dispatch date), `completed_date` (timestamp, null if open)
- `scope_of_work` (text, description of work — old name: fDesc)
- `type` (text: "Service","Repair","Maintenance","PM","Violation","Other")
- `category` (text), `level` (text)
- `status` (text: "Open","Assigned","En Route","On Site","Completed")
- `account_id` (text, display account tag), `name_address` (text)
- `mech_crew` (text, mechanic/crew name)
- `called_in_by` (text), `taken_by` (text), `resolved_by` (text)
- `hours` (decimal), `overtime_hours` (decimal), `double_time_hours` (decimal), `travel_hours` (decimal), `total_hours` (decimal)
- `resolution` (text), `parts_used` (text), `description` (text)
- `bill` (bool), `reviewed` (bool), `pr` (bool), `vd` (bool), `inv` (bool)
- `internal_comments` (text), `email_status` (text)
- `customer_id` (FK to customers.id), `premises_id` (FK to premises.id), `unit_id` (FK to units.id), `job_id` (FK to jobs.id)
- `invoice_id` (FK to invoices.id, nullable)
- `created_at`, `updated_at`
- NOTE: There is NO `legacy_id` column. The ticket number column is `ticket_number`.

#### `invoices` (SQL Server: Invoice)
- `id` (text PK), `ref` (int, invoice reference number), `invoice_number` (int)
- `f_date` (invoice date), `i_date`, `date` (display date), `posting_date`
- `f_desc` (text description), `description`, `remarks`
- `amount` (decimal, subtotal), `s_tax` (decimal, sales tax), `total` (decimal)
- `taxable` (decimal), `tax_region`, `tax_rate`
- `type` (text), `terms` (text), `status` (text), `status_display`
- `po`, `po_number`, `batch`
- `remaining_unpaid` (decimal)
- `premises_id` (FK), `job_id` (FK)
- `created_at`, `updated_at`

#### `jobs` (SQL Server: Job)
- `id` (text PK), `external_id` (int, legacy Job.ID)
- `job_name` (description), `job_description` (remarks)
- `status` (text: "Open","Closed"), `type` (text)
- `po`, `date`, `close_date`, `est_date`, `due_date`
- `rev` (revenue), `mat` (materials), `labor`, `cost`, `profit`, `ratio`
- `b_rev`, `b_mat`, `b_labor`, `b_cost`, `b_profit` (budget values)
- `reg`, `ot`, `dt`, `tt`, `nt`, `hour`, `b_hour` (hours)
- `bill_rate`, `markup`
- `custom1`-`custom20`
- `customer_id` (FK), `premises_id` (FK), `unit_id` (FK)
- `created_at`, `updated_at`

#### `employees` (SQL Server: Emp)
- `id` (text PK, cuid), `name` (full name LAST, FIRST), `f_first` (first name), `last` (last name)
- `title`, `status` (int, 1=active), `field` (int, field employee flag)
- `sales` (int, sales flag), `pager` (email), `rol` (int)
- `d_hired`, `d_fired`, `d_birth`, `d_review`, `d_last`, `state`, `level`
- `salary` (decimal), `pay_period`, `ref`
- `in_use` (int), `cat_sign`, `f_status`, `f_allow`
- `created_at`, `updated_at`

#### `job_types`
- `id` (text PK, cuid), `legacy_id` (int), `name` (text), `description` (text)
- `count` (int), `color` (text), `remarks` (text), `sort_order` (int)
- `is_active` (bool), `created_at`, `updated_at`

#### `chart_accounts` (GL Chart of Accounts)
- `id` (text PK, cuid), `legacy_id` (int), `acct` (int, account number), `f_desc` (text, description)
- `name` (text), `account_number` (int)
- `type` (text: "Asset","Liability","Equity","Revenue","Expense"), `cat` (text, category)
- `bal` (decimal, balance), `status` (int), `budget` (decimal), `budget_m` (decimal)
- `bank` (int), `bank_type` (int), `report_o` (int), `in_use` (int)
- `is_active` (bool), `created_at`, `updated_at`
- NOTE: The description column is `f_desc` and the name column is `name`. Balance is `bal` NOT `balance`.

---

### SQL Server Tables (production, at the office)

#### Owner (Customers) + Rol (Contact Info)
- Owner PK: `ID` (int), Rol PK: `ID` (int)
- Join: `Owner o LEFT JOIN Rol r ON o.Rol = r.ID` → `r.Name`, `r.Address`, etc.
- Owner: `Status`, `Locs`, `Elevs`, `Balance`, `Type`, `Billing`, `Custom1`, `Custom2`

#### Loc (Premises/Accounts) + Rol
- PK: `Loc` (int), Join: `Loc l LEFT JOIN Rol r ON l.Rol = r.ID`
- `Owner` (FK), `ID` (display), `Tag`, `Elevs`, `Status`, `Balance`, `Type`
- `Route`, `Zone`, `Terr`, `Custom1`-`Custom15`

#### Elev (Units)
- PK: `ID` (int), `Unit`, `Loc` (FK), `Cat`, `Type`, `Manuf`, `Serial`, `Status`, `Price`

#### TicketO (Open), TicketD (Completed)
- PK: `ID` (int), `CDate`, `DDate`, `EDate`
- Open: `LID` (FK to Loc), `LElev` (FK to Elev), `fWork`/`DWork` (mechanic)
- Completed: `Loc` (FK), `Elev` (FK), `fWork`
- `Type` (0-5 int), `fDesc`, `Who`, `fBy`, hours fields

#### Invoice
- PK: `Ref` (int), `fDate`, `fDesc`, `Amount`, `STax`, `Total`, `Loc`, `Job`, `Paid`

#### Job
- PK: `ID` (int), `fDesc`, `Type`, `Loc`, `Owner`, `Elev`, `Status` (0=Open, 1=Closed)
- Financials: `Rev`, `Mat`, `Labor`, `Cost`, `Profit`, budget: `BRev`, `BMat`, `BLabor`, `BCost`

#### tblWork (Mechanics/Crews)
- PK: `ID` (int), `fDesc` (name), `Status`, `DBoard`, `EN`

---

## Query Rules

### PostgreSQL Rules (when DB_TYPE = postgresql)
1. Use `LIMIT` not `TOP`
2. Use `COALESCE(field, 0)` not `ISNULL`
3. Use `TO_CHAR(date, 'MM/DD/YYYY')` not `FORMAT`
4. Column names are snake_case (e.g. `zip_code`, `customer_id`, `f_desc`)
5. Table names are lowercase plural (e.g. `premises`, `customers`, `tickets`, `jobs`)
6. String comparisons are case-sensitive - use `ILIKE` for case-insensitive
7. Boolean fields use `true`/`false`
8. For "accounts" queries, use the `premises` table (join `customers` via `customer_id`)
9. Cast decimals: `CAST(field AS NUMERIC)` or `field::numeric`

### SQL Server Rules (when DB_TYPE = sqlserver)
1. Use `TOP N` not `LIMIT`
2. Use `ISNULL(field, 0)` not `COALESCE`
3. Customer name requires JOIN: `Owner o LEFT JOIN Rol r ON o.Rol = r.ID` → `r.Name`
4. Premises name requires JOIN: `Loc l LEFT JOIN Rol r ON l.Rol = r.ID` → `r.Name`
5. Mechanic name: join `tblWork` on ID, use `fDesc`
6. Use `FORMAT(date, 'MM/dd/yyyy')` for dates

### Shared Rules
1. Always use LEFT JOINs (data may not always have matching records)
2. Always alias columns clearly for display
3. Completed tickets filter by `completed_date`, open tickets by `date` (creation date). There is NO `e_date`/`c_date`/`d_date` column — those are the SQL Server names.
4. Prefix all column references with table aliases when joining
5. Remember: "accounts" means premises/locations, NOT GL accounts
6. Default to LIMIT/TOP 500 unless user specifies otherwise
7. CRITICAL: Only use column names listed in the PostgreSQL schema above. Do NOT invent columns. If unsure, use a simpler query.

---

## COMMON COLUMN NAME MISTAKES — DO NOT MAKE THESE

| WRONG (does not exist) | CORRECT column name | Table |
|------------------------|---------------------|-------|
| `legacy_id` | `ticket_number` | tickets |
| `f_desc` | `scope_of_work` | tickets |
| `mechanic` | `mech_crew` | tickets |
| `who` | `called_in_by` | tickets |
| `f_by` | `taken_by` | tickets |
| `r_by` | `resolved_by` | tickets |
| `c_date` | `date` | tickets |
| `d_date` | `scheduled_date` | tickets |
| `e_date` | `completed_date` | tickets |
| `total` (for hours) | `total_hours` | tickets |
| `reg` (for hours) | `hours` | tickets |
| `ot` | `overtime_hours` | tickets |
| `dt` | `double_time_hours` | tickets |
| `tt` | `travel_hours` | tickets |
| `unit_name` | `unit_number` | units |
| `car` | (does not exist) | units |
| `type` (for unit type) | `unit_type` | units |
| `category` (for unit) | `category` | units |
| `balance` | `bal` | chart_accounts |
| `sub_type` | `cat` | chart_accounts |

---

## Learned Preferences

<!-- Preferences learned from user interactions will be added below -->
- [2/25/2026] User liked report: "make me a report of all of our accounts that have over a 50k due balance" → "Accounts with Balance Over $50,000"
<!-- Format: - [date] preference description -->

---

## Report Corrections

<!-- When users report incorrect data or terminology, add corrections here -->
<!-- Format: - [date] "user said X" → correction: Y -->
