import { getGroupedWorkspaces } from "../services";
import { Accordion } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkspaceGroup } from "./WorkspaceGroup";

export function RecentWorkspacesSkeleton() {
    return (
        <Card className="w-full max-w-md border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Recent Websites
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 py-3 px-1 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0">
                        <Skeleton className="w-5 h-5 rounded-sm" />
                        <div className="flex-1 space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

export default async function RecentWorkspaces() {
    const groups = await getGroupedWorkspaces();

    if (groups.length === 0) return null;

    return (
        <Card className="w-full max-w-md border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Recent Websites
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {groups.map((group) => (
                        <WorkspaceGroup key={group.domain} group={group} />
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    );
}
