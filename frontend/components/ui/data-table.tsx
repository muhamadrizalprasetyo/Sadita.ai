"use client";

import React, { ReactNode, useState, useMemo, useRef, useEffect } from "react";
import {
  Inbox,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Columns3,
  ListFilter,
  MoreVertical,
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
  toggleable?: boolean; // Can this column be hidden via the column toggle popover? (defaults to true)
  defaultHidden?: boolean; // Hidden by default
  render?: (item: T, index: number) => ReactNode;
}

export interface TableFilterDef {
  key: string;
  label: string;
  value: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
  onChange: (val: string) => void;
}

export interface BulkActionItem<T = unknown> {
  key: string;
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  onClick: (selectedKeys: (string | number)[], selectedItems?: T[]) => void | Promise<void>;
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
  // Selection & Bulk Actions (Filament v5+)
  selectable?: boolean;
  selectedKeys?: (string | number)[];
  onSelectionChange?: (keys: (string | number)[]) => void;
  bulkActions?: BulkActionItem<T>[];
  onSelectAllTotal?: () => void;
  // Topbar Controls (Search, Filters, Column Toggle)
  searchable?: boolean;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  toolbarActions?: ReactNode;
  showColumnToggle?: boolean;
  // Filament Filters Popover (v5+)
  filters?: TableFilterDef[];
  filtersPopoverContent?: ReactNode;
  activeFilterCount?: number;
  onResetFilters?: () => void;
  showFilterButton?: boolean;
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
 * Reusable Filament v3/v5 Boolean indicator (Green Checkmark / Red X Circle)
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
 * Reusable Filament Action buttons (Show, Edit, Delete)
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
      {label !== "" && <span>{label || defaultLabel}</span>}
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
 * Universal Laravel Filament v5-compliant DataTable Component
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
  bulkActions,
  onSelectAllTotal,
  searchable = false,
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search",
  toolbarActions,
  showColumnToggle = false,
  filters,
  filtersPopoverContent,
  activeFilterCount,
  onResetFilters,
  showFilterButton,
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

  // Column Visibility Popover state (Image 1)
  const [hiddenColumns, setHiddenColumns] = useState<string[]>(() => {
    return columns.filter((c) => c.defaultHidden).map((c) => c.key);
  });
  const [columnPopoverOpen, setColumnPopoverOpen] = useState(false);
  const [draftHiddenColumns, setDraftHiddenColumns] = useState<string[]>(hiddenColumns);
  const columnPopoverRef = useRef<HTMLDivElement>(null);

  // Filters Popover state (Filament v5)
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const filterPopoverRef = useRef<HTMLDivElement>(null);

  // Bulk Actions dropdown state (Image 2 & 3)
  const [bulkActionsOpen, setBulkActionsOpen] = useState(false);
  const bulkActionsRef = useRef<HTMLDivElement>(null);

  // Close popovers on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (columnPopoverRef.current && !columnPopoverRef.current.contains(target)) {
        setColumnPopoverOpen(false);
      }
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(target)) {
        setFilterPopoverOpen(false);
      }
      if (bulkActionsRef.current && !bulkActionsRef.current.contains(target)) {
        setBulkActionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const allKeys = useMemo(() => {
    return data.map((item, idx) => (keyExtractor ? keyExtractor(item, idx) : item.id ?? idx));
  }, [data, keyExtractor]);

  const isAllSelected = data.length > 0 && allKeys.every((k) => selectedKeys.includes(k));
  const isSomeSelected = data.length > 0 && allKeys.some((k) => selectedKeys.includes(k)) && !isAllSelected;

  const handleSelectAllOnPage = () => {
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

  const handleDeselectAll = () => {
    if (!isControlled) setInternalSelectedKeys([]);
    onSelectionChange?.([]);
  };

  const handleSelectAllTotalRecords = () => {
    if (onSelectAllTotal) {
      onSelectAllTotal();
    } else {
      if (!isControlled) setInternalSelectedKeys(allKeys);
      onSelectionChange?.(allKeys);
    }
  };

  // Column toggle actions
  const handleOpenColumnPopover = () => {
    setDraftHiddenColumns(hiddenColumns);
    setColumnPopoverOpen((prev) => !prev);
    setFilterPopoverOpen(false);
  };

  const handleApplyColumns = () => {
    setHiddenColumns(draftHiddenColumns);
    setColumnPopoverOpen(false);
  };

  const handleResetColumns = () => {
    const initial = columns.filter((c) => c.defaultHidden).map((c) => c.key);
    setDraftHiddenColumns(initial);
    setHiddenColumns(initial);
  };

  // Filter actions
  const hasFilterSupport = Boolean(showFilterButton || filters || filtersPopoverContent);
  const computedActiveFilterCount = useMemo(() => {
    if (activeFilterCount !== undefined) return activeFilterCount;
    if (!filters) return 0;
    return filters.filter((f) => f.value && f.value !== "ALL" && f.value !== "").length;
  }, [activeFilterCount, filters]);

  const handleResetAllFilters = () => {
    if (onResetFilters) {
      onResetFilters();
    } else if (filters) {
      filters.forEach((f) => f.onChange("ALL"));
    }
  };

  // Filter visible columns based on toggle state
  const visibleColumns = useMemo(() => {
    return columns.filter((c) => !hiddenColumns.includes(c.key));
  }, [columns, hiddenColumns]);

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

  const hasTopBar = Boolean(
    searchable ||
    toolbarActions ||
    showColumnToggle ||
    hasFilterSupport ||
    (selectable && selectedKeys.length > 0)
  );

  return (
    <div
      className={`filament-table-wrapper ${className}`}
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.02)",
        overflow: "visible", // allow popovers to display cleanly
        display: "flex",
        flexDirection: "column",
        position: "relative",
        ...style,
      }}
    >
      {/* 1. Filament Topbar */}
      {hasTopBar && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            gap: "8px",
            borderBottom: "1px solid #f3f4f6",
            background: "#ffffff",
            position: "relative",
            borderTopLeftRadius: "8px",
            borderTopRightRadius: "8px",
          }}
        >
          {/* Left area: Bulk actions or custom toolbar actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {selectable && selectedKeys.length > 0 ? (
              <div style={{ position: "relative" }} ref={bulkActionsRef}>
                <button
                  type="button"
                  onClick={() => setBulkActionsOpen((prev) => !prev)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "5px 10px",
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "#111827",
                    cursor: "pointer",
                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
                  }}
                  title="Bulk actions"
                >
                  <MoreVertical size={13} color="#9ca3af" />
                  <span>Bulk actions</span>
                </button>

                {bulkActionsOpen && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "calc(100% + 4px)",
                      minWidth: "160px",
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                      padding: "4px",
                      zIndex: 60,
                    }}
                  >
                    {(bulkActions && bulkActions.length > 0
                      ? bulkActions
                      : [
                        {
                          key: "delete",
                          label: "Delete selected",
                          icon: <Trash2 size={13} color="#dc2626" />,
                          danger: true,
                          onClick: () => {
                            alert(`Hapus ${selectedKeys.length} data terpilih`);
                          },
                        },
                      ]
                    ).map((action) => (
                      <button
                        key={action.key}
                        type="button"
                        onClick={() => {
                          setBulkActionsOpen(false);
                          const selectedItems = data.filter((item, idx) => {
                            const k = keyExtractor ? keyExtractor(item, idx) : item.id ?? idx;
                            return selectedKeys.includes(k);
                          });
                          action.onClick(selectedKeys, selectedItems);
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "7px 10px",
                          background: "transparent",
                          border: "none",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: 500,
                          color: action.danger ? "#dc2626" : "#374151",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = action.danger ? "#fef2f2" : "#f3f4f6";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        {action.icon || (action.danger ? <Trash2 size={13} color="#dc2626" /> : null)}
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              toolbarActions && <div>{toolbarActions}</div>
            )}
          </div>

          {/* Right area: Search, Filter popover button, Column Toggle button */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
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

            {/* Filament Filters Popover Button */}
            {hasFilterSupport && (
              <div style={{ position: "relative" }} ref={filterPopoverRef}>
                <button
                  type="button"
                  onClick={() => {
                    setFilterPopoverOpen((prev) => !prev);
                    setColumnPopoverOpen(false);
                  }}
                  style={{
                    height: "32px",
                    padding: computedActiveFilterCount > 0 ? "0 8px" : "0 7px",
                    borderRadius: "8px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    border: computedActiveFilterCount > 0 ? "1px solid #bfdbfe" : "1px solid #e5e7eb",
                    background: computedActiveFilterCount > 0 ? "#eff6ff" : "#ffffff",
                    color: computedActiveFilterCount > 0 ? "#2563eb" : "#4b5563",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  title="Table Filters"
                >
                  <ListFilter size={15} />
                  {computedActiveFilterCount > 0 && (
                    <span
                      style={{
                        background: "#2563eb",
                        color: "#ffffff",
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "1px 5px",
                        borderRadius: "9999px",
                        lineHeight: 1.2,
                      }}
                    >
                      {computedActiveFilterCount}
                    </span>
                  )}
                </button>

                {/* Filters Popover Content */}
                {filterPopoverOpen && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "calc(100% + 6px)",
                      width: "280px",
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                      padding: "14px",
                      zIndex: 60,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontWeight: 700, fontSize: "13.5px", color: "#111827" }}>Filters</span>
                        {computedActiveFilterCount > 0 && (
                          <span
                            style={{
                              background: "#eff6ff",
                              color: "#2563eb",
                              fontSize: "10.5px",
                              fontWeight: 700,
                              padding: "1px 6px",
                              borderRadius: "9999px",
                              border: "1px solid #bfdbfe",
                            }}
                          >
                            {computedActiveFilterCount}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleResetAllFilters}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#dc2626",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        Reset
                      </button>
                    </div>

                    {filtersPopoverContent ? (
                      filtersPopoverContent
                    ) : filters && filters.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "11px", marginBottom: "14px" }}>
                        {filters.map((f) => (
                          <div key={f.key} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <label style={{ fontSize: "11.5px", fontWeight: 600, color: "#4b5563" }}>
                              {f.label}
                            </label>
                            <select
                              value={f.value}
                              onChange={(e) => f.onChange(e.target.value)}
                              style={{
                                width: "100%",
                                padding: "6px 8px",
                                fontSize: "12px",
                                borderRadius: "6px",
                                border: "1px solid #e5e7eb",
                                background: "#ffffff",
                                color: "#111827",
                                outline: "none",
                                cursor: "pointer",
                              }}
                            >
                              {(f.options || []).map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: "12px", color: "#9ca3af", margin: "10px 0" }}>
                        Tidak ada filter tambahan.
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => setFilterPopoverOpen(false)}
                      style={{
                        width: "100%",
                        padding: "6px 14px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#ffffff",
                        background: "#2563eb",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1d4ed8")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
                    >
                      Apply filters
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Filament Columns Toggle Popover Button (Image 1) */}
            {showColumnToggle && (
              <div style={{ position: "relative" }} ref={columnPopoverRef}>
                <button
                  type="button"
                  onClick={handleOpenColumnPopover}
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
                    cursor: "pointer",
                  }}
                  title="Columns visibility"
                >
                  <Columns3 size={15} />
                </button>

                {/* Columns Popover Dropdown (Image 1) */}
                {columnPopoverOpen && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "calc(100% + 6px)",
                      width: "240px",
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                      padding: "14px",
                      zIndex: 60,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: "13.5px", color: "#111827" }}>Columns</span>
                      <button
                        type="button"
                        onClick={handleResetColumns}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#dc2626",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        Reset
                      </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" }}>
                      {columns
                        .filter((c) => Boolean(c.header) && c.toggleable !== false)
                        .map((c) => {
                          const isVisible = !draftHiddenColumns.includes(c.key);
                          return (
                            <label
                              key={c.key}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "9px",
                                fontSize: "13px",
                                color: "#374151",
                                fontWeight: 500,
                                cursor: "pointer",
                                userSelect: "none",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isVisible}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setDraftHiddenColumns((prev) => prev.filter((k) => k !== c.key));
                                  } else {
                                    setDraftHiddenColumns((prev) => [...prev, c.key]);
                                  }
                                }}
                                style={{
                                  width: "16px",
                                  height: "16px",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  accentColor: "#2563eb",
                                }}
                              />
                              <span>{c.header}</span>
                            </label>
                          );
                        })}
                    </div>

                    <button
                      type="button"
                      onClick={handleApplyColumns}
                      style={{
                        padding: "6px 14px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#ffffff",
                        background: "#2563eb",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1d4ed8")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
                    >
                      Apply columns
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Selection Indicator Bar (Image 4) */}
      {selectable && selectedKeys.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 14px",
            background: "#ffffff",
            borderBottom: "1px solid #f3f4f6",
            fontSize: "12px",
          }}
        >
          <span style={{ color: "#374151", fontWeight: 500 }}>
            {selectedKeys.length} {selectedKeys.length === 1 ? "record" : "records"} selected
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <button
              type="button"
              onClick={handleSelectAllTotalRecords}
              style={{
                background: "none",
                border: "none",
                color: "#2563eb",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                padding: 0,
                textDecoration: "none",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
            >
              Select all {pagination?.totalRecords ?? data.length}
            </button>
            <button
              type="button"
              onClick={handleDeselectAll}
              style={{
                background: "none",
                border: "none",
                color: "#dc2626",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                padding: 0,
                textDecoration: "none",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
            >
              Deselect all
            </button>
          </div>
        </div>
      )}

      {/* 3. Loading State */}
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
        /* 4. Empty State */
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
        /* 5. Table Body */
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
                      onChange={handleSelectAllOnPage}
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
                {visibleColumns.map((col) => (
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
                      borderLeft: isSelected ? "3px solid #2563eb" : "3px solid transparent",
                      cursor: onRowClick ? "pointer" : "default",
                      transition: "background-color 0.1s ease, border-color 0.1s ease",
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
                    {visibleColumns.map((col) => (
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

      {/* 6. Filament Table Footer & Pagination */}
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
            borderBottomLeftRadius: "8px",
            borderBottomRightRadius: "8px",
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
