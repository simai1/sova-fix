import React from "react";
import styles from "./Toggle.module.scss";

const Toggle = (props) => {
    return (
        <label className={styles.toggleWrapper}>
            <span className={styles.label}>{props?.label}</span>
            <div className={styles.toggle}>
                <input
                    type="checkbox"
                    checked={props?.checked}
                    onChange={(e) => props?.onChange(e.target.checked)}
                />
                <span className={styles.slider}></span>
            </div>
        </label>
    );
};

export default Toggle;
