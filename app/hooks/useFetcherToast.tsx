import { useEffect } from "react";
import type { Fetcher } from "react-router";
import { toast } from "react-hot-toast";

interface FetcherData {
    success: boolean;
    message: string;
}

interface UseFetcherToastOptions {
    loadingMessage?: string;
    toastId?: string;
}

export function useFetcherToast(
    fetcher: Fetcher<any>,
    options: UseFetcherToastOptions = {},
) {
    const {
        loadingMessage = "Handling request, please wait...",
        toastId = "fetcher-request",
    } = options;

    const fetcherData = fetcher.data as FetcherData | undefined;
    const fetcherState = fetcher.state;

    // Success/Error
    useEffect(() => {
        if (
            fetcherData &&
            "success" in fetcherData &&
            "message" in fetcherData
        ) {
            const { success, message } = fetcherData;
            if (success) {
                toast.success(message);
            } else {
                toast.error(message);
            }
        }
    }, [fetcherData]);

    // Loading
    useEffect(() => {
        if (fetcherState === "submitting") {
            toast.loading(loadingMessage, { id: toastId });
        } else {
            toast.dismiss(toastId);
        }
    }, [fetcherState, loadingMessage, toastId]);
}
