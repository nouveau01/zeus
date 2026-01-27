# Filter Implementation Status

> Last Updated: 2026-01-27

## Overview

This document tracks the implementation status of FilterDialog across all modules, including what has been verified vs what needs verification against Total Service.

---

## Modules Completed

### Job Maintenance ✅
- **Status:** DONE
- **Filter Fields:** Verified from Total Service screenshots
- **F3 Lookups:** Using job_types table (verified)
- **Filter Logic:** Working and tested
- **Notes:** Template for other modules

### Job Results ✅
- **Status:** DONE
- **Filter Fields:** Same as Job Maintenance
- **F3 Lookups:** Same as Job Maintenance
- **Filter Logic:** Working and tested
- **Notes:** Shares job_types with Job Maintenance

### Customers ✅
- **Status:** DONE - UI Complete, some lookups need verification
- **Filter Fields:** Verified from Total Service screenshot
  - # Accounts, # Units, Address, Balance, Billing Type*, City, Contact, Custom1, Custom2, Date Created, Email Address, Fax, Last Modified, Name, Phone, Portal User*, State*, Status*, Type, Zip
- **F3 Lookups:**
  | Field | Status | Notes |
  |-------|--------|-------|
  | Billing Type* | ⚠️ GUESSED | Values: Consolidated, Detailed, Detailed Group, Detailed Sub - need to verify against Total Service |
  | Portal User* | ⚠️ GUESSED | Currently Yes/No based on portalAccess boolean - may not match Total Service |
  | State* | ✅ VERIFIED | Standard US state codes |
  | Status* | ⚠️ GUESSED | Active/Inactive - need to verify exact values in Total Service |
- **Data Mapping Issues Fixed:**
  - `billing` field was string, now Int (0-3)
  - Added `custom1`, `custom2`, `portalAccess` to interface
- **Notes:** Filter logic working, F3 lookups may need adjustment after schema review

### Accounts ✅
- **Status:** DONE - UI Complete, lookups NOT verified
- **Filter Fields:** Verified from Total Service screenshot (46 fields)
  - # Units, Acct Rep, Address, Balance, City, COLLECTOR, Credit Hold, Custom 12-14, CustomContact*, Customer Type, Date Created, Date Modified, Dispatch Alert, DWS, Email, Email Invoice, Email Ticket, GROUPING, Grouping 2, ID*, Interest, On Maintenance, Owner*, Pre Test, Price Level, Print Invoice, Print Ticket, Proposal Rcvd, Resident Mech, ROUTE, Route*, Sales Tax Region*, State*, Status*, Supervisor, Tag*, Territory*, Type Categories, Type*, Use Tax*, ViolationUpdate, Write-Offs, Zip, Zone*
- **F3 Lookups:**
  | Field | Status | Notes |
  |-------|--------|-------|
  | CustomContact* | ❌ NOT VERIFIED | Pulls from Rol table via CustomContact.idRol - complex join needed |
  | ID* | ⚠️ GUESSED | Using Premises.locId |
  | Owner* | ⚠️ GUESSED | Using Customer.name |
  | Route* | ⚠️ GUESSED | Using distinct Premises.route values |
  | Sales Tax Region* | ⚠️ GUESSED | Using distinct Premises.sTax values |
  | State* | ✅ VERIFIED | Standard US state codes |
  | Status* | ⚠️ GUESSED | Active/Inactive |
  | Tag* | ⚠️ GUESSED | Using Premises.tag/name |
  | Territory* | ⚠️ GUESSED | Using distinct Premises.terr values |
  | Type* | ⚠️ GUESSED | Using distinct Premises.type values |
  | Use Tax* | ⚠️ GUESSED | Using distinct Premises.uTax values |
  | Zone* | ⚠️ GUESSED | Using distinct Premises.zone values |
- **Data Mapping:**
  - Many fields in filter don't exist in our Prisma schema yet
  - Using type assertion to handle unknown fields
  - Will need schema updates when Total Service tables are mapped
- **Notes:**
  - CustomContact is complex - needs Rol table join
  - Most lookups are pulling distinct values from our DB, may not match Total Service exactly
  - Legacy DB has inconsistent data (same field different formats in different tables)

---

## Modules Pending

### Vendors
- **Status:** NOT STARTED
- **Need:** Screenshot of filter fields from Total Service
- **Need:** F3 lookup values

### Units
- **Status:** NOT STARTED
- **Need:** Screenshot of filter fields from Total Service
- **Need:** F3 lookup values

### Invoices
- **Status:** NOT STARTED
- **Need:** Screenshot of filter fields from Total Service
- **Need:** F3 lookup values

---

## Shared Components

### FilterDialog Component ✅
- **Location:** `/src/components/FilterDialog.tsx`
- **Status:** DONE
- **Features:**
  - Reusable across all modules
  - F3 lookup support (fetches from `/api/lookups/[field]`)
  - Operators: =, contains, startsWith, endsWith, >, >=, <, <=, <>
  - Apply/Clear/Cancel buttons
- **Pending Features:**
  - Save button functionality (save filters for reuse)
  - Saved Filters list (left panel showing saved filters)

### Lookups API ✅
- **Location:** `/src/app/api/lookups/[field]/route.ts`
- **Status:** DONE but many lookups are GUESSED
- **Verified Lookups:**
  - `state` - US state codes ✅
  - `type` (job types) - from job_types table ✅
- **Guessed Lookups (need verification):**
  - `billingType` - hardcoded values
  - `customerStatus` - Active/Inactive
  - `accountStatus` - Active/Inactive
  - `portalUser` - Yes/No
  - `accountType`/`premisesType` - distinct from Premises
  - `customContact` - from Contact table (should be Rol table?)
  - `accountId` - from Premises.locId
  - `owner` - from Customer.name
  - `route` - distinct from Premises.route
  - `salesTaxRegion` - distinct from Premises.sTax
  - `tag` - from Premises.tag/name
  - `territory` - distinct from Premises.terr
  - `useTax` - distinct from Premises.uTax
  - `zone` - distinct from Premises.zone

---

## Known Issues

### 1. Rol Table Not in Schema
- Total Service uses `Rol` table as master for names/contacts
- Many lookups (CustomContact, Owner, etc.) join to Rol
- Our schema denormalizes Rol into Customer, Premises, Vendor
- **Impact:** F3 lookups may not show correct values
- **Solution:** Add Rol model or wait for data migration to normalize

### 2. Inconsistent Data in Legacy DB
- Same concept stored differently across tables
- Example: State might be "NY", "New York", or "N.Y." depending on table
- **Impact:** Lookups may show wrong values for some filters
- **Solution:** Normalize during data migration

### 3. Missing Fields in Prisma Schema
- Account filters reference fields not in our Premises model
- Examples: Acct Rep, COLLECTOR, Credit Hold, DWS, Supervisor, etc.
- **Impact:** These filters will always return empty
- **Solution:** Add fields to schema or map to existing fields

---

## Next Steps

1. [ ] Get Total Service schema for key tables (Rol, CustomContact, Loc, Owner)
2. [ ] Create proper mapping: TS Table.Field → Prisma Model.Field
3. [ ] Update lookups API with correct data sources
4. [ ] Add missing fields to Prisma schema
5. [ ] Implement Save filter functionality
6. [ ] Implement Saved Filters list panel
7. [ ] Add FilterDialog to Vendors, Units, Invoices modules

---

## Verification Checklist

When verifying against Total Service, check:

- [ ] Filter field names match exactly
- [ ] Filter field order matches
- [ ] F3 lookup shows same values as Total Service
- [ ] Filtering actually works (returns correct records)
- [ ] Operators behave the same way

---

## Files Modified

- `/src/components/FilterDialog.tsx` - Shared filter dialog component
- `/src/app/api/lookups/[field]/route.ts` - F3 lookup API
- `/src/app/job-maintenance/JobMaintenanceView.tsx` - Job Maintenance with filters
- `/src/app/job-results/JobResultsView.tsx` - Job Results with filters
- `/src/app/customers/page.tsx` - Customers with filters
- `/src/app/accounts/page.tsx` - Accounts with filters
