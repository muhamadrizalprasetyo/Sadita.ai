"use client";

import React, { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export function BackToTop({
  threshold = 80,
  style,
  className = "",
}: {
  threshold?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const y =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;
      setVisible(y > threshold);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className={`back-to-top-btn ${className}`}
      aria-label="Kembali ke atas"
      title="Kembali ke atas"
      style={{
        position: "fixed",
        bottom: "5.6rem", // Directly above SI KOBAR FAB (bottom: 2rem)
        right: "2.3rem",
        width: "44px", // Apple HIG 44px minimum touch target
        height: "44px",
        borderRadius: "50%",
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        color: "#2563eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 14px rgba(15, 23, 42, 0.14), 0 1px 3px rgba(0, 0, 0, 0.08)",
        cursor: "pointer",
        zIndex: 998,
        transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.background = "#2563eb";
        e.currentTarget.style.color = "#ffffff";
        e.currentTarget.style.boxShadow = "0 8px 20px rgba(37, 99, 235, 0.28)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.background = "#ffffff";
        e.currentTarget.style.color = "#2563eb";
        e.currentTarget.style.boxShadow = "0 4px 14px rgba(15, 23, 42, 0.14), 0 1px 3px rgba(0, 0, 0, 0.08)";
      }}
    >
      <ArrowUp size={20} strokeWidth={2.4} />
    </button>
  );
}
