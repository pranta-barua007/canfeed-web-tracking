export const DEVICE_PRESETS: Record<string, { width: number; height: number }> = {
    "desktop-large": { width: 1920, height: 1080 },
    desktop: { width: 1440, height: 900 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 },
    pixel7: { width: 412, height: 915 },
    iphone: { width: 390, height: 844 },
};

export interface DeviceSelectorProps {
    device: string;
    onChange: (device: string) => void;
    scale: number;
    onScaleChange: (scale: number) => void;
}

export interface WorkspaceViewProps {
    targetUrl: string;
    width: number;
    height: number;
    scale: number;
    isCommentMode: boolean;
}
