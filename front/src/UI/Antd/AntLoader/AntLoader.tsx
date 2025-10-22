import { FC } from "react";
import styles from "./styles.module.scss";
import { AntLoaderProps } from "./types";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

const AntLoader: FC<AntLoaderProps> = ({ isLoading }) => {
    return (
        <Spin
            className={styles.container}
            indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
        />
    );
};

export default AntLoader;
