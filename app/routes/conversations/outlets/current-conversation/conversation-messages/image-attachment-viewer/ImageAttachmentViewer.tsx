import styles from "./ImageAttachmentViewer.module.css";
import classes from "~/css/classes.module.css";
import { useEffect, useRef, useState } from "react";

interface ImageAttachmentViewerProps {
    className?: string;
    imageClassName?: string;
    src: string;
    alt: string;
}

export default function ImageAttachmentViewer({
    className,
    imageClassName,
    src,
    alt,
}: ImageAttachmentViewerProps) {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const openImageDialogRef = useRef<HTMLDialogElement | null>(null);

    function openDialog() {
        setIsOpen(true);
    }

    function closeDialog() {
        setIsOpen(false);
    }

    useEffect(() => {
        const dialog = openImageDialogRef.current;

        if (!dialog) return;

        if (isOpen && !dialog.open) {
            dialog.showModal();
        } else if (!isOpen && dialog.open) {
            dialog.close();
        }
    }, [isOpen]);

    return (
        <div
            className={`
                ${className ?? ""}
                ${styles.imageAttachmentViewer}
            `}
        >
            <button
                type="button"
                aria-label={
                    alt
                        ? `View larger size image: ${alt}`
                        : "View full size image"
                }
                onClick={openDialog}
                className={`
                    ${classes.gridCenter}
                    ${styles.previewButton}
                `}
            >
                <img
                    className={`
                    ${imageClassName ?? ""}
                    ${styles.previewImage}
                    ${classes.correctImage}
                `}
                    src={src}
                    alt={alt}
                />
                <div
                    className={`
                    ${classes.gridCenter}
                    ${classes.positionAbsoluteCenter}
                    ${styles.textOverlay}
                `}
                >
                    <span
                        aria-hidden
                        className={`
                            ${classes.textBoldSmall}
                            ${styles.text}
                        `}
                    >
                        Click to open
                    </span>
                </div>
            </button>
            <dialog
                onClose={closeDialog}
                ref={openImageDialogRef}
                className={`
                    ${styles.openedImageViewer}
                    ${classes.positionAbsoluteCenterWithTransform}
                `}
            >
                <div className={styles.dialogContent}>
                    <img
                        className={`
                            ${styles.fullSizeImage}
                            ${classes.correctImage}
                        `}
                        src={src}
                        alt={alt}
                    />
                    <p className={styles.filename}>Filename: {alt}</p>
                    <button
                        aria-label="Close this modal"
                        onClick={closeDialog}
                        className={`
                            ${classes.gridCenter}
                            ${classes.outline1}
                            ${styles.closeDialogButton}
                        `}
                    >
                        <span
                            aria-hidden
                            className="material-symbols-rounded"
                        >
                            close
                        </span>
                    </button>
                </div>
            </dialog>
        </div>
    );
}
