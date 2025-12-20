"use client";

interface CommentTabsProps {
    showResolved: boolean;
    onTabChange: (resolved: boolean) => void;
}

export function CommentTabs({ showResolved, onTabChange }: CommentTabsProps) {
    return (
        <div className="flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
            <button
                onClick={() => onTabChange(false)}
                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${!showResolved
                        ? "bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100"
                        : "text-muted-foreground hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
            >
                Active
            </button>
            <button
                onClick={() => onTabChange(true)}
                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${showResolved
                        ? "bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100"
                        : "text-muted-foreground hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
            >
                Resolved
            </button>
        </div>
    );
}
