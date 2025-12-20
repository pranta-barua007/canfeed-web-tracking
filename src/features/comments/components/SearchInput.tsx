"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

export function SearchInput() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [, startTransition] = useTransition();

    // Local state for debounced search
    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");

    // Debounce Logic
    useEffect(() => {
        const currentUrlSearch = searchParams.get("search") || "";
        if (searchTerm === currentUrlSearch) return;

        const handler = setTimeout(() => {
            const current = new URLSearchParams(searchParams.toString());

            if (searchTerm) {
                current.set("search", searchTerm);
            } else {
                current.delete("search");
            }

            // Reset offset on new search
            current.delete("offset");

            const search = current.toString();
            const query = search ? `?${search}` : "";

            startTransition(() => {
                router.push(`${window.location.pathname}${query}`);
            });
        }, 700); // 500ms debounce

        return () => clearTimeout(handler);
    }, [searchTerm, router, searchParams]); // Only run when input changes or URL updates

    return (
        <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search..."
                className="pl-8 h-9 text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
                <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-2.5 text-muted-foreground hover:text-zinc-900"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
