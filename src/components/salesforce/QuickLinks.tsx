"use client";

import { Info } from "lucide-react";

interface QuickLink {
  label: string;
  count: number;
  color?: string;
  href?: string;
}

interface QuickLinksProps {
  links: QuickLink[];
}

const colorMap: Record<string, string> = {
  red: "text-red-500",
  green: "text-green-600",
  blue: "text-blue-500",
  yellow: "text-yellow-500",
  purple: "text-purple-500",
  gray: "text-gray-500",
};

export function QuickLinks({ links }: QuickLinksProps) {
  return (
    <div className="flex items-center gap-1 flex-wrap py-3 border-t border-b border-[#dddbda] my-4">
      <span className="text-sm font-medium text-[#3e3e3c] mr-2">
        Related List Quick Links
      </span>
      <Info className="w-4 h-4 text-[#706e6b] mr-2" />

      {links.map((link, index) => (
        <a
          key={index}
          href={link.href || "#"}
          className={`sf-quick-link ${colorMap[link.color || "blue"]}`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              link.color === "red"
                ? "bg-red-500"
                : link.color === "green"
                ? "bg-green-600"
                : link.color === "yellow"
                ? "bg-yellow-500"
                : link.color === "purple"
                ? "bg-purple-500"
                : "bg-blue-500"
            }`}
          ></span>
          {link.label} ({link.count})
        </a>
      ))}
    </div>
  );
}
