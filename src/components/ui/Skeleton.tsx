"use client";

import React from "react";

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`skeleton-shimmer ${className || ""}`}
      style={{
        background: "#f1f5f9",
        borderRadius: "4px",
        ...style,
      }}
    />
  );
}
