import { Monitor, Smartphone, Tablet } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeviceIconProps {
    width: number;
    className?: string;
}

export function DeviceIcon({ width, className }: DeviceIconProps) {
    if (width < 500) return <Smartphone className={cn("h-3 w-3", className)} />;
    if (width < 1000) return <Tablet className={cn("h-3 w-3", className)} />;
    return <Monitor className={cn("h-3 w-3", className)} />;
}
