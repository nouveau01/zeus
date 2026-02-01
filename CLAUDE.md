# ZEUS Project Memory

This file contains project-specific standards and patterns that should be followed when working on ZEUS.

## Column Resize Handles

**ALWAYS** use the wider resize handle pattern for any columns in data grids/tables:

```tsx
{/* Resize handle - wider clickable area with thin visual indicator */}
<div
  className="absolute top-0 right-[-4px] w-[9px] h-full cursor-col-resize z-10 group"
  onMouseDown={(e) => handleResizeStart(index, e)}
>
  <div className="absolute top-0 left-[4px] w-[1px] h-full bg-transparent group-hover:bg-[#0078d4]" />
</div>
```

This creates a 9px clickable area with a thin visual indicator that appears on hover. Works reliably over Tailscale/remote connections.

## Data Layer Architecture

- Server Actions in `/src/lib/actions/` call Data Layer in `/src/lib/data/`
- Data layer fetches from SQL Server and mirrors to PostgreSQL
- Use `SELECT *` patterns for SQL Server 2008 compatibility
- Always match existing API routes exactly when creating data layer functions

## AdminTools Component

Include `<AdminTools>` in all module pages for admin customization:

```tsx
<AdminTools
  pageId="module-name"
  fields={fields}
  onFieldsChange={updateFields}
  isEditMode={isEditMode}
  onEditModeChange={setIsEditMode}
/>
```

## Tickets Table Structure

- Open tickets: `TicketO` table
- Completed tickets: `TicketD` table

**Date fields in ticket tables:**
- `CDate` - Creation date (when ticket was created)
- `DDate` - Dispatch date (when ticket was dispatched)
- `EDate` - End/Completion date (when ticket was completed)
- `ID` - Auto-increment, newest tickets have highest IDs

**Date filtering logic:**
- Completed tickets (`TicketD`): Filter by `EDate` (completion date)
- Open tickets (`TicketO`): Filter by `CDate` (creation date)

## Live Data Sync

Data should ALWAYS be fetched fresh from SQL Server on every request:
- No caching in Server Actions or data layer
- Every page load/refresh gets latest data from SQL Server
- Data is mirrored to PostgreSQL for backup only
- If SQL Server is unavailable, fall back to PostgreSQL
