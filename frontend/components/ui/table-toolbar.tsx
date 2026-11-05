"use client";

import React, { ReactNode } from "react";
import { Search } from "lucide-react";

export interface FilterTabOption {
  key: string;
  label: string;
  count?: number;
}

export interface TableToolbarProps {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filterTabs?: {
    options: FilterTabOption[];
    activeKey: string;
    onChange: (key: string) => void;
  };
  actions?: ReactNode;
  style?: React.CSSProperties;
}

export function TableToolbar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Cari data...",
  filterTabs,
  actions,
  style,
}: TableToolbarProps) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-2 mb-2.5"
      style={style}
    >
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[200px] w-full">
        {onSearchChange !== undefined && (
          <div className="relative flex-1 min-w-[180px] sm:max-w-[280px] w-full">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full py-1.5 pl-7 pr-2.5 text-[11.5px] max-md:text-[16px] rounded-md border border-[#eceef2] bg-slate-50 text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>
        )}

        {filterTabs && (
          <div className="flex items-center gap-1 flex-wrap">
            {filterTabs.options.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={`filter-tab-btn ${filterTabs.activeKey === opt.key ? "active" : ""}`}
                onClick={() => filterTabs.onChange(opt.key)}
              >
                <span>{opt.label}</span>
                {opt.count !== undefined && (
                  <span className="opacity-80 text-[10px] ml-0.75">
                    ({opt.count})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {actions && <div className="flex items-center gap-1.5">{actions}</div>}
    </div>
  );
}
