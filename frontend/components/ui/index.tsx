"use client";

import React, { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: "blue" | "green" | "purple" | "indigo" | "orange" | "red" | "yellow";
  subtext?: string;
}

const colorMap = {
  blue: { bg: "rgba(56, 189, 248, 0.12)", text: "#38BDF8", border: "rgba(56, 189, 248, 0.25)" },
  green: { bg: "rgba(16, 185, 129, 0.12)", text: "#10B981", border: "rgba(16, 185, 129, 0.25)" },
  purple: { bg: "rgba(139, 92, 246, 0.12)", text: "#8B5CF6", border: "rgba(139, 92, 246, 0.25)" },
  indigo: { bg: "rgba(99, 102, 241, 0.12)", text: "#6366F1", border: "rgba(99, 102, 241, 0.25)" },
  orange: { bg: "rgba(249, 115, 22, 0.12)", text: "#F97316", border: "rgba(249, 115, 22, 0.25)" },
  red: { bg: "rgba(239, 68, 68, 0.12)", text: "#EF4444", border: "rgba(239, 68, 68, 0.25)" },
  yellow: { bg: "rgba(245, 158, 11, 0.12)", text: "#F59E0B", border: "rgba(245, 158, 11, 0.25)" },
};

export function StatCard({ label, value, icon: Icon, color = "blue", subtext }: StatCardProps) {
  const theme = colorMap[color];
  return (
    <div className="stat-card" style={{ borderColor: theme.border }}>
      <div>
        <span className="stat-label">{label}</span>
        <div className="stat-number">{value}</div>
        {subtext && <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{subtext}</p>}
      </div>
      <div className="stat-icon" style={{ background: theme.bg, color: theme.text }}>
        <Icon size={24} />
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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem 1rem", gap: "1rem" }}>
      <div style={{ width: "2.5rem", height: "2.5rem", border: "3px solid var(--border-subtle)", borderTopColor: "var(--primary-light)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>{text}</p>
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="empty-state card">
      <div className="stat-icon" style={{ background: "rgba(255, 255, 255, 0.04)", color: "var(--text-muted)", width: "3.5rem", height: "3.5rem" }}>
        <Icon size={28} />
      </div>
      <h3 className="empty-title">{title}</h3>
      <p className="empty-desc">{description}</p>
      {action && <div style={{ marginTop: "0.5rem" }}>{action}</div>}
    </div>
  );
}

export function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(6px)", padding: "1.5rem" }}>
      <div className="card" style={{ width: "100%", maxWidth: "34rem", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border-subtle)" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>{title}</h2>
          <button onClick={onClose} style={{ color: "var(--text-muted)", fontSize: "1.25rem", padding: "0.25rem 0.5rem" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
