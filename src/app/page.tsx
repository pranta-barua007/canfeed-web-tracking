import { UrlInput } from "@/features/dashboard/components/UrlInput";
import RecentWorkspaces, { RecentWorkspacesSkeleton } from "@/features/dashboard/components/RecentWorkspaces";
import { Suspense } from "react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 gap-8">
      <UrlInput />
      <Suspense fallback={<RecentWorkspacesSkeleton />}>
        <RecentWorkspaces />
      </Suspense>
    </div>
  );
}
