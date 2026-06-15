"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check, X } from "lucide-react";

interface Option {
  value: string;
  label: string;
  subLabel?: string;
  image?: string;
  disabled?: boolean;
}

interface MultiSearchableSelectProps {
  options: Option[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
}

export default function MultiSearchableSelect({
  options,
  values,
  onChange,
  placeholder = "Select options...",
  className = "",
}: MultiSearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOptions = options.filter((opt) => values.includes(opt.value));

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    (opt.label || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  };

  const removeOption = (e: React.MouseEvent, value: string) => {
    e.stopPropagation();
    onChange(values.filter((v) => v !== value));
  };

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg bg-black border border-white/10 px-3 py-2 text-sm text-white hover:border-red-500/50 focus:border-red-500/50 outline-none transition-colors min-h-[42px]"
      >
        <div className="text-left flex-1 text-zinc-300 flex items-center min-w-0 pr-2 flex-wrap gap-1.5">
          {selectedOptions.length > 0 ? (
            selectedOptions.map((opt) => (
              <span key={opt.value} className="inline-flex items-center bg-white/10 rounded px-2 py-0.5 text-xs text-white">
                {opt.image ? (
                  <img src={opt.image} alt={opt.label} className="w-3.5 h-3.5 rounded-full mr-1 object-cover" />
                ) : opt.subLabel ? (
                  <div className="w-3.5 h-3.5 rounded-full mr-1 bg-zinc-800 text-zinc-400 flex items-center justify-center text-[8px] font-bold">
                    {opt.label.charAt(0).toUpperCase()}
                  </div>
                ) : null}
                <span className="truncate max-w-[100px]">{opt.label}</span>
                <X 
                  size={12} 
                  className="ml-1 text-zinc-400 hover:text-white cursor-pointer" 
                  onClick={(e) => removeOption(e, opt.value)} 
                />
              </span>
            ))
          ) : (
            <span className="text-zinc-500">{placeholder}</span>
          )}
        </div>
        <ChevronDown size={16} className={`shrink-0 text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg bg-zinc-900 border border-white/10 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
          {/* Search Input */}
          <div className="flex items-center px-3 py-2 border-b border-white/10 bg-black/50">
            <Search size={14} className="text-zinc-500 mr-2 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
            />
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-zinc-500">
                No results found.
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = values.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => {
                      toggleOption(opt.value);
                    }}
                    className={`flex w-full items-center px-3 py-2 text-sm text-left transition-colors
                      ${opt.disabled 
                        ? "opacity-50 cursor-not-allowed text-zinc-500" 
                        : "hover:bg-red-500/10 hover:text-red-400 text-zinc-300"
                      }
                      ${isSelected ? "bg-white/5 font-medium text-white" : ""}
                    `}
                  >
                    {opt.image ? (
                      <img src={opt.image} alt={opt.label} className="w-7 h-7 rounded-full mr-3 object-cover bg-white/10 shrink-0" />
                    ) : opt.subLabel ? (
                      <div className="w-7 h-7 rounded-full mr-3 bg-zinc-800 text-zinc-400 flex items-center justify-center shrink-0 text-[11px] font-bold">
                        {opt.label.charAt(0).toUpperCase()}
                      </div>
                    ) : null}
                    <div className="flex-1 min-w-0 flex flex-row items-center justify-between gap-2">
                      <span className="truncate font-medium">{opt.label}</span>
                      {opt.subLabel && <span className="truncate text-xs text-zinc-400">{opt.subLabel}</span>}
                    </div>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ml-2 ${isSelected ? 'bg-red-500 border-red-500' : 'border-zinc-500'}`}>
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
