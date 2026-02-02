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

**Date filtering & ordering logic:**
- Completed tickets (`TicketD`): Filter AND order by `EDate` (completion date) DESC
- Open tickets (`TicketO`): Filter by `CDate`, order by `ID` DESC

A ticket can be created long ago but completed today, so completed tickets must be ordered by completion date, not ticket ID.

## Completed Tickets UI

- Default sort: `date DESC` (most recently completed first)
- Start and End date pickers should be next to each other
- Quick date buttons: Day (today), Week (7 days), Month (30 days), Quarter (90 days), Year (365 days)
- Clicking column headers toggles sort direction

## Column Sorting Standard

**ALL columns in data grids MUST be sortable.** Every column header should:
- Be clickable to sort by that column
- Toggle between ascending/descending on repeated clicks
- Show a sort direction indicator (chevron up/down)

Never use `field: null` for columns - every column gets a sort field.

## ID to Name Lookups

**Always map IDs to names** when displaying data. Common lookups:

| Field | Table | Name Field |
|-------|-------|------------|
| Mech/Crew (DWork, fWork) | `tblWork` | `fDesc` |
| Location (LID, Loc) | `Loc` → `Rol` | `Rol.Name` or `Rol.Address` |
| Owner | `Owner` → `Rol` | `Rol.Name` |
| Type | `JobType` | `Type` or `Name` |

Pattern in data layer:
```typescript
// Collect IDs
const mechIds = [...new Set(tickets.map(t => t.DWork || t.fWork).filter(Boolean))];
// Fetch records
const mechanics = await sqlserver.$queryRawUnsafe(`SELECT * FROM tblWork WHERE ID IN (${mechIds.join(",")})`);
// Create lookup map
const mechMap = new Map(mechanics.map(m => [m.ID, m.fDesc]));
// Use in mapping
mechCrew: mechMap.get(ticket.DWork || ticket.fWork) || null,
```

## Labels Table Lookups

The `Labels` table is the central lookup table for dropdown values. Use the `Screen` column to filter by lookup type.

| Lookup Type | Query |
|-------------|-------|
| Level | `SELECT Name, Label FROM Labels WHERE Screen = 'Level'` |
| Category | `SELECT Name, Label FROM Labels WHERE Screen = 'Category'` |

**Pattern for fetching lookup options:**
```typescript
// In /src/lib/data/lookups.ts
export async function fetchLevelLookup(): Promise<Map<number, string>> {
  const results: any[] = await sqlserver.$queryRawUnsafe(
    `SELECT Name, Label FROM Labels WHERE Screen = 'Level' ORDER BY CAST(Name AS INT)`
  );
  const map = new Map<number, string>();
  for (const row of results) {
    const id = parseInt(row.Name);
    if (!isNaN(id)) {
      map.set(id, `${id}-${row.Label}`); // Format as "ID-Label"
    }
  }
  return map;
}

// For string-based lookups like Category
export async function fetchCategoryLookup(): Promise<Map<string, string>> {
  const results: any[] = await sqlserver.$queryRawUnsafe(
    `SELECT Name, Label FROM Labels WHERE Screen = 'Category' ORDER BY Name`
  );
  const map = new Map<string, string>();
  for (const row of results) {
    map.set(row.Name, row.Label || row.Name);
  }
  return map;
}
```

**Wage lookup** uses a separate table:
```typescript
// PRWage table for wage codes
const results = await sqlserver.$queryRawUnsafe(`SELECT ID, fDesc FROM PRWage ORDER BY ID`);
```

**Using lookups in components:**
1. Create server action in `/src/lib/actions/tickets.ts`
2. Fetch options in parent component with `useEffect`
3. Pass options as props to child components
4. Render in dropdown: `{options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}`

## Date/Time Display

SQL Server dates come without timezone info. **Do NOT use timezone conversion** when displaying dates - display them as-is (they are already in EST/local time).

```tsx
// WRONG - causes timezone shift
const date = new Date(dateStr);
return date.toLocaleString(); // Converts UTC to local

// RIGHT - parse and display without conversion
const parts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})T?(\d{2})?:?(\d{2})?/);
if (parts) {
  const [, year, month, day, hour = "0", minute = "0"] = parts;
  // Format directly without Date object conversion
}
```

**For time-only fields**, use UTC methods to avoid timezone conversion:
```typescript
export function formatTimeOnly(value: Date | string | null): string | null {
  if (!value) return null;
  const date = typeof value === 'string' ? new Date(value) : value;

  // Use UTC methods to get the raw values without timezone conversion
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${h12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}
```

## Live Data Sync

Data should ALWAYS be fetched fresh from SQL Server on every request:
- No caching in Server Actions or data layer
- Every page load/refresh gets latest data from SQL Server
- Data is mirrored to PostgreSQL for backup only
- If SQL Server is unavailable, fall back to PostgreSQL

## Module Page Layout Standard

**ALL module pages with data grids MUST use the same flex-based layout pattern.**

When building a new module, copy the layout from `/src/app/customers/page.tsx` as a starting template, then adjust:
- Column definitions (fields, labels, widths)
- Toolbar/filter components (may vary per module)
- Data fields in rows

**The structure and placement of everything is always the same:**

1. **Column state management:**
```tsx
const columns: { field: string | null; label: string; width: number }[] = [
  { field: "fieldName", label: "Display Label", width: 100 },
  // ... more columns
];
const [columnWidths, setColumnWidths] = useState<number[]>(columns.map(c => c.width));
```

2. **Resize handlers:**
```tsx
const handleResizeStart = (index: number, e: React.MouseEvent) => {
  e.preventDefault();
  const startX = e.clientX;
  const startWidth = columnWidths[index];

  const handleMouseMove = (moveEvent: MouseEvent) => {
    const diff = moveEvent.clientX - startX;
    const newWidth = Math.max(30, startWidth + diff);
    setColumnWidths(prev => {
      const updated = [...prev];
      updated[index] = newWidth;
      return updated;
    });
  };

  const handleMouseUp = () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
};
```

3. **Header row with flex layout:**
```tsx
<div className="flex bg-[#f0f0f0] border-b border-[#999] text-xs font-semibold">
  {columns.map((col, index) => (
    <div
      key={col.field || index}
      className="relative flex items-center px-1 py-0.5 border-r border-[#999]"
      style={{ width: columnWidths[index], minWidth: columnWidths[index] }}
    >
      {/* Column label and sort indicator */}
      {/* Resize handle (see Column Resize Handles section) */}
    </div>
  ))}
</div>
```

4. **Data rows with matching flex layout:**
```tsx
<div className="flex-1 overflow-auto">
  {data.map((item) => (
    <div key={item.id} className="flex border-b border-[#ccc] text-xs hover:bg-[#e8f4fc]">
      {columns.map((col, index) => (
        <div
          key={col.field || index}
          className="px-1 py-0.5 border-r border-[#e0e0e0] truncate"
          style={{ width: columnWidths[index], minWidth: columnWidths[index] }}
        >
          {/* Cell content */}
        </div>
      ))}
    </div>
  ))}
</div>
```

**Key principles:**
- Use flex layout, NOT HTML tables
- Single `columnWidths` array controls both header and body column widths
- All columns get resize handles (see Column Resize Handles section)
- Toolbar/filters can vary but grid structure stays consistent
