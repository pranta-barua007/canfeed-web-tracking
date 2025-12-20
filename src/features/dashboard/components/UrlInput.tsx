"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function UrlInput() {
    const [url, setUrl] = useState("");
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url) {
            router.push(`/workspace?url=${encodeURIComponent(url)}`);
        }
    };

    return (
        <Card className="w-full max-w-md shadow-xl border-zinc-200 dark:border-zinc-800">
            <CardHeader>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    CanFeed
                </CardTitle>
                <CardDescription>
                    Enter a website URL to start dropping visual comments.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <Input
                        type="url"
                        placeholder="https://example.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        required
                    />
                    <Button type="submit" className="w-full font-medium">
                        Start Feedback Session
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
