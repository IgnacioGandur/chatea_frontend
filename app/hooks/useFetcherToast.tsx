import { useEffect, useRef, useState } from "react";
import type { Fetcher } from "react-router";
import { toast } from "react-hot-toast";

interface FetcherData {
    success: boolean;
    message: string;
}

// interface UseFetcherToastOptions {
//     failMessage?: string;
//     loadingMessage?: string;
//     toastId?: string;
// }

interface ToastData {
    failMessage: string;
    loadingMessage: string;
    toastId: string;
}

export function useFetcherToast(fetcher: Fetcher<any>) {
    const [toastData, setToastData] = useState<ToastData>({
        failMessage: "Operation failed.",
        loadingMessage: "Handling request, please wait...",
        toastId: "fetcher-request",
    });

    const toastDataRef = useRef<ToastData>(toastData);

    useEffect(() => {
        toastDataRef.current = toastData;
    }, [toastData]);

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
                toast.error(toastDataRef.current.failMessage);
            }
        }
    }, [fetcherData]);

    // Loading
    useEffect(() => {
        const { loadingMessage, toastId } = toastDataRef.current;

        if (fetcherState === "submitting") {
            toast.loading(loadingMessage, { id: toastId });
        } else {
            toast.dismiss(toastId);
        }
    }, [fetcherState]);

    return setToastData;

    // Success/Error
    // useEffect(() => {
    //     if (
    //         fetcherData &&
    //         "success" in fetcherData &&
    //         "message" in fetcherData
    //     ) {
    //         const { success, message } = fetcherData;
    //         if (success) {
    //             toast.success(message);
    //         } else {
    //             toast.error(failMessage);
    //         }
    //     }
    // }, [fetcherData]);

    // Loading
    // useEffect(() => {
    //     if (fetcherState === "submitting") {
    //         toast.loading(loadingMessage, { id: toastId });
    //     } else {
    //         toast.dismiss(toastId);
    //     }
    // }, [fetcherState, loadingMessage, toastId]);
}
