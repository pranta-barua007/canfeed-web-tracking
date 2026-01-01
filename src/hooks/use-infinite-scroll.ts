import { useState, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

interface UseInfiniteScrollProps<T> {
    fetchData: (offset: number) => Promise<T[]>;
    onDataLoaded: (data: T[], isReset: boolean) => void;
    initialHasMore?: boolean;
    limit?: number;
    triggerDelay?: number;
}

export function useInfiniteScroll<T>({
    fetchData,
    onDataLoaded,
    initialHasMore = true,
    limit = 20,
    triggerDelay = 0
}: UseInfiniteScrollProps<T>) {
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [offset, setOffset] = useState(0);

    // Use refs to stabilize external callbacks without lint errors
    const fetchDataRef = useRef(fetchData);
    fetchDataRef.current = fetchData;
    const onDataLoadedRef = useRef(onDataLoaded);
    onDataLoadedRef.current = onDataLoaded;

    const loadMore = useCallback(async (isReset: boolean = false) => {
        if (loading || (!hasMore && !isReset)) return;

        setLoading(true);
        const currentOffset = isReset ? 0 : offset;

        try {
            const newData = await fetchDataRef.current(currentOffset);

            setHasMore(newData.length >= limit);
            onDataLoadedRef.current(newData, isReset);

            if (isReset) {
                setOffset(newData.length);
            } else {
                setOffset(prev => prev + newData.length);
            }
        } catch (error) {
            console.error("Failed to load more data:", error);
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore, offset, limit]);

    const { ref } = useInView({
        delay: triggerDelay,
        onChange: (inView) => {
            if (inView && hasMore && !loading) {
                loadMore(false);
            }
        },
    });

    const reset = useCallback(() => {
        setHasMore(true);
        setOffset(0);
        loadMore(true);
    }, [loadMore]);

    return {
        ref,
        loading,
        hasMore,
        reset,
        loadMore,
    };
}
