import React from "react";
import styles from './styles.module.scss'

const NotificationError = (props) => {
    return (
        <div className={`${styles.ErrorStatus} ${props?.isHiding ? styles.hide : ""}`}>
            <div className={styles.content}>
                <div
                    onClick={() => props?.handleClose()}
                    className={styles.closeButton}
                >
                    X
                </div>
                <div className={styles.contentBox}>
                    <p className={styles.errorHeader}>{props?.errorHeader}</p>
                    <p className={styles.errorText}>{props?.errorText}</p>
                    <div className={styles.progressBar}></div>
                </div>
            </div>
        </div>
    );
};

export default NotificationError;
