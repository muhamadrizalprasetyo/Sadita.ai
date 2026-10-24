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
      style={style}
    >
      <ArrowUp size={20} strokeWidth={2.4} />
    </button>
  );
}

