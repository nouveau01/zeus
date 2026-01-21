"use client";

interface HighlightField {
  label: string;
  value: string | null;
  isLink?: boolean;
  href?: string;
}

interface HighlightsPanelProps {
  fields: HighlightField[];
}

export function HighlightsPanel({ fields }: HighlightsPanelProps) {
  return (
    <div className="flex items-start gap-8 mt-4">
      {fields.map((field, index) => (
        <div key={index}>
          <p className="text-xs text-[#706e6b] mb-1">{field.label}</p>
          {field.isLink && field.value ? (
            <a
              href={field.href || "#"}
              className="text-sm text-[#0176d3] hover:underline"
            >
              {field.value}
            </a>
          ) : (
            <p className="text-sm text-[#3e3e3c]">{field.value || "—"}</p>
          )}
        </div>
      ))}
    </div>
  );
}
