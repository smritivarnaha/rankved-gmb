import { StatCardSkeleton, ProfileCardSkeleton, PageHeaderSkeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div style={{ fontFamily: "Inter, sans-serif", paddingBottom: 60 }} className="anim-fade">
      {/* Page header skeleton */}
      <PageHeaderSkeleton />

      {/* Stats strip skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>

      {/* Profile cards skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 16 }}>
        {Array.from({ length: 8 }).map((_, i) => <ProfileCardSkeleton key={i} />)}
      </div>
    </div>
  );
}
