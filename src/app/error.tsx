'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error)
    }, [error])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-8 text-center space-y-6">
                <div className="flex justify-center">
                    <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-full">
                        <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-500" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                        Something went wrong
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                        We encountered an unexpected error. Don&apos;t worry, your feedback is safe.
                        Try refreshing the page or head back to the dashboard.
                    </p>
                </div>

                {error.digest && (
                    <div className="bg-zinc-100 dark:bg-zinc-800/50 p-2 rounded text-[10px] font-mono text-zinc-400 break-all">
                        Error ID: {error.digest}
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                        onClick={() => reset()}
                        className="flex-1 bg-zinc-900 dark:bg-zinc-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium"
                    >
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Try again
                    </Button>
                    <Button
                        variant="outline"
                        asChild
                        className="flex-1 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium"
                    >
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Go home
                        </Link>
                    </Button>
                </div>
            </div>

            <p className="mt-8 text-xs text-zinc-400 dark:text-zinc-600">
                &copy; {new Date().getFullYear()} CanFeed. All rights reserved.
            </p>
        </div>
    )
}