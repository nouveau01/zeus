"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function Section({ title, children, defaultOpen = true }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="sf-section-header w-full"
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">{title}</span>
      </button>
      {isOpen && <div className="pl-6">{children}</div>}
    </div>
  );
}
