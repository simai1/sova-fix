import { FC } from "react";
import styles from "./styles.module.scss";

interface ConfirmProps {
    title?: string;
    message: string;
    handleConfirm: () => void;
    handleCancel: () => void;
    isVisible: boolean;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
}

const Confirm: FC<ConfirmProps> = ({
    title = "Внимание!",
    message,
    handleConfirm,
    handleCancel,
    isVisible,
    confirmText,
    cancelText,
    danger,
}) => {
    if (!isVisible) return null;

    const onOverlayClick = () => {
        handleCancel();
    };

    const onContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
    };

    return (
        <div className={styles.confirmOverlay} onClick={onOverlayClick}>
            <div
                className={styles.confirmAlert}
                onClick={onContentClick}
            >
                <div className={styles.content}>
                    <div className={styles.header}>
                        <strong>{title}</strong>
                        <span className={styles.close} onClick={handleCancel}>
                            ×
                        </span>
                    </div>
                    <p className={styles.message}>{message}</p>
                    <div className={styles.buttons}>
                        <button className={styles.cancelBtn} onClick={handleCancel}>
                            {cancelText ? cancelText : "Отмена"}
                        </button>
                        <button
                            className={danger ? `${styles.confirmBtn} ${styles.danger}` : styles.confirmBtn}
                            onClick={handleConfirm}
                        >
                            {confirmText ? confirmText : "Подтвердить"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Confirm;
