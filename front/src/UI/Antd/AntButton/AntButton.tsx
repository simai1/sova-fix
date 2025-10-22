import { FC } from "react";
import styles from "./styles.module.scss";
import { Button } from "antd";
import { AntButtonProps } from "./types";
import classNames from "classnames";

const AntButton: FC<AntButtonProps> = ({ children, colorVariant, ...props }) => {
    return (
        <Button
            type="primary"
            rootClassName={classNames(styles.button, colorVariant && styles[colorVariant])}
            {...props}
        >
            {children}
        </Button>
    );
};

export default AntButton;
