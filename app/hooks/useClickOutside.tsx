import { useEffect, type RefObject } from "react";

export function useClickOutside(
    ref: RefObject<HTMLElement | null>,
    show: boolean,
    setShow: (state: boolean) => void,
) {
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref && ref.current && show) {
                if (!ref.current.contains(e.target as Node)) {
                    setShow(false);
                }
            }
        }

        function handleEscapeKey(e: KeyboardEvent) {
            if (e.key === "Escape" && show) {
                setShow(false);
            }
        }

        document.addEventListener("click", handleClick);
        document.addEventListener("keydown", handleEscapeKey);

        return () => {
            document.removeEventListener("click", handleClick);
            document.removeEventListener("keydown", handleEscapeKey);
        };
    }, [show, ref, setShow]);
}
