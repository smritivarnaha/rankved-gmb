/**
 * Skeleton Components — RankVed GBP Manager
 * Unified shimmer-based loading placeholders used across all pages.
 * Canonical file: @/components/ui/Skeleton
 * (imported as both "Skeleton" and "skeleton" — both resolve here)
 */

import React from "react";

// ── Base shimmer block ─────────────────────────────────────────────────────
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ width = "100%", height = 16, borderRadius = 6, className = "", style }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius, flexShrink: 0, ...style }}
    />
  );
}

// ── Profile sidebar item skeleton ──────────────────────────────────────────
export function ProfileItemSkeleton() {
  return (
    <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
      <Skeleton width={28} height={28} borderRadius={6} />
      <Skeleton height={12} style={{ flex: 1 }} />
    </div>
  );
}

// ── Profile card skeleton (dashboard grid) ─────────────────────────────────
export function ProfileCardSkeleton() {
  return (
    <div style={{
      background: "#fff", border: "1px solid #eaeaea",
      borderRadius: 12, overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
    }}>
      <div style={{ padding: "20px 20px 12px", display: "flex", alignItems: "center", gap: 12 }}>
        <Skeleton width={48} height={48} borderRadius={10} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <Skeleton height={14} width="70%" />
          <Skeleton height={11} width="45%" />
        </div>
      </div>
      <div style={{ padding: "12px 20px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 16 }}>
        <Skeleton height={10} width={60} />
        <Skeleton height={10} width={60} />
        <Skeleton height={10} width={60} />
      </div>
      <div style={{ padding: "12px 20px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 8 }}>
        <Skeleton height={32} style={{ flex: 1 }} borderRadius={8} />
        <Skeleton height={32} width={32} borderRadius={8} />
      </div>
    </div>
  );
}

// ── Stat card skeleton ─────────────────────────────────────────────────────
export function StatCardSkeleton() {
  return (
    <div style={{ background: "#fff", border: "1px solid #eaeaea", borderRadius: 10, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <Skeleton height={12} width="50%" />
        <Skeleton width={36} height={36} borderRadius="50%" />
      </div>
      <Skeleton height={32} width="40%" borderRadius={4} />
      <Skeleton height={10} width="60%" style={{ marginTop: 8 }} />
    </div>
  );
}

// ── Post card skeleton (live feed grid) ────────────────────────────────────
export function PostCardSkeleton() {
  return (
    <div style={{
      background: "#fff", border: "1px solid #eaeaea",
      borderRadius: 10, overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
    }}>
      <Skeleton height={160} borderRadius={0} />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Skeleton height={18} width={64} borderRadius={20} />
          <Skeleton height={12} width={80} />
        </div>
        <Skeleton height={13} />
        <Skeleton height={13} width="75%" />
        <Skeleton height={22} width={80} borderRadius={6} />
      </div>
      <div style={{ padding: "10px 16px", borderTop: "1px solid #f8f9fa", display: "flex", justifyContent: "space-between", background: "#fafafa" }}>
        <Skeleton height={26} width={60} borderRadius={6} />
        <div style={{ display: "flex", gap: 6 }}>
          <Skeleton width={28} height={28} borderRadius={6} />
          <Skeleton width={28} height={28} borderRadius={6} />
        </div>
      </div>
    </div>
  );
}

// ── Post schedule card skeleton (posts list) ───────────────────────────────
export function PostScheduleCardSkeleton() {
  return (
    <div style={{ background: "#fff", border: "1px solid #eaeaea", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
      <Skeleton width={56} height={56} borderRadius={10} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <Skeleton height={13} width="60%" />
        <Skeleton height={11} width="40%" />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Skeleton height={30} width={70} borderRadius={6} />
        <Skeleton height={30} width={30} borderRadius={6} />
      </div>
    </div>
  );
}

// ── Backup / table row skeleton ────────────────────────────────────────────
export function TableRowSkeleton() {
  return (
    <tr>
      <td style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Skeleton width={36} height={36} borderRadius={8} />
          <Skeleton height={13} width={160} />
        </div>
      </td>
      <td style={{ padding: "16px 20px" }}>
        <Skeleton height={12} width={100} />
      </td>
      <td style={{ padding: "16px 20px", textAlign: "right" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Skeleton height={30} width={70} borderRadius={6} />
          <Skeleton height={30} width={30} borderRadius={6} />
          <Skeleton height={30} width={30} borderRadius={6} />
        </div>
      </td>
    </tr>
  );
}

// ── Generic list skeleton ──────────────────────────────────────────────────
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Skeleton width={40} height={40} borderRadius={8} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <Skeleton height={13} width={`${60 + (i % 3) * 15}%`} />
            <Skeleton height={10} width={`${35 + (i % 2) * 20}%`} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page header skeleton ───────────────────────────────────────────────────
export function PageHeaderSkeleton() {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Skeleton height={24} width={200} borderRadius={6} />
        <Skeleton height={13} width={300} />
      </div>
      <Skeleton height={38} width={140} borderRadius={8} />
    </div>
  );
}

// ── Calendar cell skeleton ─────────────────────────────────────────────────
export function CalendarCellSkeleton() {
  return (
    <div style={{ background: "#fff", border: "1px solid #eaeaea", borderRadius: 8, padding: 8, minHeight: 80 }}>
      <Skeleton height={10} width={20} style={{ marginBottom: 6 }} borderRadius={4} />
      <Skeleton height={22} borderRadius={4} style={{ marginBottom: 4 }} />
      <Skeleton height={22} width="80%" borderRadius={4} />
    </div>
  );
}

// ── SkeletonProfileCard alias (used by profiles/page.tsx) ─────────────────
export { ProfileCardSkeleton as SkeletonProfileCard };
