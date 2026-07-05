"use client";

import React, { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export interface CustomSelectOption {
  value: string;
  label: ReactNode;
}

export interface CustomSelectGroup {
  name: string;
  options: CustomSelectOption[];
}

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options?: CustomSelectOption[];
  groups?: CustomSelectGroup[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  groups,
  placeholder = "Select an option...",
  className = "",
  buttonClassName = "",
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  let selectedLabel: ReactNode = placeholder;
  
  if (groups) {
    for (const g of groups) {
      const found = g.options.find(o => o.value === value);
      if (found) {
        selectedLabel = found.label;
        break;
      }
    }
  } else if (options) {
    const found = options.find(o => o.value === value);
    if (found) {
      selectedLabel = found.label;
    }
  }

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full bg-[#151518] border border-white/10 rounded-lg pl-3 pr-10 py-2.5 text-[13px] text-white focus:outline-none focus:border-purple-500/50 cursor-pointer hover:border-white/20 transition-colors text-left flex items-center justify-between ${buttonClassName}`}
      >
        <span className="truncate">{selectedLabel}</span>
      </button>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-2 bg-[#1c1c1f] border border-white/10 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="max-h-60 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {groups ? (
              groups.map(group => (
                <div key={group.name} className="mb-2 last:mb-0">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-white/40 uppercase tracking-wider">
                    {group.name}
                  </div>
                  {group.options.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { onChange(opt.value); setOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-[13px] rounded-md transition-colors ${
                        value === opt.value ? 'bg-purple-500/20 text-purple-200' : 'text-white/80 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ))
            ) : options ? (
              options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-[13px] rounded-md transition-colors ${
                    value === opt.value ? 'bg-purple-500/20 text-purple-200' : 'text-white/80 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
