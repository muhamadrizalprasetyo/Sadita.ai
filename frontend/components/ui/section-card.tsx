"use client";

import React, { ReactNode, CSSProperties } from "react";

export interface SectionCardProps {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  padding?: string;
  style?: CSSProperties;
  className?: string;
}

export function SectionCard({
  title,
  subtitle,
  action,
  children,
  padding = "13px 15px",
  style,
  className = "",
}: SectionCardProps) {
  return (
    <div
      className={`card ${className}`}
      style={{
        padding,
        ...style,
      }}
    >
      {(title || action) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: subtitle ? "10px" : "8px",
            gap: "8px",
          }}
        >
          <div>
            {typeof title === "string" ? (
              <h2 style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text)", margin: 0 }}>
                {title}
              </h2>
            ) : (
              title
            )}
            {subtitle && (
              <p style={{ fontSize: "11px", color: "var(--muted)", margin: "1px 0 0" }}>
                {subtitle}
              </p>
            )}
          </div>
          {action && <div style={{ flexShrink: 0 }}>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
