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
- Query by `DDate` (dispatch date) for date filtering
- `CDate` is creation date
