import React from "react";
import { Circle, Group } from "react-konva";
import Konva from "konva";
import { CommentType } from "@/store";

interface CommentMarkerProps {
    x: number;
    y: number;
    comment?: CommentType;
    isNew?: boolean;
    isActive?: boolean;
    onSave?: (content: string) => void;
    onCancel?: () => void;
    onClick?: () => void;
}

export const CommentMarker = ({ x, y, isNew, isActive, onClick }: CommentMarkerProps) => {
    const groupRef = React.useRef<Konva.Group>(null);

    React.useEffect(() => {
        const node = groupRef.current;
        if (!node) return;

        if (isActive) {
            // Bouncy "Pop" animation with DELAY
            // We wait 300ms for scroll to (mostly) complete so user sees the pop
            node.to({
                scaleX: 1.3,
                scaleY: 1.3,
                duration: 0.3,
                delay: 0.3, // Wait for scroll
                easing: Konva.Easings.BackEaseOut,
                shadowOpacity: 0.6,
                shadowBlur: 10
            });
        } else {
            // Reset
            node.to({
                scaleX: 1,
                scaleY: 1,
                duration: 0.2,
                easing: Konva.Easings.EaseOut,
                shadowOpacity: 0.3,
                shadowBlur: 4
            });
        }
    }, [isActive]);

    return (
        <Group
            ref={groupRef}
            x={x}
            y={y}
            onClick={onClick}
            onTap={onClick}
            name="marker-group"
        >
            {/* Outer Ring */}
            <Circle
                radius={14}
                stroke={isNew ? "#3b82f6" : (isActive ? "#f97316" : "#eab308")} // Orange if active, else Yellow/Blue
                strokeWidth={isActive ? 3 : 2}
                fill="white"
                shadowColor="black"
                shadowBlur={4}
                shadowOpacity={0.3}
            />

            {/* Inner Dot */}
            <Circle
                radius={8}
                fill={isNew ? "#3b82f6" : (isActive ? "#f97316" : "#eab308")}
            />
        </Group>
    );
};
