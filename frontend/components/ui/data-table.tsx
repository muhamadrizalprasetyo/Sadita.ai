"use client";

import React, { ReactNode, useState, useMemo } from "react";
import {
  Inbox,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Columns3,
  CheckCircle2,
  XCircle,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";

export interface ColumnDef<T> {
  key: string;
  header: ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  render?: (item: T, index: number) => ReactNode;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor?: (item: T, index: number) => string | number;
  loading?: boolean;
  loadingText?: string;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  onRowClick?: (item: T) => void;
  // Selection
  selectable?: boolean;
  selectedKeys?: (string | number)[];
  onSelectionChange?: (keys: (string | number)[]) => void;
  // Topbar Controls (Search & Column toggle)
  searchable?: boolean;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  toolbarActions?: ReactNode;
  showColumnToggle?: boolean;
  // Sorting
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (key: string) => void;
  // Pagination
  pagination?: {
    currentPage: number;
    totalPages: number;
    perPage?: number;
    perPageOptions?: number[];
    onPageChange: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
    totalRecords?: number;
  };
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Reusable Filament v3-styled Boolean indicator (Green Checkmark / Red X Circle)
 */
export function FilamentBoolean({ value }: { value: boolean | string | number | null | undefined }) {
  const isTrue = Boolean(value && value !== "false" && value !== "0" && value !== "OFFLINE" && value !== "INACTIVE");
  if (isTrue) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", color: "#16a34a" }} title="Aktif / Visible">
        <CheckCircle2 size={18} strokeWidth={2.2} />
      </span>
    );
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", color: "#ef4444" }} title="Nonaktif / Hidden">
      <XCircle size={18} strokeWidth={2.2} />
    </span>
  );
}

/**
 * Reusable Filament v3-styled Action buttons (Show, Edit, Delete)
 */
export function FilamentAction({
  type,
  label,
  onClick,
  href,
}: {
  type: "show" | "edit" | "delete" | "custom";
  label?: string;
  onClick?: () => void;
  href?: string;
}) {
  let icon = <Eye size={14} />;
  let defaultLabel = "Show";
  let color = "#4b5563";
  let hoverColor = "#111827";

  if (type === "edit") {
    icon = <Pencil size={13} />;
    defaultLabel = "Edit";
    color = "#2563eb";
    hoverColor = "#1d4ed8";
  } else if (type === "delete") {
    icon = <Trash2 size={13} />;
    defaultLabel = "Delete";
    color = "#ef4444";
    hoverColor = "#dc2626";
  }

  const content = (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "12px",
        fontWeight: 600,
        color,
        cursor: "pointer",
        transition: "color 0.15s ease",
        textDecoration: "none",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = hoverColor)}
      onMouseLeave={(e) => (e.currentTarget.style.color = color)}
    >
      {icon}
      <span>{label || defaultLabel}</span>
    </span>
  );

  if (href) {
    return (
      <a href={href} style={{ textDecoration: "none" }}>
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        padding: "2px 4px",
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      {content}
    </button>
  );
}

/**
 * Universal Filament v3-inspired DataTable Component
 */
export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  keyExtractor,
  loading = false,
  loadingText = "Memuat data...",
  emptyMessage = "Tidak ada data yang tersedia.",
  emptyIcon,
  onRowClick,
  selectable = false,
  selectedKeys: controlledSelectedKeys,
  onSelectionChange,
  searchable = false,
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search",
  toolbarActions,
  showColumnToggle = false,
  sortKey,
  sortDirection = "asc",
  onSort,
  pagination,
  style,
  className = "",
}: DataTableProps<T>) {
  // Local selection if uncontrolled
  const [internalSelectedKeys, setInternalSelectedKeys] = useState<(string | number)[]>([]);
  const isControlled = controlledSelectedKeys !== undefined;
  const selectedKeys = isControlled ? controlledSelectedKeys : internalSelectedKeys;

  // Local per page option
  const [perPage, setPerPage] = useState<number>(pagination?.perPage || 10);

  const allKeys = useMemo(() => {
    return data.map((item, idx) => (keyExtractor ? keyExtractor(item, idx) : item.id ?? idx));
  }, [data, keyExtractor]);

  const isAllSelected = data.length > 0 && allKeys.every((k) => selectedKeys.includes(k));
  const isSomeSelected = data.length > 0 && allKeys.some((k) => selectedKeys.includes(k)) && !isAllSelected;

  const handleSelectAll = () => {
    const nextKeys = isAllSelected ? [] : allKeys;
    if (!isControlled) setInternalSelectedKeys(nextKeys);
    onSelectionChange?.(nextKeys);
  };

  const handleToggleRow = (key: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextKeys = selectedKeys.includes(key)
      ? selectedKeys.filter((k) => k !== key)
      : [...selectedKeys, key];
    if (!isControlled) setInternalSelectedKeys(nextKeys);
    onSelectionChange?.(nextKeys);
  };

  // Helper for generating page numbers like [1, 2, 3, 4, '...', 7, 8]
  const paginationRange = useMemo(() => {
    if (!pagination) return [];
    const { currentPage, totalPages } = pagination;
    const delta = 1;
    const range: (number | string)[] = [];

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta) ||
        (currentPage <= 3 && i <= 4) ||
        (currentPage >= totalPages - 2 && i >= totalPages - 3)
      ) {
        range.push(i);
      } else if (range[range.length - 1] !== "...") {
        range.push("...");
      }
    }
    return range;
  }, [pagination]);

  return (
    <div
      className={`filament-table-wrapper ${className}`}
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.02)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      {/* 1. Filament Topbar (Search & Column actions) */}
      {(searchable || toolbarActions || showColumnToggle) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            padding: "10px 14px",
            gap: "8px",
            borderBottom: "1px solid #f3f4f6",
            background: "#ffffff",
          }}
        >
          {toolbarActions && <div style={{ marginRight: "auto" }}>{toolbarActions}</div>}

          {searchable && (
            <div style={{ position: "relative", width: "230px" }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#9ca3af",
                }}
              />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery ?? ""}
                onChange={(e) => onSearchChange?.(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 10px 6px 30px",
                  fontSize: "12px",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  background: "#ffffff",
                  color: "#111827",
                  outline: "none",
                  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#3b82f6";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.12)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
          )}

          {showColumnToggle && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{
                width: "32px",
                height: "32px",
                padding: 0,
                borderRadius: "8px",
                display: "grid",
                placeItems: "center",
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                color: "#4b5563",
              }}
              title="Columns visibility"
            >
              <Columns3 size={15} />
            </button>
          )}
        </div>
      )}

      {/* 2. Loading State */}
      {loading ? (
        <div
          style={{
            padding: "44px 16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          <div className="spinner" style={{ width: "26px", height: "26px" }} />
          <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 500 }}>{loadingText}</span>
        </div>
      ) : !data || data.length === 0 ? (
        /* 3. Empty State */
        <div
          style={{
            padding: "44px 16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            textAlign: "center",
          }}
        >
          <div style={{ color: "#9ca3af", opacity: 0.8 }}>
            {emptyIcon || <Inbox size={32} />}
          </div>
          <p style={{ margin: 0, fontSize: "12.5px", color: "#6b7280", fontWeight: 500 }}>
            {emptyMessage}
          </p>
        </div>
      ) : (
        /* 4. Table Body */
        <div style={{ overflowX: "auto", width: "100%" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid #f3f4f6", background: "#ffffff" }}>
                {selectable && (
                  <th style={{ width: "40px", padding: "12px 14px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeSelected;
                      }}
                      onChange={handleSelectAll}
                      style={{
                        width: "15px",
                        height: "15px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        accentColor: "#2563eb",
                      }}
                      title="Select all"
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && onSort?.(col.key)}
                    style={{
                      width: col.width,
                      textAlign: col.align || "left",
                      padding: "12px 14px",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      color: "#111827",
                      cursor: col.sortable ? "pointer" : "default",
                      userSelect: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        justifyContent: col.align === "center" ? "center" : col.align === "right" ? "flex-end" : "flex-start",
                        width: "100%",
                      }}
                    >
                      <span>{col.header}</span>
                      {Boolean(col.header) && col.sortable && (
                        <ChevronDown
                          size={13}
                          style={{
                            color: sortKey === col.key ? "#2563eb" : "#9ca3af",
                            transition: "transform 0.15s ease",
                            transform: sortKey === col.key && sortDirection === "desc" ? "rotate(180deg)" : "rotate(0deg)",
                            opacity: 0.8,
                          }}
                        />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => {
                const key = keyExtractor ? keyExtractor(item, idx) : item.id ?? idx;
                const isSelected = selectedKeys.includes(key);

                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick && onRowClick(item)}
                    style={{
                      borderBottom: "1px solid #f3f4f6",
                      background: isSelected ? "#f8fafc" : "#ffffff",
                      cursor: onRowClick ? "pointer" : "default",
                      transition: "background-color 0.1s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = "#f9fafb";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = "#ffffff";
                    }}
                  >
                    {selectable && (
                      <td
                        style={{ width: "40px", padding: "11px 14px", textAlign: "center" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleRow(key, e as unknown as React.MouseEvent)}
                          style={{
                            width: "15px",
                            height: "15px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            accentColor: "#2563eb",
                          }}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        style={{
                          textAlign: col.align || "left",
                          padding: "11px 14px",
                          fontSize: "12.5px",
                          color: "#374151",
                        }}
                      >
                        {col.render
                          ? col.render(item, idx)
                          : ((item as unknown) as Record<string, ReactNode>)[col.key] ?? "-"}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. Filament Table Footer & Pagination */}
      {pagination && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "11px 16px",
            borderTop: "1px solid #f3f4f6",
            background: "#ffffff",
            fontSize: "12px",
            color: "#6b7280",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          {/* Result Count */}
          <div>
            Showing{" "}
            <strong style={{ color: "#111827", fontWeight: 600 }}>
              {pagination.totalRecords ? (pagination.currentPage - 1) * perPage + 1 : 1}
            </strong>{" "}
            to{" "}
            <strong style={{ color: "#111827", fontWeight: 600 }}>
              {pagination.totalRecords
                ? Math.min(pagination.currentPage * perPage, pagination.totalRecords)
                : data.length}
            </strong>{" "}
            of{" "}
            <strong style={{ color: "#111827", fontWeight: 600 }}>
              {pagination.totalRecords ?? data.length}
            </strong>{" "}
            results
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Per page selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "11.5px" }}>Per page</span>
              <select
                value={perPage}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPerPage(val);
                  pagination.onPerPageChange?.(val);
                }}
                style={{
                  padding: "3px 6px",
                  fontSize: "11.5px",
                  borderRadius: "6px",
                  border: "1px solid #e5e7eb",
                  background: "#ffffff",
                  color: "#374151",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                {(pagination.perPageOptions || [10, 25, 50, 100]).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Segmented Page Numbers Box */}
            {pagination.totalPages > 1 && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  border: "1px solid #e5e7eb",
                  borderRadius: "7px",
                  overflow: "hidden",
                  background: "#ffffff",
                }}
              >
                {/* Previous Button (only when page > 1) */}
                {pagination.currentPage > 1 && (
                  <button
                    type="button"
                    onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                    style={{
                      border: "none",
                      borderRight: "1px solid #e5e7eb",
                      background: "#ffffff",
                      color: "#374151",
                      padding: "5px 8px",
                      cursor: "pointer",
                      display: "grid",
                      placeItems: "center",
                    }}
                    title="Previous page"
                  >
                    <ChevronLeft size={14} />
                  </button>
                )}

                {/* Number buttons */}
                {paginationRange.map((page, pIdx) => {
                  if (page === "...") {
                    return (
                      <span
                        key={`ellipsis-${pIdx}`}
                        style={{
                          padding: "4px 8px",
                          fontSize: "11.5px",
                          color: "#9ca3af",
                          borderRight: "1px solid #e5e7eb",
                          userSelect: "none",
                        }}
                      >
                        …
                      </span>
                    );
                  }

                  const pageNum = page as number;
                  const isActive = pageNum === pagination.currentPage;

                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => pagination.onPageChange(pageNum)}
                      style={{
                        border: "none",
                        borderRight: "1px solid #e5e7eb",
                        background: isActive ? "#eff6ff" : "#ffffff",
                        color: isActive ? "#2563eb" : "#374151",
                        fontWeight: isActive ? 700 : 500,
                        fontSize: "12px",
                        padding: "5px 10px",
                        cursor: "pointer",
                        minWidth: "30px",
                        transition: "background 0.1s ease",
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {/* Next Button (only when page < totalPages) */}
                {pagination.currentPage < pagination.totalPages && (
                  <button
                    type="button"
                    onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                    style={{
                      border: "none",
                      background: "#ffffff",
                      color: "#374151",
                      padding: "5px 8px",
                      cursor: "pointer",
                      display: "grid",
                      placeItems: "center",
                    }}
                    title="Next page"
                  >
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
