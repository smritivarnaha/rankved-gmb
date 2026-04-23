import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex h-[60vh] items-center justify-center anim-fade">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--accent)]" />
        <p className="text-sm font-medium text-[var(--text-secondary)]">Loading Workspace...</p>
      </div>
    </div>
  );
}
