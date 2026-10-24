"use client";

import React, { ReactNode } from "react";
import { Inbox, ChevronLeft, ChevronRight } from "lucide-react";

export interface ColumnDef<T> {
  key: string;
  header: ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
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
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalRecords?: number;
  };
  style?: React.CSSProperties;
  className?: string;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  keyExtractor,
  loading = false,
  loadingText = "Memuat data...",
  emptyMessage = "Tidak ada data yang tersedia.",
  emptyIcon,
  onRowClick,
  pagination,
  style,
  className = "",
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div
        className="table-container"
        style={{
          border: "1px solid var(--line)",
          padding: "36px 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          ...style,
        }}
      >
        <div className="spinner" style={{ width: "24px", height: "24px" }} />
        <span style={{ fontSize: "11.5px", color: "var(--muted)" }}>{loadingText}</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div
        className="table-container"
        style={{
          border: "1px solid var(--line)",
          padding: "32px 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          textAlign: "center",
          ...style,
        }}
      >
        <div style={{ color: "var(--muted)", opacity: 0.7 }}>
          {emptyIcon || <Inbox size={28} />}
        </div>
        <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)" }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={`table-container ${className}`}
      style={{
        border: "1px solid var(--line)",
        boxShadow: "none",
        ...style,
      }}
    >
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  width: col.width,
                  textAlign: col.align || "left",
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => {
            const key = keyExtractor ? keyExtractor(item, idx) : item.id ?? idx;
            return (
              <tr
                key={key}
                onClick={() => onRowClick && onRowClick(item)}
                style={onRowClick ? { cursor: "pointer" } : undefined}
                className={onRowClick ? "clickable-row" : ""}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      textAlign: col.align || "left",
                    }}
                  >
                    {col.render ? col.render(item, idx) : ((item as unknown) as Record<string, ReactNode>)[col.key] ?? "-"}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      {pagination && pagination.totalPages > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            borderTop: "1px solid var(--line)",
            background: "#f8fafc",
            fontSize: "11.5px",
            color: "var(--muted)",
          }}
        >
          <div>
            Halaman <strong style={{ color: "var(--text)" }}>{pagination.currentPage}</strong> dari{" "}
            <strong style={{ color: "var(--text)" }}>{pagination.totalPages}</strong>
            {pagination.totalRecords !== undefined && ` (${pagination.totalRecords} total data)`}
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              disabled={pagination.currentPage <= 1}
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              className="btn btn-secondary btn-sm"
              style={{ padding: "3px 8px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "3px" }}
            >
              <ChevronLeft size={13} />
              <span>Sebelumnya</span>
            </button>
            <button
              type="button"
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              className="btn btn-secondary btn-sm"
              style={{ padding: "3px 8px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "3px" }}
            >
              <span>Selanjutnya</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
