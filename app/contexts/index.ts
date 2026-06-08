import { createContext, type Dispatch, type SetStateAction } from "react";

export interface ToastData {
    failMessage: string;
    loadingMessage: string;
    toastId: string;
}

export type ToastContextType = {
    setToastData: Dispatch<SetStateAction<ToastData>>;
};

export const ToastContext = createContext<ToastContextType>(
    {} as ToastContextType,
);
