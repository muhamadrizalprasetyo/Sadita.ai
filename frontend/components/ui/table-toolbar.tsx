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
              style={{
                position: "absolute",
                left: "9px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
              }}
            />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: "100%",
                padding: "4px 8px 4px 28px",
                fontSize: "11.5px",
                borderRadius: "6px",
                border: "1px solid var(--line)",
                background: "#f8fafc",
                color: "var(--text)",
                outline: "none",
              }}
            />
          </div>
        )}

        {filterTabs && (
          <div style={{ display: "flex", gap: "4px" }}>
            {filterTabs.options.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={`filter-tab-btn ${filterTabs.activeKey === opt.key ? "active" : ""}`}
                onClick={() => filterTabs.onChange(opt.key)}
              >
                <span>{opt.label}</span>
                {opt.count !== undefined && (
                  <span style={{ opacity: 0.8, fontSize: "10px", marginLeft: "3px" }}>
                    ({opt.count})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {actions && <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>{actions}</div>}
    </div>
  );
}
