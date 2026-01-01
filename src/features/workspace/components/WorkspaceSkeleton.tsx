import { Skeleton } from "@/components/ui/skeleton";

export function WorkspaceSkeleton() {
    return (
        <div className="flex h-screen flex-col bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
            <header className="flex h-14 items-center gap-4 border-b bg-white px-6 dark:bg-zinc-950 shadow-sm z-50">
                <div className="w-24 h-6 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />
                <div className="w-48 h-8 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="ml-auto flex items-center gap-4">
                    <div className="w-32 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-full animate-pulse" />
                    <div className="w-24 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-md animate-pulse" />
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Skeleton */}
                <aside className="w-80 border-r bg-white dark:bg-zinc-950 flex flex-col">
                    <div className="p-4 border-b space-y-4">
                        <Skeleton className="h-8 w-full" />
                        <div className="flex gap-2">
                            <Skeleton className="h-8 flex-1" />
                            <Skeleton className="h-8 w-8" />
                        </div>
                    </div>
                    <div className="flex-1 p-4 space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                                <Skeleton className="h-16 w-full" />
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Main Content Skeleton */}
                <main className="flex-1 p-8 flex justify-center items-start">
                    <div className="w-full max-w-4xl aspect-video bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 animate-pulse flex items-center justify-center">
                        <div className="text-zinc-400 text-sm font-medium">Preparing workspace...</div>
                    </div>
                </main>
            </div>
        </div>
    );
}
