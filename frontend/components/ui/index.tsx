"use client";

import React, { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

export { DataTable, type ColumnDef, type DataTableProps } from "./data-table";
export { SectionCard, type SectionCardProps } from "./section-card";
export { TableToolbar, type TableToolbarProps, type FilterTabOption } from "./table-toolbar";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: "blue" | "green" | "purple" | "orange" | "red" | "indigo" | "yellow";
  subtext?: string;
}

const colorMap: Record<string, { grad: string }> = {
  green: { grad: "var(--grad-green)" },
  blue: { grad: "var(--grad-blue)" },
  purple: { grad: "var(--grad-purple)" },
  orange: { grad: "var(--grad-orange)" },
  red: { grad: "linear-gradient(135deg, #e53e3e, #fc8181)" },
  indigo: { grad: "linear-gradient(135deg, #4338ca, #818cf8)" },
  yellow: { grad: "linear-gradient(135deg, #d97706, #fbbf24)" },
};

export function StatCard({ label, value, icon: Icon, color = "blue", subtext }: StatCardProps) {
  const { grad } = colorMap[color] || { grad: "var(--grad-blue)" };
  return (
    <div className={`stat`} style={{ background: grad }}>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-number">{value}</div>
        {subtext && <div style={{ fontSize: "10.5px", opacity: 0.88, marginTop: "2px" }}>{subtext}</div>}
      </div>
      <div className="stat-foot">
        <Icon size={15} style={{ opacity: 0.88 }} />
      </div>
    </div>
  );
}

export function StatusBadge({ status, label }: { status: "success" | "warning" | "error" | "info" | "neutral"; label: string }) {
  return (
    <span className={`badge badge-${status}`}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
      {label}
    </span>
  );
}

export function LoadingSpinner({ text = "Memuat data..." }: { text?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 16px", gap: "14px" }}>
      <div className="spinner" />
      <p style={{ color: "var(--muted)", fontSize: "13px" }}>{text}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <div style={{
        width: "56px",
        height: "56px",
        borderRadius: "var(--radius-card)",
        background: "rgba(18, 183, 106, 0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--green)",
      }}>
        <Icon size={28} />
      </div>
      <h3 className="empty-title">{title}</h3>
      <p className="empty-desc">{description}</p>
      {action && <div style={{ marginTop: "8px" }}>{action}</div>}
    </div>
  );
}

export function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button
            onClick={onClose}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "var(--bg)",
              border: "1px solid var(--line)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--muted)",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
