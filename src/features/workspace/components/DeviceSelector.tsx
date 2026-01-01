"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Monitor, Laptop, Tablet, Smartphone } from "lucide-react";

import { type DeviceSelectorProps } from "../types";

export function DeviceSelector({ device, onChange, scale, onScaleChange }: DeviceSelectorProps) {
    return (
        <div className="flex items-center gap-2">
            <Select value={device} onValueChange={onChange}>
                <SelectTrigger className="w-[180px] h-8 text-xs">
                    <SelectValue placeholder="Select Device" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="desktop-large">
                        <div className="flex items-center gap-2"><Monitor size={14} /> Desktop Large (1920x1080)</div>
                    </SelectItem>
                    <SelectItem value="desktop">
                        <div className="flex items-center gap-2"><Laptop size={14} /> Desktop (1440x900)</div>
                    </SelectItem>
                    <SelectItem value="tablet">
                        <div className="flex items-center gap-2"><Tablet size={14} /> iPad Mini (768x1024)</div>
                    </SelectItem>
                    <SelectItem value="mobile">
                        <div className="flex items-center gap-2"><Smartphone size={14} /> Mobile (375x667)</div>
                    </SelectItem>
                    <SelectItem value="pixel7">Pixel 7 (412x915)</SelectItem>
                    <SelectItem value="iphone">iPhone 14 (390x844)</SelectItem>
                </SelectContent>
            </Select>
            <div className="flex items-center gap-2 text-xs text-muted-foreground ml-2">
                <span>Scale: {Math.round(scale * 100)}%</span>
                <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={scale}
                    onChange={(e) => onScaleChange(parseFloat(e.target.value))}
                    className="w-20"
                />
            </div>
        </div>
    );
}
