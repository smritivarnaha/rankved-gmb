import { StatCardSkeleton, ProfileCardSkeleton, PageHeaderSkeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div style={{ fontFamily: "Inter, sans-serif", paddingBottom: 60 }} className="anim-fade">
      {/* Page header skeleton */}
      <PageHeaderSkeleton />

      {/* Stats strip — responsive via .dash-skel-stats */}
      <div className="dash-skel-stats">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>

      {/* Profile cards — responsive via .dash-skel-profiles */}
      <div className="dash-skel-profiles">
        {Array.from({ length: 8 }).map((_, i) => <ProfileCardSkeleton key={i} />)}
      </div>
    </div>
  );
}
