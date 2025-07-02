import React, { useContext, useState } from "react";
import styles from "./Toggle.module.scss";
import { ChangeSetting, GetAllSettings } from "../../API/API";
import DataContext from "../../context";

const Toggle = (props) => {
    const [value, setValue] = useState(props?.initialValue)
    const { context } = useContext(DataContext);


    const handleChangeValue = (value) => {
        ChangeSetting(props?.settingId, value).then(response => {
            if (response?.status === 200) setValue(value)
            GetAllSettings().then(res => {
                context?.setSettingsList(res.data)
            })
        })
    }

    return (
        <label className={styles.toggleWrapper}>
            <span className={styles.label}>{props?.label}</span>
            <div className={styles.toggle}>
                <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => handleChangeValue(e.target.checked)}
                />
                <span className={styles.slider}></span>
            </div>
        </label>
    );
};

export default Toggle;
