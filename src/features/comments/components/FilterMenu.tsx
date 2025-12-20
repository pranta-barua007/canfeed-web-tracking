"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem
} from "@/components/ui/dropdown-menu";
import { Filter } from "lucide-react";

export function FilterMenu() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Time Filter (Single Select)
    const currentFilterTime = searchParams.get("time") || "all";

    // Device Filter (Multi Select)
    // storage format: "mobile,tablet"
    const currentDeviceStr = searchParams.get("deviceFilter") || "";
    const selectedDevices = currentDeviceStr ? currentDeviceStr.split(",") : [];

    const handleTimeChange = (value: string) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        if (value === "all") {
            current.delete("time");
        } else {
            current.set("time", value);
        }
        current.delete("offset");
        router.push(`${window.location.pathname}?${current.toString()}`);
    };

    const handleDeviceToggle = (value: string) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        let newDevices = [...selectedDevices];

        if (newDevices.includes(value)) {
            newDevices = newDevices.filter(d => d !== value);
        } else {
            newDevices.push(value);
        }

        if (newDevices.length === 0) {
            current.delete("deviceFilter");
        } else {
            current.set("deviceFilter", newDevices.join(","));
        }

        current.delete("offset");
        router.push(`${window.location.pathname}?${current.toString()}`);
    };

    const hasActiveFilters = currentFilterTime !== 'all' || selectedDevices.length > 0;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 w-9 p-0 bg-white dark:bg-zinc-900">
                    <Filter className={`h-4 w-4 ${hasActiveFilters ? 'text-blue-500' : 'text-zinc-500'}`} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Time Range</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={currentFilterTime} onValueChange={handleTimeChange}>
                    <DropdownMenuRadioItem value="all">All Time</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="hour">Last Hour</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="day">Last 24 Hours</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="week">Last Week</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>

                <DropdownMenuSeparator />

                <DropdownMenuLabel className="text-xs text-muted-foreground">Device Context</DropdownMenuLabel>
                {/* Multi-Select Checkboxes */}
                <DropdownMenuCheckboxItem
                    checked={selectedDevices.includes("mobile")}
                    onCheckedChange={() => handleDeviceToggle("mobile")}
                >
                    Mobile (&lt;500px)
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                    checked={selectedDevices.includes("tablet")}
                    onCheckedChange={() => handleDeviceToggle("tablet")}
                >
                    Tablet (500-1000px)
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                    checked={selectedDevices.includes("desktop")}
                    onCheckedChange={() => handleDeviceToggle("desktop")}
                >
                    Desktop (&gt;1000px)
                </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
