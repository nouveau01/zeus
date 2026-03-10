"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export interface AutocompleteResult {
  id: string;
  label: string;
  description?: string;
  data?: any;
}

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: AutocompleteResult) => void;
  searchType: "accounts" | "customers" | "units" | "jobs" | "contacts";
  filterParams?: Record<string, string>;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function AutocompleteInput({
  value,
  onChange,
  onSelect,
  searchType,
  filterParams,
  placeholder,
  className = "",
  disabled = false,
}: AutocompleteInputProps) {
  const [results, setResults] = useState<AutocompleteResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback(
    async (query: string) => {
      if (query.length < 1) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          type: searchType,
          q: query,
          ...filterParams,
        });
        const res = await fetch(`/api/search?${params}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setIsOpen(data.length > 0);
          setHighlightIndex(-1);
        }
      } catch (error) {
        console.error("Autocomplete search error:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [searchType, filterParams]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 250);
  };

  const handleSelect = (result: AutocompleteResult) => {
    onSelect(result);
    setIsOpen(false);
    setResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < results.length) {
        handleSelect(results[highlightIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="relative flex-1">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (results.length > 0) setIsOpen(true);
        }}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-1 py-0.5 border border-[#808080] text-[11px] bg-white ${className}`}
      />
      {isLoading && (
        <div className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-[#808080]">...</div>
      )}
      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 top-full left-0 w-full min-w-[280px] max-h-[200px] overflow-y-auto bg-white border border-[#808080] shadow-md"
          style={{ marginTop: 1 }}
        >
          {results.map((result, i) => (
            <div
              key={result.id}
              className={`px-2 py-1 cursor-pointer text-[11px] border-b border-[#f0f0f0] ${
                i === highlightIndex
                  ? "bg-[#316ac5] text-white"
                  : "hover:bg-[#e8f4fc]"
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(result);
              }}
              onMouseEnter={() => setHighlightIndex(i)}
            >
              <div className="font-medium truncate">{result.label}</div>
              {result.description && (
                <div
                  className={`truncate ${
                    i === highlightIndex ? "text-[#c0d8f0]" : "text-[#808080]"
                  }`}
                  style={{ fontSize: "10px" }}
                >
                  {result.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
