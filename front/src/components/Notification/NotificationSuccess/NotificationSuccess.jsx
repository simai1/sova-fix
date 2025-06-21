import React from "react";
import styles from './styles.module.scss'

const NotificationSuccess = (props) => {
    return (
        <div
            className={`${styles.SuccessStatus} ${
                props?.isHiding ? styles.hide : ""
            }`}
        >
            <div className={styles.content}>
                <div
                    onClick={() => props?.handleClose()}
                    className={styles.closeButton}
                >
                    X
                </div>
                <div className={styles.contentBox}>
                    <p className={styles.successHeader}>{props?.successHeader}</p>
                    <p className={styles.successText}>{props?.successText}</p>
                    <div className={styles.progressBar}></div>
                </div>
            </div>
        </div>
    );
};

export default NotificationSuccess;
